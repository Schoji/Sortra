// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::{
    env, fs::{self, create_dir}, path::Path
};

use serde_json::{json, Value};
use tauri::{AppHandle, Emitter};
use chrono::Local;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}
#[tauri::command]
fn ls(dir: &Path) -> Vec<(String, u64)> {
    let paths = fs::read_dir(dir)
        .unwrap()
        .filter_map(|e| e.ok())
        .filter_map(|entry| {
            match entry.metadata() {
                Ok(meta) if meta.is_file() && !entry.file_name().to_string_lossy().starts_with(".") == true => {
                    let file_size = meta.len();
                    let file_name = entry.path().strip_prefix(dir).ok().map(|p| p.to_string_lossy().into_owned());
                    file_name.map(|name| (name, file_size))
                },
                _ => None,
            }
        })
        .collect();
    paths
}
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
enum MessageTypes {
    INFO,
    SUCCESS,
    WARNING,
    ERROR,
}

impl std::fmt::Display for MessageTypes{
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[tauri::command]
#[allow(unused_variables)]
fn send_message(app: AppHandle, message_type: MessageTypes, message: &str) {
    let now = Local::now();
    let time_str = now.format("%H:%M:%S").to_string();
    app.emit(
        "sort-log",
        format!("{},{},{}", time_str, message_type, message),
    )
    .unwrap();
}

#[tauri::command]
#[allow(unused_variables)]
fn update_progress(app: AppHandle, value: i32, max: i32) {
    app.emit(
        "sort-progress",
        json!({"value": value, "max": max}).to_string()
    )
    .unwrap();
}

#[tauri::command]
fn sort(app: AppHandle, json: serde_json::Map<String, Value>, dir: &Path) -> Result<(), String> {
    send_message(app.clone(), MessageTypes::INFO, "Starting file sorting operation...");
    match std::env::set_current_dir(dir) {
        Ok(_) => send_message(app.clone(), MessageTypes::SUCCESS, format!("Changed directory to {}", dir.display()).as_str()),
        Err(e) => send_message(app.clone(), MessageTypes::ERROR, format!("Error: {}", e.to_string()).as_str())
    }
    // Calculate the total number of files in all groups
    let total_files = json.values()
        .filter_map(|v| v.as_array())
        .map(|arr| arr.len())
        .sum::<usize>() as i32;
    let mut counter = 1;
    for (_key, value) in json.iter() {
        send_message(app.clone(), MessageTypes::INFO, format!("Processing group: {}", _key).as_str());
        let files: Vec<String> = match value.as_array() {
            Some(arr) => arr.iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect(),
            None => {
                send_message(app.clone(), MessageTypes::ERROR, format!("Expected array of strings.").as_str());
                return Err("Expected array of strings.".to_string());
            },
        };
        match create_dir(_key) {
            Ok(_) => send_message(app.clone(), MessageTypes::SUCCESS, format!("Created directory: /{}/", _key).as_str()),
            Err(e) => send_message(app.clone(), MessageTypes::ERROR, format!("Error: {}", e.to_string()).as_str())
        };
        for file in files {
            update_progress(app.clone(), counter, total_files);
            counter += 1;
            send_message(app.clone(), MessageTypes::INFO, format!("Moving {} to /{}", file, _key).as_str());
            let location: String = format!("{}/{}", _key, file);

            // Check if file exists before copying
            if !Path::new(&file).exists() {
                send_message(app.clone(), MessageTypes::ERROR, format!("File does not exist: {}", file).as_str());
                continue;
            }

            match std::fs::copy(&file, &location) {
                Ok(_) => {
                    send_message(app.clone(), MessageTypes::SUCCESS, format!("Moved: {} → /{}/", file, _key).as_str());
                    // Only remove if copy succeeded
                    match std::fs::remove_file(&file) {
                        Ok(_) => send_message(app.clone(), MessageTypes::SUCCESS, format!("Removed: {}", file).as_str()),
                        Err(e) => send_message(app.clone(), MessageTypes::ERROR, format!("Error removing file: {}", e.to_string()).as_str())
                    }
                },
                Err(e) => {
                    send_message(app.clone(), MessageTypes::ERROR, format!("Error copying file: {}", e.to_string()).as_str());
                }
            }
        }
        send_message(app.clone(), MessageTypes::SUCCESS, format!("Processed group: {}", _key).as_str());
    }
    send_message(app.clone(), MessageTypes::SUCCESS, format!("File sorting operation completed!").as_str());
    Ok(())
}

#[tauri::command]
fn sort_mock(app: AppHandle, json: serde_json::Map<String, Value>, dir: &Path) -> Result<(), String> {
    send_message(app.clone(), MessageTypes::INFO, "Starting file sorting operation...");
    match std::env::set_current_dir(dir) {
        Ok(_) => send_message(app.clone(), MessageTypes::SUCCESS, format!("Changed directory to {}", dir.display()).as_str()),
        Err(e) => send_message(app.clone(), MessageTypes::ERROR, format!("Error: {}", e.to_string()).as_str())
    }
    let total_files = json.values()
        .filter_map(|v| v.as_array())
        .map(|arr| arr.len())
        .sum::<usize>() as i32;
    let mut counter = 1;
    for (_key, value) in json.iter() {
        send_message(app.clone(), MessageTypes::INFO, format!("Processing group: {}", _key).as_str());
        let files: Vec<String> = match value.as_array() {
            Some(arr) => arr.iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect(),
            None => {
                send_message(app.clone(), MessageTypes::ERROR, format!("Expected array of strings.").as_str());
                return Err("Expected array of strings.".to_string());
            },
        };
        // Simulate directory creation
        send_message(app.clone(), MessageTypes::SUCCESS, format!("Created directory: /{}/", _key).as_str());
        for file in files {
            update_progress(app.clone(), counter, total_files);
            counter+= 1;
            send_message(app.clone(), MessageTypes::INFO, format!("Moving {} to /{}", file, _key).as_str());
            // Simulate file copy
            send_message(app.clone(), MessageTypes::SUCCESS, format!("Moved: {} → /{}/", file, _key).as_str());
            // Simulate file removal
            send_message(app.clone(), MessageTypes::SUCCESS, format!("Removing: {}", file).as_str());
        }
        send_message(app.clone(), MessageTypes::SUCCESS, format!("Processed group: {}", _key).as_str());
    }
    send_message(app.clone(), MessageTypes::SUCCESS, format!("File sorting operation completed!").as_str());
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, ls, sort, sort_mock, send_message, update_progress])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}