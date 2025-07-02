import React from "react";
import { Code, FileBox, FileText, Image, Video } from "lucide-react";

const icons: Record<string, React.FC<any>> = {
    // Images
    ".png": Image,
    ".jpg": Image,
    ".jpeg": Image,
    ".gif": Image,
    ".bmp": Image,
    ".svg": Image,
    ".webp": Image,
    // Documents
    ".pdf": FileText,
    ".doc": FileText,
    ".docx": FileText,
    ".txt": FileText,
    ".rtf": FileText,
    ".md": FileText,
    // Spreadsheets
    ".xls": FileText,
    ".xlsx": FileText,
    ".csv": FileText,
    // Presentations
    ".ppt": FileText,
    ".pptx": FileText,
    // 3D Models
    ".stl": FileBox,
    ".3mf": FileBox,
    ".obj": FileBox,
    ".fbx": FileBox,
    // Videos
    ".mp4": Video,
    ".avi": Video,
    ".mov": Video,
    ".wmv": Video,
    ".flv": Video,
    ".mkv": Video,
    ".webm": Video,
    // Code files
    ".js": Code,
    ".ts": Code,
    ".jsx": Code,
    ".tsx": Code,
    ".py": Code,
    ".java": Code,
    ".c": Code,
    ".cpp": Code,
    ".cs": Code,
    ".rb": Code,
    ".go": Code,
    ".php": Code,
    ".html": Code,
    ".css": Code,
    ".json": Code,
    ".yaml": Code,
    ".yml": Code,
};

// Final component that returns JSX
export function getIconByExtension(extension: string) {
    const Icon = icons[extension.toLowerCase()] ?? FileText;
    return Icon;
}