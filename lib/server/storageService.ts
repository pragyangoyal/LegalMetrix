import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_DIR = path.join(process.cwd(), 'data', 'uploads');

export interface StoredFileInfo {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  filePath: string;
  url: string;
}

export function ensureUploadsDir(inspectionId?: string): string {
  const dir = inspectionId ? path.join(UPLOADS_DIR, inspectionId) : UPLOADS_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function saveUploadedFile(
  inspectionId: string,
  file: File,
  order = 0,
  label?: string
): Promise<StoredFileInfo> {
  const inspectionDir = ensureUploadsDir(inspectionId);
  const fileId = uuidv4();
  const ext = path.extname(file.name) || '.jpg';
  const cleanExt = ext.startsWith('.') ? ext : `.${ext}`;
  const filename = `${fileId}${cleanExt}`;
  const filePath = path.join(inspectionDir, filename);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(filePath, buffer);

  return {
    id: fileId,
    filename,
    originalName: file.name,
    mimeType: file.type || 'image/jpeg',
    sizeBytes: file.size,
    filePath,
    url: `/api/uploads/${inspectionId}/${filename}`,
  };
}

export function saveBufferFile(
  inspectionId: string,
  buffer: Buffer,
  originalName: string,
  mimeType = 'image/jpeg'
): StoredFileInfo {
  const inspectionDir = ensureUploadsDir(inspectionId);
  const fileId = uuidv4();
  const ext = path.extname(originalName) || '.jpg';
  const filename = `${fileId}${ext}`;
  const filePath = path.join(inspectionDir, filename);

  fs.writeFileSync(filePath, buffer);

  return {
    id: fileId,
    filename,
    originalName,
    mimeType,
    sizeBytes: buffer.length,
    filePath,
    url: `/api/uploads/${inspectionId}/${filename}`,
  };
}

export function getFilePath(inspectionId: string, filename: string): string | null {
  const p = path.join(UPLOADS_DIR, inspectionId, filename);
  if (fs.existsSync(p)) return p;
  return null;
}

export function deleteInspectionFiles(inspectionId: string): void {
  const dir = path.join(UPLOADS_DIR, inspectionId);
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
      console.error(`Failed to delete uploads for inspection ${inspectionId}:`, e);
    }
  }
}
