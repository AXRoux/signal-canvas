use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;
use std::time::Duration;

use crate::secure_store::{read_integration_config_raw, write_integration_config_raw};

const DEFAULT_URL: &str = "https://signal-canvas.tethsiga.workers.dev/hermes";
const DEFAULT_GATEWAY_KEY: &str = "signal-canvas-prod-gateway";
const GATEWAY_PORT: u16 = 8642;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HermesHealth {
    pub online: bool,
    pub url: String,
    pub version: Option<String>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AgentScanRequest {
    pub handle: String,
    pub context: Option<String>,
    pub language: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IntegrationConfigPayload {
    #[serde(rename = "hermesGatewayUrl")]
    pub hermes_gateway_url: String,
    #[serde(rename = "hermesApiKey")]
    pub hermes_api_key: String,
    #[serde(rename = "nvidiaApiKey")]
    pub nvidia_api_key: String,
    #[serde(rename = "nvidiaNimEndpoint")]
    pub nvidia_nim_endpoint: String,
    #[serde(rename = "openaiApiKey")]
    pub openai_api_key: String,
    #[serde(rename = "telegramApiId", default)]
    pub telegram_api_id: String,
    #[serde(rename = "telegramApiHash", default)]
    pub telegram_api_hash: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IntegrationStatusPayload {
    #[serde(rename = "hermesOnline")]
    pub hermes_online: bool,
    #[serde(rename = "hermesMessage")]
    pub hermes_message: String,
    #[serde(rename = "hermesGatewayUrl")]
    pub hermes_gateway_url: String,
    #[serde(rename = "nvidiaKeyConfigured")]
    pub nvidia_key_configured: bool,
    #[serde(rename = "nemotronViaHermes")]
    pub nemotron_via_hermes: bool,
    #[serde(rename = "skillsScan")]
    pub skills_scan: bool,
    #[serde(rename = "skillsCorrelate")]
    pub skills_correlate: bool,
    #[serde(rename = "skillsBrief")]
    pub skills_brief: bool,
    #[serde(rename = "nvidiaOnline")]
    pub nvidia_online: bool,
    #[serde(rename = "nvidiaMessage")]
    pub nvidia_message: String,
    #[serde(rename = "hermesModel")]
    pub hermes_model: String,
    #[serde(rename = "hermesBinary")]
    pub hermes_binary: String,
}

fn signal_canvas_config_path() -> Option<PathBuf> {
    dirs::home_dir().map(|h| h.join(".signal-canvas").join("integrations.json"))
}

fn read_signal_canvas_config() -> Option<IntegrationConfigPayload> {
    let path = signal_canvas_config_path()?;
    let raw = read_integration_config_raw(&path).ok()??;
    serde_json::from_str(&raw).ok()
}

fn hermes_config() -> (String, Option<String>) {
    if let Some(cfg) = read_signal_canvas_config() {
        let url = if cfg.hermes_gateway_url.is_empty() {
            DEFAULT_URL.to_string()
        } else {
            cfg.hermes_gateway_url.clone()
        };
        let key = Some(gateway_api_key(&cfg));
        return (url, key);
    }
    let url = std::env::var("HERMES_API_URL").unwrap_or_else(|_| DEFAULT_URL.to_string());
    let key = read_key_from_hermes_env().or_else(|| Some(DEFAULT_GATEWAY_KEY.to_string()));
    (url, key)
}

fn is_local_gateway(url: &str) -> bool {
    url.contains("127.0.0.1") || url.contains("localhost")
}

fn is_gateway_credential(raw: &str) -> bool {
    let trimmed = raw.trim();
    !trimmed.is_empty()
        && !trimmed.starts_with("sk-")
        && !trimmed.starts_with("nvapi-")
}

fn gateway_api_key(config: &IntegrationConfigPayload) -> String {
    let raw = config.hermes_api_key.trim();
    let url = if config.hermes_gateway_url.is_empty() {
        DEFAULT_URL
    } else {
        config.hermes_gateway_url.as_str()
    };

    if !is_local_gateway(url) {
        if is_gateway_credential(raw) {
            return raw.to_string();
        }
        return DEFAULT_GATEWAY_KEY.to_string();
    }

    if raw.is_empty() || raw.starts_with("sk-") || raw.starts_with("nvapi-") {
        read_key_from_hermes_env()
            .filter(|k| !k.starts_with("sk-") && !k.starts_with("nvapi-"))
            .unwrap_or_else(|| DEFAULT_GATEWAY_KEY.to_string())
    } else {
        raw.to_string()
    }
}

fn nous_api_key_from_config(config: &IntegrationConfigPayload) -> String {
    let raw = config.hermes_api_key.trim();
    if raw.starts_with("sk-") {
        raw.to_string()
    } else {
        String::new()
    }
}

fn find_hermes_binary() -> String {
    if let Ok(path) = which::which("hermes") {
        return path.display().to_string();
    }
    if let Some(home) = dirs::home_dir() {
        for candidate in [
            home.join(".local/bin/hermes"),
            home.join(".hermes/hermes-agent/venv/bin/hermes"),
        ] {
            if candidate.exists() {
                return candidate.display().to_string();
            }
        }
    }
    "not found".into()
}

fn read_key_from_hermes_env() -> Option<String> {
    let home = dirs::home_dir()?;
    let env_path = home.join(".hermes").join(".env");
    let content = fs::read_to_string(env_path).ok()?;
    for line in content.lines() {
        if line.starts_with("API_SERVER_KEY=") {
            let val = line.trim_start_matches("API_SERVER_KEY=").trim();
            if !val.is_empty() {
                return Some(val.to_string());
            }
        }
    }
    None
}

fn project_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| PathBuf::from("."))
}

fn hermes_skill_paths(name: &str) -> Vec<PathBuf> {
    let mut paths = vec![project_root().join(".hermes/skills").join(name).join("SKILL.md")];
    if let Some(home) = dirs::home_dir() {
        paths.push(home.join(".hermes/skills").join(name).join("SKILL.md"));
    }
    paths
}

fn hermes_skill_installed(name: &str) -> bool {
    hermes_skill_paths(name).iter().any(|p| p.exists())
}

async fn nvidia_reachable(config: &IntegrationConfigPayload) -> (bool, String) {
    if config.nvidia_api_key.is_empty() {
        return (false, "NVIDIA API key not configured".into());
    }

    let endpoint = if config.nvidia_nim_endpoint.is_empty() {
        "https://integrate.api.nvidia.com/v1".to_string()
    } else {
        config.nvidia_nim_endpoint.trim_end_matches('/').to_string()
    };

    let client = Client::new();
    match client
        .get(format!("{endpoint}/models"))
        .header("Authorization", format!("Bearer {}", config.nvidia_api_key))
        .timeout(Duration::from_secs(10))
        .send()
        .await
    {
        Ok(resp) if resp.status().is_success() => (true, "NVIDIA NIM reachable".into()),
        Ok(resp) => (false, format!("NVIDIA HTTP {}", resp.status())),
        Err(e) => (false, format!("NVIDIA offline — {e}")),
    }
}

fn extract_json_from_response(text: &str) -> Option<Value> {
    if let Ok(v) = serde_json::from_str::<Value>(text) {
        return Some(v);
    }
    if let Some(start) = text.find("```json") {
        let rest = &text[start + 7..];
        if let Some(end) = rest.find("```") {
            let block = rest[..end].trim();
            if let Ok(v) = serde_json::from_str::<Value>(block) {
                return Some(v);
            }
        }
    }
    if let Some(start) = text.find('{') {
        if let Some(end) = text.rfind('}') {
            let block = &text[start..=end];
            if let Ok(v) = serde_json::from_str::<Value>(block) {
                return Some(v);
            }
        }
    }
    None
}

fn extract_hermes_session_id(value: &Value) -> Option<String> {
    value
        .get("id")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .or_else(|| {
            value
                .get("session")
                .and_then(|s| s.get("id"))
                .and_then(|v| v.as_str())
                .map(|s| s.to_string())
        })
}

fn extract_hermes_chat_text(chat: &Value) -> String {
    chat.get("output")
        .or_else(|| chat.get("content"))
        .or_else(|| chat.get("message").and_then(|m| m.get("content")))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .unwrap_or_else(|| chat.to_string())
}

fn hermes_session_title(context: &Value) -> String {
    context
        .get("investigationSessionId")
        .and_then(|v| v.as_str())
        .filter(|s| !s.is_empty())
        .map(|id| format!("signal-canvas-{id}"))
        .unwrap_or_else(|| "signal-canvas".to_string())
}

fn extract_existing_session_from_error(err: &str) -> Option<String> {
    if let Some(idx) = err.find("by session ") {
        let rest = &err[idx + 11..];
        let id: String = rest
            .chars()
            .take_while(|c| c.is_alphanumeric() || *c == '_')
            .collect();
        if !id.is_empty() {
            return Some(id);
        }
    }
    None
}

fn format_hermes_error(err: &str) -> String {
    if err.contains("invalid_title") || err.contains("already in use") {
        return "Could not attach to the Hermes session for this case. Try again — the app will reuse the existing session.".into();
    }
    if err.contains("invalid_api_key") || err.contains("401") {
        return "Hermes gateway rejected the API key. Check Settings → Hermes and save again.".into();
    }
    if err.len() > 220 {
        return format!("{}…", &err[..220]);
    }
    err.to_string()
}

async fn ensure_hermes_online(
    client: &Client,
    url: &str,
    key: &Option<String>,
) -> Result<(), String> {
    let mut req = client
        .get(format!("{url}/health"))
        .timeout(Duration::from_secs(5));
    if !is_local_gateway(url) {
        if let Some(k) = key {
            req = req.header("Authorization", format!("Bearer {k}"));
        }
    }
    let health = req.send().await.map_err(|e| format!("Hermes gateway unreachable at {url}. ({e})"))?;

    if !health.status().is_success() {
        return Err(format!(
            "Hermes gateway returned HTTP {}. Check gateway logs.",
            health.status()
        ));
    }
    Ok(())
}

async fn create_hermes_session(
    client: &Client,
    url: &str,
    key: &Option<String>,
    config: Option<&IntegrationConfigPayload>,
    title: &str,
    language: &str,
) -> Result<String, String> {
    match hermes_request(
        client,
        url,
        key,
        config,
        reqwest::Method::POST,
        "/api/sessions",
        Some(serde_json::json!({
            "title": title,
            "metadata": { "language": language }
        })),
    )
    .await
    {
        Ok(session) => extract_hermes_session_id(&session)
            .ok_or_else(|| "Missing session id".to_string()),
        Err(err) => {
            if let Some(id) = extract_existing_session_from_error(&err) {
                Ok(id)
            } else {
                Err(format_hermes_error(&err))
            }
        }
    }
}

async fn hermes_request(
    client: &Client,
    url: &str,
    key: &Option<String>,
    config: Option<&IntegrationConfigPayload>,
    method: reqwest::Method,
    path: &str,
    body: Option<Value>,
) -> Result<Value, String> {
    let mut req = client
        .request(method, format!("{url}{path}"))
        .timeout(Duration::from_secs(90));

    if let Some(k) = key {
        req = req.header("Authorization", format!("Bearer {k}"));
    }
    if let Some(cfg) = config {
        if !is_local_gateway(url) {
            if !cfg.nvidia_api_key.is_empty() {
                req = req.header("X-Signal-Nvidia-Key", cfg.nvidia_api_key.as_str());
            }
            let endpoint = if cfg.nvidia_nim_endpoint.is_empty() {
                "https://integrate.api.nvidia.com/v1"
            } else {
                cfg.nvidia_nim_endpoint.as_str()
            };
            req = req.header("X-Signal-Nim-Endpoint", endpoint);
            let nous = nous_api_key_from_config(cfg);
            if !nous.is_empty() {
                req = req.header("X-Signal-Nous-Key", nous.as_str());
            }
        }
    }
    if let Some(b) = body {
        req = req.json(&b);
    }

    let resp = req.send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Hermes HTTP {status}: {body}"));
    }
    resp.json::<Value>().await.map_err(|e| e.to_string())
}

