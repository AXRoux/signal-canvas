use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};

#[derive(Default)]
pub struct TelegramMonitorState {
    child: Mutex<Option<Child>>,
}

fn project_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| PathBuf::from("."))
}

fn bridge_script() -> PathBuf {
    project_root().join("scripts/telegram/bridge.py")
}

fn python_bin() -> String {
    let venv = project_root().join("scripts/telegram/.venv/bin/python3");
    if venv.exists() {
        venv.display().to_string()
    } else {
        "python3".into()
    }
}

fn telegram_env(api_id: &str, api_hash: &str) -> HashMap<String, String> {
    let mut env: HashMap<String, String> = std::env::vars().collect();
    env.insert("TELEGRAM_API_ID".into(), api_id.to_string());
    env.insert("TELEGRAM_API_HASH".into(), api_hash.to_string());
    env
}

async fn run_bridge(args: &[&str], api_id: &str, api_hash: &str) -> Result<Value, String> {
    let script = bridge_script();
    if !script.exists() {
        return Err(format!("Telegram bridge not found at {}", script.display()));
    }

    let mut cmd = Command::new(python_bin());
    cmd.arg(&script);
    for arg in args {
        cmd.arg(arg);
    }
    cmd.envs(telegram_env(api_id, api_hash));
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let output = cmd.output().await.map_err(|e| format!("Failed to run bridge: {e}"))?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);

    if stdout.trim().is_empty() {
        return Err(format!("Telegram bridge empty output: {stderr}"));
    }

    let line = stdout.lines().last().unwrap_or("").trim();
    let parsed: Value = serde_json::from_str(line).map_err(|e| format!("Invalid JSON from bridge: {e} — {line}"))?;
    if parsed.get("ok").and_then(|v| v.as_bool()) == Some(true) {
        Ok(parsed.get("data").cloned().unwrap_or(Value::Null))
    } else {
        Err(parsed
            .get("error")
            .and_then(|v| v.as_str())
            .unwrap_or("Telegram bridge error")
            .to_string())
    }
}

#[derive(Debug, Deserialize)]
pub struct TelegramPhoneRequest {
    pub phone: String,
    #[serde(rename = "apiId")]
    pub api_id: String,
    #[serde(rename = "apiHash")]
    pub api_hash: String,
}

#[derive(Debug, Deserialize)]
pub struct TelegramSignInRequest {
    pub phone: String,
    pub code: String,
    #[serde(rename = "phoneCodeHash")]
    pub phone_code_hash: String,
    #[serde(rename = "apiId")]
    pub api_id: String,
    #[serde(rename = "apiHash")]
    pub api_hash: String,
}

#[derive(Debug, Deserialize)]
pub struct TelegramJoinRequest {
    pub target: String,
    #[serde(rename = "apiId")]
    pub api_id: String,
    #[serde(rename = "apiHash")]
    pub api_hash: String,
}

#[derive(Debug, Deserialize)]
pub struct TelegramHistoryRequest {
    #[serde(rename = "chatId")]
    pub chat_id: String,
    pub limit: Option<u32>,
    #[serde(rename = "apiId")]
    pub api_id: String,
    #[serde(rename = "apiHash")]
    pub api_hash: String,
}

