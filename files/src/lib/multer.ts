import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// =============================================================
//  Garante que a pasta de uploads existe
// =============================================================

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// =============================================================
//  Tipos de arquivo permitidos
// =============================================================

const MIME_PERMITIDOS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "video/mp4": "MP4",
  "application/zip": "ZIP",
  "application/x-zip-compressed": "ZIP",
};

// =============================================================
//  Storage — salva em /uploads com nome único
// =============================================================

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nome = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, nome);
  },
});

// =============================================================
//  Filtro de tipos
// =============================================================

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (MIME_PERMITIDOS[file.mimetype]) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Tipo de arquivo não permitido. Use: PDF, DOC, DOCX, PPT, PPTX, MP4 ou ZIP."
      )
    );
  }
}

// =============================================================
//  Export — 50 MB limite
// =============================================================

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

export { MIME_PERMITIDOS, UPLOAD_DIR };