fn upsert_env_line(content: &str, key: &str, value: &str) -> String {
    if value.is_empty() {
        return content.to_string();
    }
    let line = format!("{key}={value}");
    let mut lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();
    let prefix = format!("{key}=");
    if let Some(idx) = lines.iter().position(|l| l.starts_with(&prefix)) {
        lines[idx] = line;
    } else {
        lines.push(line);
    }
    let mut out = lines.join("\n");
    if !out.ends_with('\n') {
        out.push('\n');
    }
    out
}

fn sync_hermes_runtime(config: &IntegrationConfigPayload) -> Result<(), String> {
    let home = dirs::home_dir().ok_or_else(|| "Cannot resolve home directory".to_string())?;
    let env_path = home.join(".hermes").join(".env");
    let existing = fs::read_to_string(&env_path).unwrap_or_default();

    let api_key = gateway_api_key(config);
    let nous_key = nous_api_key_from_config(config);

    let mut next = existing;
    next = upsert_env_line(&next, "API_SERVER_ENABLED", "true");
    next = upsert_env_line(&next, "API_SERVER_HOST", "127.0.0.1");
    next = upsert_env_line(&next, "API_SERVER_PORT", "8642");
    next = upsert_env_line(&next, "API_SERVER_KEY", &api_key);
    next = upsert_env_line(&next, "NVIDIA_API_KEY", &config.nvidia_api_key);
    if !nous_key.is_empty() {
        next = upsert_env_line(&next, "NOUS_API_KEY", &nous_key);
    }
    next = upsert_env_line(&next, "GATEWAY_ALLOW_ALL_USERS", "true");

    if let Some(parent) = env_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&env_path, next).map_err(|e| e.to_string())?;

    let skills_src = project_root().join(".hermes/skills");
    let cfg_path = home.join(".hermes").join("config.yaml");
    if cfg_path.exists() {
        let mut text = fs::read_to_string(&cfg_path).map_err(|e| e.to_string())?;
        if !text.contains(&skills_src.display().to_string()) {
            /* skills path documented in setup guide */
        }
        if text.contains("reasoning_effort: medium") {
            text = text.replace("reasoning_effort: medium", "reasoning_effort: low");
            let _ = fs::write(&cfg_path, text);
        }
    }

    Ok(())
}

