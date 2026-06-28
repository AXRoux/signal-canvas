mod agent;
mod secure_store;
mod session_db;
mod telegram;

use tauri::Manager;

use agent::{
    apply_canvas_actions, ensure_hermes_gateway, hermes_correlate, hermes_health, hermes_scan,
    hermes_session_chat, integration_status, load_integration_config, nvidia_health,
    save_integration_config, setup_integrations_status,
};
use secure_store::{
    secure_auth_login, secure_auth_logout, secure_auth_register, secure_has_accounts,
    secure_is_unlocked, secure_migrate_legacy, secure_vault_load, secure_vault_save,
};
use telegram::{
    telegram_fetch_history, telegram_join_chat, telegram_list_dialogs, telegram_send_code,
    telegram_sign_in, telegram_start_monitor, telegram_status, telegram_stop_monitor,
    TelegramMonitorState,
};

#[tauri::command]
fn write_export_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    std::fs::write(path, contents).map_err(|e| e.to_string())
}

fn focus_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            focus_main_window(app);
        }))
        .manage(TelegramMonitorState::default())
        .invoke_handler(tauri::generate_handler![
            hermes_health,
            hermes_scan,
            hermes_correlate,
            hermes_session_chat,
            ensure_hermes_gateway,
            apply_canvas_actions,
            setup_integrations_status,
            save_integration_config,
            load_integration_config,
            nvidia_health,
            integration_status,
            telegram_status,
            telegram_send_code,
            telegram_sign_in,
            telegram_list_dialogs,
            telegram_join_chat,
            telegram_fetch_history,
            telegram_start_monitor,
            telegram_stop_monitor,
            secure_auth_register,
            secure_auth_login,
            secure_auth_logout,
            secure_has_accounts,
            secure_is_unlocked,
            secure_vault_load,
            secure_vault_save,
            secure_migrate_legacy,
            write_export_file,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Reopen { .. } = event {
                focus_main_window(app_handle);
            }
        });
}
