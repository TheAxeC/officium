use serde::Serialize;
use serde_yaml::Value;
use std::fs;
use std::path::{Component, Path, PathBuf};
use tauri::{AppHandle, Manager};
use tauri_plugin_opener::OpenerExt;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RawSection {
    path: String,
    source: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RawDocument {
    document_path: String,
    document_source: String,
    section_sources: Vec<RawSection>,
}

#[tauri::command]
pub fn bundled_library_path(app: AppHandle) -> Result<Option<String>, String> {
    let path = app
        .path()
        .resource_dir()
        .map_err(|error| error.to_string())?
        .join("rituals");
    Ok(path.is_dir().then(|| path.to_string_lossy().into_owned()))
}

#[tauri::command]
pub fn load_library(root: String) -> Result<Vec<RawDocument>, String> {
    let root = canonical_directory(&root)?;
    let mut documents = Vec::new();
    collect_documents(&root, &root, &mut documents)?;
    documents.sort_by(|left, right| left.document_path.cmp(&right.document_path));
    Ok(documents)
}

#[tauri::command]
pub fn read_library_file(
    root: String,
    relative_path: String,
) -> Result<tauri::ipc::Response, String> {
    let root = canonical_directory(&root)?;
    let path = safe_file(&root, &relative_path)?;
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();
    if !["png", "jpg", "jpeg", "webp"].contains(&extension.as_str()) {
        return Err("only PNG, JPEG, and WebP library assets can be read".into());
    }
    fs::read(path)
        .map(tauri::ipc::Response::new)
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn open_source(app: AppHandle, root: String, relative_path: String) -> Result<(), String> {
    let root = canonical_directory(&root)?;
    let path = safe_file(&root, &relative_path)?;
    if path.extension().and_then(|value| value.to_str()) != Some("pdf") {
        return Err("source path must refer to a PDF".into());
    }
    app.opener()
        .open_path(path.to_string_lossy(), None::<&str>)
        .map_err(|error| error.to_string())
}

fn collect_documents(
    root: &Path,
    directory: &Path,
    output: &mut Vec<RawDocument>,
) -> Result<(), String> {
    let manifest = directory.join("document.yaml");
    if manifest.is_file() {
        output.push(read_composed_document(root, directory, &manifest)?);
        return Ok(());
    }

    let mut entries = fs::read_dir(directory)
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())?;
    entries.sort_by_key(|entry| entry.file_name());
    for entry in entries {
        let path = entry.path();
        if path.is_dir() {
            let name = entry.file_name();
            if name != "sources" && name != "assets" {
                collect_documents(root, &path, output)?;
            }
        } else if is_yaml(&path) {
            output.push(RawDocument {
                document_path: display_path(root, &path),
                document_source: fs::read_to_string(&path).map_err(|error| error.to_string())?,
                section_sources: Vec::new(),
            });
        }
    }
    Ok(())
}

fn read_composed_document(
    root: &Path,
    directory: &Path,
    manifest: &Path,
) -> Result<RawDocument, String> {
    let document_source = fs::read_to_string(manifest).map_err(|error| error.to_string())?;
    let value: Value = serde_yaml::from_str(&document_source).map_err(|error| error.to_string())?;
    let sections = value
        .get("sections")
        .and_then(Value::as_sequence)
        .ok_or_else(|| format!("{}: sections must be a list", display_path(root, manifest)))?;
    let mut section_sources = Vec::new();
    for section in sections {
        let relative = section.as_str().ok_or_else(|| {
            format!(
                "{}: section path must be a string",
                display_path(root, manifest)
            )
        })?;
        let section_path = safe_child(root, directory, relative)?;
        section_sources.push(RawSection {
            path: display_path(root, &section_path),
            source: fs::read_to_string(section_path).map_err(|error| error.to_string())?,
        });
    }
    Ok(RawDocument {
        document_path: display_path(root, manifest),
        document_source,
        section_sources,
    })
}

fn canonical_directory(path: &str) -> Result<PathBuf, String> {
    let path = fs::canonicalize(path).map_err(|error| error.to_string())?;
    path.is_dir()
        .then_some(path)
        .ok_or_else(|| "the selected ritual library is not a directory".into())
}

fn safe_file(root: &Path, relative: &str) -> Result<PathBuf, String> {
    let path = safe_child(root, root, relative)?;
    path.is_file()
        .then_some(path)
        .ok_or_else(|| format!("library file not found: {relative}"))
}

fn safe_child(root: &Path, base: &Path, relative: &str) -> Result<PathBuf, String> {
    let relative = Path::new(relative);
    if relative.is_absolute()
        || relative.components().any(|part| {
            matches!(
                part,
                Component::ParentDir
                    | Component::CurDir
                    | Component::RootDir
                    | Component::Prefix(_)
            )
        })
    {
        return Err("library paths must be relative and may not contain dot segments".into());
    }
    let candidate = fs::canonicalize(base.join(relative)).map_err(|error| error.to_string())?;
    candidate
        .starts_with(root)
        .then_some(candidate)
        .ok_or_else(|| "library path leaves the selected directory".into())
}

fn is_yaml(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|value| value.to_str()),
        Some("yaml" | "yml")
    )
}

fn display_path(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .unwrap_or(path)
        .to_string_lossy()
        .replace('\\', "/")
}

#[cfg(test)]
mod tests {
    use super::{collect_documents, safe_child};
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn loads_standalone_and_composed_documents_in_manifest_order() {
        let directory = tempdir().unwrap();
        let root = fs::canonicalize(directory.path()).unwrap();
        fs::create_dir_all(root.join("composed/sections")).unwrap();
        fs::create_dir_all(root.join("catechism")).unwrap();
        fs::write(
            root.join("composed/document.yaml"),
            "sections:\n  - sections/second.yaml\n  - sections/first.yaml\n",
        )
        .unwrap();
        fs::write(root.join("composed/sections/first.yaml"), "id: first\n").unwrap();
        fs::write(root.join("composed/sections/second.yaml"), "id: second\n").unwrap();
        fs::write(root.join("catechism/first.yaml"), "id: catechism\n").unwrap();

        let mut documents = Vec::new();
        collect_documents(&root, &root, &mut documents).unwrap();
        assert_eq!(documents.len(), 2);
        let composed = documents
            .iter()
            .find(|document| document.document_path == "composed/document.yaml")
            .unwrap();
        assert_eq!(
            composed.section_sources[0].path,
            "composed/sections/second.yaml"
        );
        assert_eq!(
            composed.section_sources[1].path,
            "composed/sections/first.yaml"
        );
    }

    #[test]
    fn rejects_paths_that_leave_the_library() {
        let directory = tempdir().unwrap();
        let root = directory.path();
        assert!(safe_child(root, root, "../outside.yaml").is_err());
        assert!(safe_child(root, root, "/outside.yaml").is_err());
    }
}