fn gateway_health_sync(url: &str) -> bool {
    reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .ok()
        .and_then(|c| c.get(format!("{url}/health")).send().ok())
        .map(|r| r.status().is_success())
        .unwrap_or(false)
}

fn stop_local_hermes_gateway() {
    let _ = std::process::Command::new("bash")
        .arg("-lc")
        .arg(format!(
            "lsof -ti tcp:{GATEWAY_PORT} 2>/dev/null | xargs kill -9 2>/dev/null; pkill -f 'hermes gateway' 2>/dev/null; true"
        ))
        .status();
    std::thread::sleep(Duration::from_millis(500));
}

fn spawn_hermes_gateway(restart: bool) -> Result<(), String> {
    if restart {
        stop_local_hermes_gateway();
    }
    let script = project_root().join("scripts/hermes/start-gateway.sh");
    if !script.exists() {
        return Err("start-gateway.sh not found".into());
    }
    std::process::Command::new("bash")
        .arg(script)
        .env("HERMES_RESTART", if restart { "1" } else { "0" })
        .spawn()
        .map_err(|e| format!("Failed to start Hermes gateway: {e}"))?;
    Ok(())
}

fn gateway_auth_probe(url: &str, key: &str) -> bool {
    let client = match reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(4))
        .build()
    {
        Ok(c) => c,
        Err(_) => return false,
    };
    let resp = client
        .post(format!("{url}/api/sessions"))
        .header("Authorization", format!("Bearer {key}"))
        .header("Content-Type", "application/json")
        .body(r#"{"title":"signal-canvas-auth-probe","metadata":{}}"#)
        .send();
    match resp {
        Ok(r) => r.status().is_success() || r.status().as_u16() == 409,
        Err(_) => false,
    }
}