#[derive(Debug, Deserialize)]
pub struct TelegramMonitorRequest {
    #[serde(rename = "sessionId")]
    pub session_id: String,
    #[serde(rename = "chatIds")]
    pub chat_ids: Vec<String>,
    #[serde(rename = "apiId")]
    pub api_id: String,
    #[serde(rename = "apiHash")]
    pub api_hash: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct TelegramStatus {
    pub authorized: bool,
    pub username: Option<String>,
    #[serde(rename = "firstName")]
    pub first_name: Option<String>,
    pub phone: Option<String>,
}

#[tauri::command]
pub async fn telegram_status(api_id: String, api_hash: String) -> Result<TelegramStatus, String> {
    if api_id.is_empty() || api_hash.is_empty() {
        return Ok(TelegramStatus {
            authorized: false,
            username: None,
            first_name: None,
            phone: None,
        });
    }
    let data = run_bridge(&["status"], &api_id, &api_hash).await?;
    let me = data.get("me");
    Ok(TelegramStatus {
        authorized: data.get("authorized").and_then(|v| v.as_bool()).unwrap_or(false),
        username: me.and_then(|m| m.get("username")).and_then(|v| v.as_str()).map(String::from),
        first_name: me.and_then(|m| m.get("firstName")).and_then(|v| v.as_str()).map(String::from),
        phone: me.and_then(|m| m.get("phone")).and_then(|v| v.as_str()).map(String::from),
    })
}

#[tauri::command]
pub async fn telegram_send_code(request: TelegramPhoneRequest) -> Result<Value, String> {
    run_bridge(
        &["send-code", "--phone", &request.phone],
        &request.api_id,
        &request.api_hash,
    )
    .await
}

#[tauri::command]
pub async fn telegram_sign_in(request: TelegramSignInRequest) -> Result<Value, String> {
    run_bridge(
        &[
            "sign-in",
            "--phone",
            &request.phone,
            "--code",
            &request.code,
            "--phone-code-hash",
            &request.phone_code_hash,
        ],
        &request.api_id,
        &request.api_hash,
    )
    .await
}

#[tauri::command]
pub async fn telegram_list_dialogs(
    api_id: String,
    api_hash: String,
    limit: Option<u32>,
) -> Result<Value, String> {
    let lim = limit.unwrap_or(50).to_string();
    run_bridge(&["list-dialogs", "--limit", &lim], &api_id, &api_hash).await
}

#[tauri::command]
pub async fn telegram_join_chat(request: TelegramJoinRequest) -> Result<Value, String> {
    run_bridge(
        &["join", "--target", &request.target],
        &request.api_id,
        &request.api_hash,
    )
    .await
}

#[tauri::command]
pub async fn telegram_fetch_history(request: TelegramHistoryRequest) -> Result<Value, String> {
    let limit = request.limit.unwrap_or(40).to_string();
    run_bridge(
        &["history", "--chat-id", &request.chat_id, "--limit", &limit],
        &request.api_id,
        &request.api_hash,
    )
    .await
}

#[tauri::command]
pub async fn telegram_stop_monitor(state: State<'_, TelegramMonitorState>) -> Result<(), String> {
    let child = {
        let mut guard = state.child.lock().map_err(|e| e.to_string())?;
        guard.take()
    };
    if let Some(mut child) = child {
        let _ = child.kill().await;
    }
    Ok(())
}

#[tauri::command]
pub async fn telegram_start_monitor(
    app: AppHandle,
    state: State<'_, TelegramMonitorState>,
    request: TelegramMonitorRequest,
) -> Result<(), String> {
    {
        let child_to_kill = {
            let mut guard = state.child.lock().map_err(|e| e.to_string())?;
            guard.take()
        };
        if let Some(mut child) = child_to_kill {
            let _ = child.kill().await;
        }
    }

    let script = bridge_script();
    if !script.exists() {
        return Err(format!("Telegram bridge not found at {}", script.display()));
    }

    let chat_ids = request.chat_ids.join(",");
    let session_id = request.session_id.clone();

    let mut cmd = Command::new(python_bin());
    cmd.arg(&script)
        .arg("monitor")
        .arg("--chat-ids")
        .arg(chat_ids)
        .envs(telegram_env(&request.api_id, &request.api_hash))
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);

    let mut child = cmd.spawn().map_err(|e| format!("Failed to start monitor: {e}"))?;
    let stdout = child.stdout.take().ok_or_else(|| "No monitor stdout".to_string())?;

    {
        let mut guard = state.child.lock().map_err(|e| e.to_string())?;
        *guard = Some(child);
    }

    let app_handle = app.clone();
    tokio::spawn(async move {
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();
        while let Ok(Some(line)) = lines.next_line().await {
            let trimmed = line.trim();
            if trimmed.is_empty() {
                continue;
            }
            if let Ok(value) = serde_json::from_str::<Value>(trimmed) {
                let event_name = value
                    .get("event")
                    .and_then(|v| v.as_str())
                    .unwrap_or("telegram-event");
                if event_name == "message" {
                    let mut payload = value.clone();
                    if let Some(obj) = payload.as_object_mut() {
                        obj.insert("sessionId".into(), Value::String(session_id.clone()));
                    }
                    let _ = app_handle.emit("telegram-message", payload);
                }
            }
        }
        let _ = app_handle.emit(
            "telegram-monitor-stopped",
            serde_json::json!({ "sessionId": session_id }),
        );
    });

    Ok(())
}
