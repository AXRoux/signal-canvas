use rusqlite::{params, Connection, Transaction};
use std::collections::HashMap;
use std::path::PathBuf;

use crate::secure_store::{ensure_dir, set_private_permissions, signal_canvas_dir};

const META_ACTIVE_SESSION: &str = "activeSessionId";

fn db_path() -> Result<PathBuf, String> {
    Ok(signal_canvas_dir()?.join("workspace.db"))
}

fn open_connection() -> Result<Connection, String> {
    let path = db_path()?;
    if let Some(parent) = path.parent() {
        ensure_dir(&parent.to_path_buf())?;
    }
    let conn = Connection::open(&path).map_err(|e| e.to_string())?;
    conn.execute_batch(
        "
        PRAGMA journal_mode=WAL;
        PRAGMA synchronous=FULL;
        CREATE TABLE IF NOT EXISTS investigation_sessions (
            id TEXT PRIMARY KEY NOT NULL,
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS workspace_meta (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS workspace_snapshot (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            payload TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        ",
    )
    .map_err(|e| e.to_string())?;
    set_private_permissions(&path)?;
    Ok(conn)
}

pub fn upsert_session(id: &str, encrypted_payload: &str) -> Result<(), String> {
    let conn = open_connection()?;
    let updated_at = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO investigation_sessions (id, payload, updated_at) VALUES (?1, ?2, ?3)
         ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at",
        params![id, encrypted_payload, updated_at],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn delete_session(id: &str) -> Result<(), String> {
    let conn = open_connection()?;
    conn.execute("DELETE FROM investigation_sessions WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn list_session_rows() -> Result<Vec<(String, String)>, String> {
    let conn = open_connection()?;
    let mut stmt = conn
        .prepare("SELECT id, payload FROM investigation_sessions ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

pub fn list_session_ids() -> Result<Vec<String>, String> {
    let conn = open_connection()?;
    let mut stmt = conn
        .prepare("SELECT id FROM investigation_sessions")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for row in rows {
        out.push(row.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

pub fn set_meta(key: &str, value: &str) -> Result<(), String> {
    let conn = open_connection()?;
    conn.execute(
        "INSERT INTO workspace_meta (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_meta(key: &str) -> Result<Option<String>, String> {
    let conn = open_connection()?;
    let mut stmt = conn
        .prepare("SELECT value FROM workspace_meta WHERE key = ?1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query(params![key]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        return row.get(0).map(Some).map_err(|e| e.to_string());
    }
    Ok(None)
}

pub fn get_active_session_id() -> Result<Option<String>, String> {
    get_meta(META_ACTIVE_SESSION).map(|v| v.filter(|s| !s.is_empty()))
}

pub fn set_active_session_id(id: Option<&str>) -> Result<(), String> {
    match id.filter(|s| !s.is_empty()) {
        Some(value) => set_meta(META_ACTIVE_SESSION, value),
        None => {
            let conn = open_connection()?;
            conn.execute("DELETE FROM workspace_meta WHERE key = ?1", params![META_ACTIVE_SESSION])
                .map_err(|e| e.to_string())?;
            Ok(())
        }
    }
}

pub fn save_snapshot(encrypted_payload: &str) -> Result<(), String> {
    let conn = open_connection()?;
    let updated_at = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO workspace_snapshot (id, payload, updated_at) VALUES (1, ?1, ?2)
         ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at",
        params![encrypted_payload, updated_at],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_snapshot() -> Result<Option<String>, String> {
    let conn = open_connection()?;
    let mut stmt = conn
        .prepare("SELECT payload FROM workspace_snapshot WHERE id = 1")
        .map_err(|e| e.to_string())?;
    let mut rows = stmt.query([]).map_err(|e| e.to_string())?;
    if let Some(row) = rows.next().map_err(|e| e.to_string())? {
        return row.get(0).map(Some).map_err(|e| e.to_string());
    }
    Ok(None)
}

pub fn replace_all_sessions(
    rows: &HashMap<String, String>,
    active_session_id: Option<&str>,
) -> Result<(), String> {
    let mut conn = open_connection()?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;
    replace_all_sessions_tx(&tx, rows, active_session_id)?;
    tx.commit().map_err(|e| e.to_string())
}

fn replace_all_sessions_tx(
    tx: &Transaction<'_>,
    rows: &HashMap<String, String>,
    active_session_id: Option<&str>,
) -> Result<(), String> {
    let updated_at = chrono::Utc::now().to_rfc3339();
    tx.execute("DELETE FROM investigation_sessions", [])
        .map_err(|e| e.to_string())?;
    for (id, payload) in rows {
        tx.execute(
            "INSERT INTO investigation_sessions (id, payload, updated_at) VALUES (?1, ?2, ?3)",
            params![id, payload, updated_at],
        )
        .map_err(|e| e.to_string())?;
    }
    tx.execute("DELETE FROM workspace_meta WHERE key = ?1", params![META_ACTIVE_SESSION])
        .map_err(|e| e.to_string())?;
    if let Some(id) = active_session_id.filter(|s| !s.is_empty()) {
        tx.execute(
            "INSERT INTO workspace_meta (key, value) VALUES (?1, ?2)",
            params![META_ACTIVE_SESSION, id],
        )
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}