fn ensure_local_gateway_ready(config: &IntegrationConfigPayload) -> Result<String, String> {
    let url = if config.hermes_gateway_url.is_empty() {
        DEFAULT_URL.to_string()
    } else {
        config.hermes_gateway_url.trim_end_matches('/').to_string()
    };

    if !is_local_gateway(&url) {
        return Ok(url);
    }

    sync_hermes_runtime(config)?;

    let key = gateway_api_key(config);

    if gateway_health_sync(&url) && gateway_auth_probe(&url, &key) {
        return Ok(url);
    }

    spawn_hermes_gateway(true)?;
    for _ in 0..12 {
        std::thread::sleep(Duration::from_millis(750));
        if gateway_health_sync(&url) && gateway_auth_probe(&url, &key) {
            return Ok(url);
        }
    }

    if gateway_health_sync(&url) && !gateway_auth_probe(&url, &key) {
        return Err(
            "Hermes gateway is running but rejected the API key. Save Settings → Hermes again to resync."
                .into(),
        );
    }

    Err("Hermes gateway failed to start. Install Hermes and check ~/.signal-canvas/hermes-gateway.log".into())
}

async fn hermes_chat(prompt: &str, language: &str) -> Result<Value, String> {
    let config = read_signal_canvas_config().unwrap_or(IntegrationConfigPayload {
        hermes_gateway_url: DEFAULT_URL.to_string(),
        hermes_api_key: String::new(),
        nvidia_api_key: String::new(),
        nvidia_nim_endpoint: String::new(),
        openai_api_key: String::new(),
        telegram_api_id: String::new(),
        telegram_api_hash: String::new(),
    });
    let url = ensure_local_gateway_ready(&config)?;
    let key = Some(gateway_api_key(&config));
    let client = Client::new();

    ensure_hermes_online(&client, &url, &key).await?;

    let session_id = create_hermes_session(
        &client,
        &url,
        &key,
        Some(&config),
        "signal-canvas-scan",
        language,
    )
    .await?;

    let chat = hermes_request(
        &client,
        &url,
        &key,
        Some(&config),
        reqwest::Method::POST,
        &format!("/api/sessions/{session_id}/chat"),
        Some(serde_json::json!({ "input": prompt, "language": language })),
    )
    .await?;

    let text = extract_hermes_chat_text(&chat);

    extract_json_from_response(&text).ok_or_else(|| {
        format!(
            "Hermes returned no parseable JSON. Response preview: {}",
            text.chars().take(240).collect::<String>()
        )
    })
}

