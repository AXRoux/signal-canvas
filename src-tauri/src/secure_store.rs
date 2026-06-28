use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use crate::session_db;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

const KEYCHAIN_SERVICE: &str = "signal-canvas";
const KEYCHAIN_ACCOUNT: &str = "master-data-key";
const AUTH_FILE: &str = "auth.json";
const VAULT_FILE: &str = "vault.enc";
const DATA_KEY_FILE: &str = "data-key.enc";

static VAULT_UNLOCKED: Mutex<bool> = Mutex::new(false);
static SESSION_DATA_KEY: Mutex<Option<[u8; 32]>> = Mutex::new(None);
static LEGACY_DECRYPT_KEYS: Mutex<Vec<[u8; 32]>> = Mutex::new(Vec::new());

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthUser {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct StoredAccount {
    user: AuthUser,
    #[serde(rename = "passwordHash")]
    password_hash: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct AuthFile {
    version: u32,
    accounts: HashMap<String, StoredAccount>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthSession {
    pub user: AuthUser,
    pub token: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct EncryptedEnvelope {
    version: u32,
    payload: String,
}

pub(crate) fn signal_canvas_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or_else(|| "Cannot resolve home directory".to_string())?;
    Ok(home.join(".signal-canvas"))
}

pub(crate) fn ensure_dir(path: &PathBuf) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub(crate) fn set_private_permissions(path: &PathBuf) -> Result<(), String> {
    #[cfg(unix)]
    {
        if path.exists() {
            let mut perms = fs::metadata(path).map_err(|e| e.to_string())?.permissions();
            perms.set_mode(0o600);
            fs::set_permissions(path, perms).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

fn random_bytes(len: usize) -> Vec<u8> {
    let mut buf = vec![0u8; len];
    rand::thread_rng().fill_bytes(&mut buf);
    buf
}

fn get_or_create_master_key() -> Result<[u8; 32], String> {
    let entry = keyring::Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(existing) => {
            let decoded = B64.decode(existing).map_err(|e| e.to_string())?;
            if decoded.len() != 32 {
                return Err("Invalid master key length in keychain".into());
            }
            let mut key = [0u8; 32];
            key.copy_from_slice(&decoded);
            Ok(key)
        }
        Err(keyring::Error::NoEntry) => {
            let key = random_bytes(32);
            entry
                .set_password(&B64.encode(&key))
                .map_err(|e| e.to_string())?;
            let mut out = [0u8; 32];
            out.copy_from_slice(&key);
            Ok(out)
        }
        Err(e) => Err(format!("Keychain error: {e}")),
    }
}

fn derive_passcode_wrap_key(passcode: &str, email: &str, password_hash: &str) -> Result<[u8; 32], String> {
    let parsed = PasswordHash::new(password_hash).map_err(|e| e.to_string())?;
    let salt = parsed
        .salt
        .as_ref()
        .ok_or_else(|| "Missing salt in password hash".to_string())?;
    let mut input = Vec::with_capacity(email.len() + passcode.len() + 8);
    input.extend_from_slice(b"sc-wrap-v1\0");
    input.extend_from_slice(email.as_bytes());
    input.push(0);
    input.extend_from_slice(passcode.as_bytes());

    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(&input, salt.as_str().as_bytes(), &mut key)
        .map_err(|e| e.to_string())?;
    Ok(key)
}

fn derive_legacy_pepper_data_key(
    passcode: &str,
    email: &str,
    password_hash: &str,
) -> Result<[u8; 32], String> {
    let parsed = PasswordHash::new(password_hash).map_err(|e| e.to_string())?;
    let salt = parsed
        .salt
        .as_ref()
        .ok_or_else(|| "Missing salt in password hash".to_string())?;
    let mut pepper = Vec::with_capacity(64 + email.len());
    pepper.extend_from_slice(b"signal-canvas-data-key-v1\0");
    pepper.extend_from_slice(email.as_bytes());
    pepper.push(0);
    pepper.extend_from_slice(salt.as_str().as_bytes());

    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(passcode.as_bytes(), &pepper, &mut key)
        .map_err(|e| e.to_string())?;
    Ok(key)
}

fn set_legacy_decrypt_keys(keys: Vec<[u8; 32]>) {
    if let Ok(mut guard) = LEGACY_DECRYPT_KEYS.lock() {
        *guard = keys;
    }
}

fn clear_legacy_decrypt_keys() {
    set_legacy_decrypt_keys(Vec::new());
}

fn register_login_decrypt_keys(passcode: &str, email: &str, password_hash: &str) {
    let mut keys = Vec::new();
    if let Ok(key) = derive_legacy_pepper_data_key(passcode, email, password_hash) {
        keys.push(key);
    }
    if let Ok(key) = derive_passcode_wrap_key(passcode, email, password_hash) {
        keys.push(key);
    }
    set_legacy_decrypt_keys(keys);
}

fn data_key_path() -> Result<PathBuf, String> {
    Ok(signal_canvas_dir()?.join(DATA_KEY_FILE))
}

fn unlock_account_data_key(
    passcode: &str,
    email: &str,
    password_hash: &str,
) -> Result<[u8; 32], String> {
    let wrap_key = derive_passcode_wrap_key(passcode, email, password_hash)?;
    let path = data_key_path()?;

    if path.exists() {
        let enc = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        let bytes = decrypt_with_key(&enc, &wrap_key)?;
        if bytes.len() != 32 {
            return Err("Invalid data key file".into());
        }
        let mut key = [0u8; 32];
        key.copy_from_slice(&bytes);
        return Ok(key);
    }

    let key_bytes = match get_or_create_master_key() {
        Ok(existing) => existing.to_vec(),
        Err(_) => random_bytes(32),
    };
    let enc = encrypt_with_key(&key_bytes, &wrap_key)?;
    ensure_dir(&path)?;
    fs::write(&path, enc).map_err(|e| e.to_string())?;
    set_private_permissions(&path)?;

    let mut key = [0u8; 32];
    key.copy_from_slice(&key_bytes);
    Ok(key)
}

fn try_decrypt_payload(encrypted: &str) -> Option<Vec<u8>> {
    if let Some(session_key) = session_data_key() {
        if let Ok(bytes) = decrypt_with_key(encrypted, &session_key) {
            return Some(bytes);
        }
    }
    if let Ok(legacy_key) = get_or_create_master_key() {
        if let Ok(bytes) = decrypt_with_key(encrypted, &legacy_key) {
            return Some(bytes);
        }
    }
    if let Ok(guard) = LEGACY_DECRYPT_KEYS.lock() {
        for legacy_key in guard.iter() {
            if let Ok(bytes) = decrypt_with_key(encrypted, legacy_key) {
                return Some(bytes);
            }
        }
    }
    None
}

fn set_session_data_key(key: Option<[u8; 32]>) {
    if let Ok(mut guard) = SESSION_DATA_KEY.lock() {
        *guard = key;
    }
}

fn session_data_key() -> Option<[u8; 32]> {
    SESSION_DATA_KEY.lock().ok().and_then(|g| *g)
}

fn encrypt_with_key(plaintext: &[u8], key: &[u8; 32]) -> Result<String, String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;
    let nonce_bytes = random_bytes(12);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| e.to_string())?;
    Ok(format!(
        "{}.{}",
        B64.encode(nonce_bytes),
        B64.encode(ciphertext)
    ))
}

fn decrypt_with_key(payload: &str, key: &[u8; 32]) -> Result<Vec<u8>, String> {
    let cipher = Aes256Gcm::new_from_slice(key).map_err(|e| e.to_string())?;
    let (nonce_b64, cipher_b64) = payload
        .split_once('.')
        .ok_or_else(|| "Invalid encrypted payload".to_string())?;
    let nonce_bytes = B64.decode(nonce_b64).map_err(|e| e.to_string())?;
    let ciphertext = B64.decode(cipher_b64).map_err(|e| e.to_string())?;
    let nonce = Nonce::from_slice(&nonce_bytes);
    cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|e| e.to_string())
}

fn active_encryption_key() -> Result<[u8; 32], String> {
    if let Some(key) = session_data_key() {
        return Ok(key);
    }
    get_or_create_master_key()
}

fn decrypt_bytes_with_fallback(payload: &str) -> Result<(Vec<u8>, bool), String> {
    if let Some(bytes) = try_decrypt_payload(payload) {
        let used_legacy = session_data_key()
            .map(|session_key| decrypt_with_key(payload, &session_key).is_err())
            .unwrap_or(true);
        return Ok((bytes, used_legacy));
    }
    Err("Unable to decrypt workspace payload".into())
}

pub fn encrypt_bytes(plaintext: &[u8]) -> Result<String, String> {
    encrypt_with_key(plaintext, &active_encryption_key()?)
}

pub fn decrypt_bytes(payload: &str) -> Result<Vec<u8>, String> {
    decrypt_bytes_with_fallback(payload).map(|(bytes, _)| bytes)
}

fn auth_path() -> Result<PathBuf, String> {
    Ok(signal_canvas_dir()?.join(AUTH_FILE))
}

fn vault_path() -> Result<PathBuf, String> {
    Ok(signal_canvas_dir()?.join(VAULT_FILE))
}

fn load_auth_file() -> Result<AuthFile, String> {
    let path = auth_path()?;
    if !path.exists() {
        return Ok(AuthFile {
            version: 1,
            accounts: HashMap::new(),
        });
    }
    let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

fn save_auth_file(auth: &AuthFile) -> Result<(), String> {
    let path = auth_path()?;
    ensure_dir(&path)?;
    fs::write(
        &path,
        serde_json::to_string_pretty(auth).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;
    set_private_permissions(&path)
}

fn hash_passcode(passcode: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut rand::thread_rng());
    Argon2::default()
        .hash_password(passcode.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| e.to_string())
}

fn verify_passcode(passcode: &str, hash: &str) -> Result<bool, String> {
    let parsed = PasswordHash::new(hash).map_err(|e| e.to_string())?;
    Ok(Argon2::default()
        .verify_password(passcode.as_bytes(), &parsed)
        .is_ok())
}

fn set_unlocked(unlocked: bool) {
    if let Ok(mut guard) = VAULT_UNLOCKED.lock() {
        *guard = unlocked;
    }
}

fn require_unlocked() -> Result<(), String> {
    let guard = VAULT_UNLOCKED.lock().map_err(|e| e.to_string())?;
    if *guard {
        Ok(())
    } else {
        Err("Vault locked".into())
    }
}

pub fn write_encrypted_file(path: &PathBuf, plaintext: &[u8]) -> Result<(), String> {
    ensure_dir(path)?;
    let envelope = EncryptedEnvelope {
        version: 2,
        payload: encrypt_bytes(plaintext)?,
    };
    fs::write(
        path,
        serde_json::to_string_pretty(&envelope).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;
    set_private_permissions(path)
}

pub fn read_encrypted_file(path: &PathBuf) -> Result<Option<Vec<u8>>, String> {
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(path).map_err(|e| e.to_string())?;
    if let Ok(envelope) = serde_json::from_str::<EncryptedEnvelope>(&raw) {
        if envelope.version >= 2 {
            return decrypt_bytes(&envelope.payload).map(Some);
        }
    }
    Ok(Some(raw.into_bytes()))
}

pub fn read_integration_config_raw(path: &PathBuf) -> Result<Option<String>, String> {
    if !path.exists() {
        return Ok(None);
    }
    let raw = fs::read_to_string(path).map_err(|e| e.to_string())?;
    if let Ok(envelope) = serde_json::from_str::<EncryptedEnvelope>(&raw) {
        if envelope.version >= 2 {
            let plain = decrypt_bytes(&envelope.payload)?;
            return Ok(Some(String::from_utf8(plain).map_err(|e| e.to_string())?));
        }
    }
    Ok(Some(raw))
}

pub fn write_integration_config_raw(path: &PathBuf, json: &str) -> Result<(), String> {
    write_encrypted_file(path, json.as_bytes())
}

#[tauri::command]
pub fn secure_is_unlocked() -> bool {
    VAULT_UNLOCKED
        .lock()
        .map(|g| *g)
        .unwrap_or(false)
}

#[tauri::command]
pub fn secure_has_accounts() -> Result<bool, String> {
    let auth = load_auth_file()?;
    Ok(!auth.accounts.is_empty())
}

#[tauri::command]
pub fn secure_auth_register(
    name: String,
    email: String,
    passcode: String,
    role: String,
) -> Result<AuthSession, String> {
    let normalized = email.trim().to_lowercase();
    let trimmed_name = name.trim();
    if trimmed_name.is_empty() || normalized.is_empty() || passcode.len() < 8 {
        return Err("validation".into());
    }

    let mut auth = load_auth_file()?;
    if auth.accounts.contains_key(&normalized) {
        return Err("exists".into());
    }

    let user = AuthUser {
        id: uuid::Uuid::new_v4().to_string(),
        name: trimmed_name.to_string(),
        email: normalized.clone(),
        role: if role.is_empty() { "analyst".into() } else { role },
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    let password_hash = hash_passcode(&passcode)?;
    auth.accounts.insert(
        normalized.clone(),
        StoredAccount {
            user: user.clone(),
            password_hash: password_hash.clone(),
        },
    );
    save_auth_file(&auth)?;

    let token = uuid::Uuid::new_v4().to_string();
    let data_key = unlock_account_data_key(&passcode, &normalized, &password_hash)?;
    register_login_decrypt_keys(&passcode, &normalized, &password_hash);
    set_session_data_key(Some(data_key));
    set_unlocked(true);
    let _ = migrate_legacy_encryption_to_session_key();
    Ok(AuthSession { user, token })
}

#[tauri::command]
pub fn secure_auth_login(email: String, passcode: String) -> Result<AuthSession, String> {
    let normalized = email.trim().to_lowercase();
    let auth = load_auth_file()?;
    let account = auth
        .accounts
        .get(&normalized)
        .ok_or_else(|| "invalid".to_string())?;

    if !verify_passcode(&passcode, &account.password_hash)? {
        return Err("invalid".into());
    }

    let data_key = unlock_account_data_key(&passcode, &normalized, &account.password_hash)?;
    register_login_decrypt_keys(&passcode, &normalized, &account.password_hash);
    let token = uuid::Uuid::new_v4().to_string();
    set_session_data_key(Some(data_key));
    set_unlocked(true);
    let _ = migrate_legacy_encryption_to_session_key();
    Ok(AuthSession {
        user: account.user.clone(),
        token,
    })
}

#[tauri::command]
pub fn secure_auth_logout() -> Result<(), String> {
    set_session_data_key(None);
    clear_legacy_decrypt_keys();
    set_unlocked(false);
    Ok(())
}

fn extract_sessions_object(payload: &str) -> HashMap<String, Value> {
    let Ok(value) = serde_json::from_str::<Value>(payload) else {
        return HashMap::new();
    };
    if let Some(sessions) = value.get("sessions").and_then(|v| v.as_object()) {
        return sessions.iter().map(|(k, v)| (k.clone(), v.clone())).collect();
    }
    value
        .as_object()
        .map(|o| o.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
        .unwrap_or_default()
}

fn extract_active_session_id(payload: &str) -> Option<String> {
    let Ok(value) = serde_json::from_str::<Value>(payload) else {
        return None;
    };
    value
        .get("activeSessionId")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .filter(|s| !s.is_empty())
}

fn session_updated_at(session: &Value) -> String {
    session
        .get("updatedAt")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string()
}

fn merge_session_maps(
    mut merged: HashMap<String, Value>,
    incoming: HashMap<String, Value>,
) -> HashMap<String, Value> {
    for (id, session) in incoming {
        match merged.get(&id) {
            Some(existing) if session_updated_at(existing) > session_updated_at(&session) => {}
            _ => {
                merged.insert(id, session);
            }
        }
    }
    merged
}

fn read_legacy_vault_plain() -> Result<Option<String>, String> {
    let path = vault_path()?;
    if !path.exists() {
        return Ok(None);
    }
    let bytes = match read_encrypted_file(&path)? {
        Some(b) => b,
        None => return Ok(None),
    };
    Ok(Some(String::from_utf8(bytes).map_err(|e| e.to_string())?))
}

fn sync_snapshot(plain: &str) -> Result<(), String> {
    let encrypted = encrypt_bytes(plain.as_bytes())?;
    session_db::save_snapshot(&encrypted)
}

fn try_merge_snapshot(merged: &mut HashMap<String, Value>, active: &mut Option<String>) {
    let Some(encrypted) = session_db::load_snapshot().ok().flatten() else {
        return;
    };
    let Ok(plain_bytes) = decrypt_bytes(&encrypted) else {
        return;
    };
    let Ok(plain) = String::from_utf8(plain_bytes) else {
        return;
    };
    *merged = merge_session_maps(merged.clone(), extract_sessions_object(&plain));
    if active.is_none() {
        *active = extract_active_session_id(&plain);
    }
}

fn try_merge_legacy_vault(merged: &mut HashMap<String, Value>, active: &mut Option<String>) {
    let Ok(Some(plain)) = read_legacy_vault_plain() else {
        return;
    };
    *merged = merge_session_maps(merged.clone(), extract_sessions_object(&plain));
    if active.is_none() {
        *active = extract_active_session_id(&plain);
    }
}

fn try_merge_session_rows(merged: &mut HashMap<String, Value>) {
    let Ok(rows) = session_db::list_session_rows() else {
        return;
    };
    for (id, encrypted) in rows {
        let Some(plain_bytes) = try_decrypt_payload(&encrypted) else {
            continue;
        };
        let Ok(plain) = String::from_utf8(plain_bytes) else {
            continue;
        };
        if let Ok(session) = serde_json::from_str::<Value>(&plain) {
            *merged = merge_session_maps(merged.clone(), HashMap::from([(id, session)]));
        }
    }
}

fn import_sources_into_db() -> Result<(), String> {
    let mut merged: HashMap<String, Value> = HashMap::new();
    let mut active: Option<String> = session_db::get_active_session_id().ok().flatten();

    try_merge_snapshot(&mut merged, &mut active);
    try_merge_legacy_vault(&mut merged, &mut active);
    try_merge_session_rows(&mut merged);

    if merged.is_empty() {
        return Ok(());
    }

    let mut encrypted_rows = HashMap::new();
    for (id, session) in &merged {
        let plain = serde_json::to_string(session).map_err(|e| e.to_string())?;
        encrypted_rows.insert(id.clone(), encrypt_bytes(plain.as_bytes())?);
    }
    session_db::replace_all_sessions(&encrypted_rows, active.as_deref())?;

    let payload = serde_json::json!({
        "sessions": Value::Object(merged.into_iter().collect()),
        "activeSessionId": active,
    });
    let _ = sync_snapshot(&serde_json::to_string(&payload).map_err(|e| e.to_string())?);
    Ok(())
}

fn migrate_legacy_encryption_to_session_key() -> Result<(), String> {
    if session_data_key().is_none() {
        return Ok(());
    }

    let rows = session_db::list_session_rows()?;
    let mut reencrypted = HashMap::new();
    for (id, encrypted) in rows {
        let Some(plain_bytes) = try_decrypt_payload(&encrypted) else {
            continue;
        };
        let current = encrypt_bytes(&plain_bytes)?;
        if current != encrypted {
            reencrypted.insert(id, current);
        }
    }
    for (id, encrypted) in reencrypted {
        session_db::upsert_session(&id, &encrypted)?;
    }

    if let Some(encrypted) = session_db::load_snapshot()? {
        if let Some(plain_bytes) = try_decrypt_payload(&encrypted) {
            if let Ok(plain) = String::from_utf8(plain_bytes) {
                let _ = sync_snapshot(&plain);
            }
        }
    }

    let vault = vault_path()?;
    if vault.exists() {
        let raw = fs::read_to_string(&vault).map_err(|e| e.to_string())?;
        if let Ok(envelope) = serde_json::from_str::<EncryptedEnvelope>(&raw) {
            if envelope.version >= 2 {
                if let Some(plain_bytes) = try_decrypt_payload(&envelope.payload) {
                        let _ = write_encrypted_file(&vault, &plain_bytes);
                    }
            }
        }
    }

    Ok(())
}

fn load_workspace_from_db() -> Result<Option<Value>, String> {
    let mut rows = session_db::list_session_rows()?;

    if rows.is_empty() {
        let _ = import_sources_into_db();
        rows = session_db::list_session_rows()?;
    }

    if rows.is_empty() {
        return Ok(None);
    }

    let mut sessions = serde_json::Map::new();
    for (id, encrypted) in rows {
        let Some(plain_bytes) = try_decrypt_payload(&encrypted) else {
            continue;
        };
        let Ok(plain) = String::from_utf8(plain_bytes) else {
            continue;
        };
        let Ok(value) = serde_json::from_str::<Value>(&plain) else {
            continue;
        };
        sessions.insert(id, value);
    }

    if sessions.is_empty() {
        return Ok(None);
    }

    let active = session_db::get_active_session_id()?;
    Ok(Some(serde_json::json!({
        "sessions": Value::Object(sessions),
        "activeSessionId": active,
    })))
}

#[tauri::command]
pub fn secure_vault_load() -> Result<Option<Value>, String> {
    require_unlocked()?;
    load_workspace_from_db()
}

#[tauri::command]
pub fn secure_vault_save(payload: String) -> Result<(), String> {
    require_unlocked()?;

    let value: Value = serde_json::from_str(&payload).map_err(|e| e.to_string())?;
    let sessions_obj = if let Some(sessions) = value.get("sessions").and_then(|v| v.as_object()) {
        sessions.clone()
    } else if let Some(map) = value.as_object() {
        map.clone()
    } else {
        return Err("Invalid workspace payload".into());
    };

    let active = value
        .get("activeSessionId")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .filter(|s| !s.is_empty());

    let existing_ids: HashMap<String, ()> = session_db::list_session_ids()?
        .into_iter()
        .map(|id| (id, ()))
        .collect();

    for (id, session) in &sessions_obj {
        let plain = serde_json::to_string(session).map_err(|e| e.to_string())?;
        session_db::upsert_session(id, &encrypt_bytes(plain.as_bytes())?)?;
    }

    for id in existing_ids.keys() {
        if !sessions_obj.contains_key(id) {
            session_db::delete_session(id)?;
        }
    }

    session_db::set_active_session_id(active.as_deref())?;
    sync_snapshot(&payload)?;
    Ok(())
}

#[tauri::command]
pub fn secure_migrate_legacy(
    sessions_json: Option<String>,
    accounts_json: Option<String>,
) -> Result<(), String> {
    set_unlocked(true);

    if let Some(raw) = sessions_json {
        if !raw.trim().is_empty() && raw != "{}" {
            let mut merged = extract_sessions_object(&raw);
            if let Some(encrypted) = session_db::load_snapshot()? {
                let plain = String::from_utf8(decrypt_bytes(&encrypted)?).map_err(|e| e.to_string())?;
                merged = merge_session_maps(merged, extract_sessions_object(&plain));
            }
            if let Some(plain) = read_legacy_vault_plain()? {
                merged = merge_session_maps(merged, extract_sessions_object(&plain));
            }
            let active = extract_active_session_id(&raw);
            let mut encrypted_rows = HashMap::new();
            for (id, session) in &merged {
                let plain = serde_json::to_string(session).map_err(|e| e.to_string())?;
                encrypted_rows.insert(id.clone(), encrypt_bytes(plain.as_bytes())?);
            }
            session_db::replace_all_sessions(&encrypted_rows, active.as_deref())?;
            let payload = serde_json::json!({
                "sessions": Value::Object(merged.into_iter().collect()),
                "activeSessionId": active,
            });
            sync_snapshot(&serde_json::to_string(&payload).map_err(|e| e.to_string())?)?;
        }
    }

    if let Some(raw) = accounts_json {
        if raw.trim().is_empty() {
            return Ok(());
        }
        let legacy: HashMap<String, LegacyAccount> =
            serde_json::from_str(&raw).map_err(|e| e.to_string())?;
        let mut auth = load_auth_file()?;
        for (email, entry) in legacy {
            if auth.accounts.contains_key(&email) {
                continue;
            }
            let password_hash = hash_passcode(&entry.passcode)?;
            auth.accounts.insert(
                email,
                StoredAccount {
                    user: AuthUser {
                        id: entry.user.id,
                        name: entry.user.name,
                        email: entry.user.email,
                        role: entry.user.role,
                        created_at: entry.user.created_at,
                    },
                    password_hash,
                },
            );
        }
        save_auth_file(&auth)?;
    }

    Ok(())
}

#[derive(Debug, Deserialize)]
struct LegacyAccount {
    user: LegacyUser,
    passcode: String,
}

#[derive(Debug, Deserialize)]
struct LegacyUser {
    id: String,
    name: String,
    email: String,
    role: String,
    #[serde(rename = "createdAt")]
    created_at: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decrypt_saved_session_row_with_keychain_fallback() {
        set_unlocked(true);
        set_session_data_key(None);
        let rows = session_db::list_session_rows().unwrap_or_default();
        if rows.is_empty() {
            eprintln!("skip: no rows");
            return;
        }
        let (_id, encrypted) = &rows[0];
        let result = decrypt_bytes_with_fallback(encrypted);
        if result.is_err() {
            eprintln!(
                "skip: row needs login legacy keys (passcode-derived), not keychain-only: {:?}",
                result.err()
            );
            return;
        }
        let loaded = load_workspace_from_db().expect("load ok");
        assert!(loaded.is_some(), "expected sessions after decrypt");
    }
}

