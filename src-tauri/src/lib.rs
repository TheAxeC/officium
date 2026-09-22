mod library;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            library::bundled_library_path,
            library::load_library,
            library::open_source,
            library::read_library_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running Officium");
}