#[tauri::command]
pub async fn hermes_health() -> Result<HermesHealth, String> {
    let (url, key) = hermes_config();
    let client = Client::new();
    let mut req = client
        .get(format!("{url}/health"))
        .timeout(Duration::from_secs(5));
    if !is_local_gateway(&url) {
        if let Some(k) = &key {
            req = req.header("Authorization", format!("Bearer {k}"));
        }
    }
    match req.send().await
    {
        Ok(resp) if resp.status().is_success() =>         Ok(HermesHealth {
            online: true,
            url: url.clone(),
            version: Some("Cloudflare Hermes".into()),
            message: "Hosted Hermes gateway online".into(),
        }),
        Ok(resp) => Ok(HermesHealth {
            online: false,
            url,
            version: None,
            message: format!("Gateway returned {}", resp.status()),
        }),
        Err(e) => Ok(HermesHealth {
            online: false,
            url,
            version: None,
            message: format!("Hosted Hermes unreachable ({e})"),
        }),
    }
}

#[tauri::command]
pub async fn hermes_scan(request: AgentScanRequest) -> Result<Value, String> {
    let ctx = request
        .context
        .unwrap_or_else(|| "institutional review scan".into());
    let prompt = format!(
        "/signal-canvas-scan {} {}\n\nReturn ONLY valid JSON matching the Signal Canvas scan schema.",
        request.handle, ctx
    );
    hermes_chat(&prompt, &request.language).await
}

