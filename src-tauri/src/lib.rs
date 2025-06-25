// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::{
    env,
    fs::{self}, path::Path,
};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
#[tauri::command]
fn ls(dir: &Path) -> Vec<String> {
    let paths = fs::read_dir(dir)
        .unwrap()
        .filter_map(|e| e.ok())
        .filter_map(|entry| {
            match entry.metadata() {
                Ok(meta) if meta.is_file() == true => Some(entry),
                _ => None,
            }
        })
        .filter_map(|e| e.path().strip_prefix(dir).ok().map(|p| p.to_string_lossy().into_owned()))
        .filter(|e| !e.starts_with("."))
        .collect::<Vec<_>>();
    paths
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, ls])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