#[tauri::command]
pub async fn hermes_correlate(selected_node_id: String, language: String) -> Result<Value, String> {
    let prompt = format!(
        "/signal-canvas-correlate node_id={selected_node_id}\n\nReturn ONLY JSON with correlateNodes and correlateEdges arrays."
    );
    hermes_chat(&prompt, &language).await
}

#[tauri::command]
pub async fn setup_integrations_status() -> Result<String, String> {
    let root = project_root();
    let skills_root = root.join(".hermes/skills");
    let hermes_bin = which::which("hermes").map(|p| p.display().to_string());

    Ok(format!(
        "Hermes: {}\nSkills: scan={} correlate={} brief={}\nConfig: ~/.signal-canvas/integrations.json\nRun: ./scripts/setup-integrations.sh",
        hermes_bin.unwrap_or_else(|_| "not found".into()),
        skills_root.join("signal-canvas-scan/SKILL.md").exists(),
        skills_root.join("signal-canvas-correlate/SKILL.md").exists(),
        skills_root.join("signal-canvas-brief/SKILL.md").exists(),
    ))
}

#[tauri::command]
pub async fn load_integration_config() -> Result<Option<IntegrationConfigPayload>, String> {
    Ok(read_signal_canvas_config())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NvidiaHealth {
    pub online: bool,
    pub message: String,
}

#[tauri::command]
pub async fn nvidia_health(config: IntegrationConfigPayload) -> Result<NvidiaHealth, String> {
    if config.nvidia_api_key.is_empty() {
        return Ok(NvidiaHealth {
            online: false,
            message: "NVIDIA API key not configured".into(),
        });
    }

    let endpoint = if config.nvidia_nim_endpoint.is_empty() {
        "https://integrate.api.nvidia.com/v1".to_string()
    } else {
        config.nvidia_nim_endpoint.trim_end_matches('/').to_string()
    };

    let client = Client::new();
    let resp = client
        .get(format!("{endpoint}/models"))
        .header("Authorization", format!("Bearer {}", config.nvidia_api_key))
        .timeout(Duration::from_secs(15))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if resp.status().is_success() {
        Ok(NvidiaHealth {
            online: true,
            message: "NVIDIA NIM reachable".into(),
        })
    } else {
        Ok(NvidiaHealth {
            online: false,
            message: format!("NVIDIA HTTP {}", resp.status()),
        })
    }
}

#[tauri::command]
pub async fn save_integration_config(config: IntegrationConfigPayload) -> Result<(), String> {
    let path = signal_canvas_config_path().ok_or_else(|| "Cannot resolve home directory".to_string())?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    write_integration_config_raw(&path, &json).map_err(|e| e.to_string())?;

    if is_local_gateway(
        if config.hermes_gateway_url.is_empty() {
            DEFAULT_URL
        } else {
            config.hermes_gateway_url.as_str()
        },
    ) {
        sync_hermes_runtime(&config)?;
    }

    Ok(())
}

#[tauri::command]
pub async fn integration_status(
    config: IntegrationConfigPayload,
) -> Result<IntegrationStatusPayload, String> {
    let url = if config.hermes_gateway_url.is_empty() {
        DEFAULT_URL.to_string()
    } else {
        config.hermes_gateway_url.clone()
    };

    let hermes_bin = if is_local_gateway(&url) {
        find_hermes_binary()
    } else {
        "Hosted on Cloudflare Workers".into()
    };

    let client = Client::new();
    let gateway_key = Some(gateway_api_key(&config));
    let mut health_req = client
        .get(format!("{url}/health"))
        .timeout(Duration::from_secs(5));
    if !is_local_gateway(&url) {
        if let Some(k) = &gateway_key {
            health_req = health_req.header("Authorization", format!("Bearer {k}"));
        }
    }
    let health = health_req.send().await;

    let hermes_online = health.as_ref().map(|r| r.status().is_success()).unwrap_or(false);
    let hermes_message = match health {
        Ok(r) if r.status().is_success() => {
            if is_local_gateway(&url) {
                "Gateway online".into()
            } else {
                "Hosted Hermes online (Cloudflare)".into()
            }
        }
        Ok(r) => format!("Gateway returned {}", r.status()),
        Err(e) => format!("Offline — {e}"),
    };

    let nvidia_key = !config.nvidia_api_key.is_empty();
    let (nvidia_online, nvidia_message) = if nvidia_key {
        nvidia_reachable(&config).await
    } else {
        (false, "NVIDIA API key not configured".into())
    };

    Ok(IntegrationStatusPayload {
        hermes_online,
        hermes_message,
        hermes_gateway_url: url,
        nvidia_key_configured: nvidia_key,
        nemotron_via_hermes: hermes_online && nvidia_key && nvidia_online,
        skills_scan: hermes_skill_installed("signal-canvas-scan"),
        skills_correlate: hermes_skill_installed("signal-canvas-correlate"),
        skills_brief: hermes_skill_installed("signal-canvas-brief"),
        nvidia_online,
        nvidia_message,
        hermes_model: "nvidia/nemotron-3-ultra-550b-a55b".into(),
        hermes_binary: hermes_bin,
    })
}

#[derive(Debug, Deserialize)]
pub struct HermesSessionChatRequest {
    pub message: String,
    pub language: String,
    #[serde(rename = "hermesSessionId")]
    pub hermes_session_id: Option<String>,
    pub context: Value,
}

#[derive(Debug, Serialize)]
pub struct HermesSessionChatResponse {
    pub message: String,
    #[serde(rename = "hermesSessionId")]
    pub hermes_session_id: String,
    #[serde(rename = "canvasActions")]
    pub canvas_actions: Option<Value>,
}

fn extract_canvas_actions(text: &str) -> Option<Value> {
    if let Some(start) = text.find("```canvas_actions") {
        let rest = &text[start + 17..];
        if let Some(end) = rest.find("```") {
            let block = rest[..end].trim();
            if let Ok(v) = serde_json::from_str::<Value>(block) {
                return Some(v);
            }
        }
    }
    if let Ok(v) = serde_json::from_str::<Value>(text) {
        if v.get("type").and_then(|t| t.as_str()) == Some("canvas_actions") {
            return Some(v);
        }
        if v.get("actions").is_some() {
            return Some(v);
        }
    }
    None
}

fn normalize_chat_display(raw: &str, canvas_actions: &Option<Value>) -> String {
    let mut text = raw.trim().to_string();

    if let Some(start) = text.find("```canvas_actions") {
        if let Some(end) = text[start..].find("```") {
            let after = start + end + 3;
            if after < text.len() {
                text = format!("{}{}", &text[..start], &text[after..]);
            } else {
                text.truncate(start);
            }
            text = text.trim().to_string();
        }
    }

    if let Some(actions) = canvas_actions {
        if let Some(msg) = actions.get("agent_message").and_then(|v| v.as_str()) {
            if !msg.is_empty() {
                return msg.to_string();
            }
        }
    }

    if text.starts_with('{') && text.ends_with('}') {
        if let Ok(v) = serde_json::from_str::<Value>(&text) {
            if let Some(msg) = v.get("agent_message").and_then(|s| s.as_str()) {
                return msg.to_string();
            }
            if let Some(msg) = v.get("message").and_then(|s| s.as_str()) {
                return msg.to_string();
            }
        }
    }

    if text.is_empty() {
        raw.trim().to_string()
    } else {
        text
    }
}

fn build_session_chat_prompt(message: &str, context: &Value, language: &str) -> String {
    let case = context
        .get("caseName")
        .and_then(|v| v.as_str())
        .unwrap_or("Case");
    let scan = context.get("scanTarget").and_then(|v| v.as_str()).unwrap_or("");
    let selected = context
        .get("selectedNodeId")
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let nodes = context
        .get("nodeCount")
        .and_then(|v| v.as_u64())
        .unwrap_or(0);
    let edges = context
        .get("edgeCount")
        .and_then(|v| v.as_u64())
        .unwrap_or(0);
    let streams = context
        .get("recentStreamCount")
        .and_then(|v| v.as_u64())
        .unwrap_or(0);

    let locale = if language == "pt" {
        "Reply in Portuguese (Brazil)."
    } else {
        "Reply in English."
    };

    format!(
        "You are Hermes on Signal Canvas — a human-in-the-loop investigation desk.\n\
Case: {case}\n\
{scan_line}\
{sel_line}\
Graph: {nodes} nodes, {edges} edges. Telegram stream: {streams} recent messages.\n\
\n\
Rules:\n\
- Plain conversational prose only in your main reply. No JSON, no code fences, no robotic lists unless asked.\n\
- Be concise, natural, and nuanced. Understand implicit intent.\n\
- Do NOT invoke scan/correlate/brief skills unless explicitly requested.\n\
- Graph edits (STRATIR or flowsint layout): append ONE block at the end only when proposing changes:\n\
```canvas_actions\n{{\"type\":\"canvas_actions\",\"agent_message\":\"brief summary\",\"actions\":[...]}}\n```\n\
{locale}\n\
\n\
Analyst:\n{message}"
        ,
        scan_line = if scan.is_empty() {
            String::new()
        } else {
            format!("Scan target: {scan}\n")
        },
        sel_line = if selected.is_empty() {
            String::new()
        } else {
            format!("Selected node: {selected}\n")
        },
    )
}

#[tauri::command]
pub async fn hermes_session_chat(
    request: HermesSessionChatRequest,
) -> Result<HermesSessionChatResponse, String> {
    let config = read_signal_canvas_config().unwrap_or(IntegrationConfigPayload {
        hermes_gateway_url: DEFAULT_URL.to_string(),
        hermes_api_key: String::new(),
        nvidia_api_key: String::new(),
        nvidia_nim_endpoint: String::new(),
        openai_api_key: String::new(),
        telegram_api_id: String::new(),
        telegram_api_hash: String::new(),
    });

    let url = ensure_local_gateway_ready(&config)?;
    let key = Some(gateway_api_key(&config));
    let client = Client::new();

    ensure_hermes_online(&client, &url, &key).await?;

    let session_id = if let Some(id) = request.hermes_session_id.filter(|s| !s.is_empty()) {
        id
    } else {
        create_hermes_session(
            &client,
            &url,
            &key,
            Some(&config),
            &hermes_session_title(&request.context),
            &request.language,
        )
        .await?
    };

    let prompt = build_session_chat_prompt(&request.message, &request.context, &request.language);

    let chat = hermes_request(
        &client,
        &url,
        &key,
        Some(&config),
        reqwest::Method::POST,
        &format!("/api/sessions/{session_id}/chat"),
        Some(serde_json::json!({
            "input": prompt,
            "language": request.language,
        })),
    )
    .await?;

    let text = extract_hermes_chat_text(&chat);
    let canvas_actions = extract_canvas_actions(&text);
    let display = normalize_chat_display(&text, &canvas_actions);

    Ok(HermesSessionChatResponse {
        message: display,
        hermes_session_id: session_id,
        canvas_actions,
    })
}

#[tauri::command]
pub async fn ensure_hermes_gateway(config: IntegrationConfigPayload) -> Result<HermesHealth, String> {
    let url = ensure_local_gateway_ready(&config)?;
    hermes_health().await.map(|mut h| {
        h.url = url;
        h
    })
}

#[tauri::command]
pub async fn apply_canvas_actions(_actions: Value) -> Result<(), String> {
    Ok(())
}
