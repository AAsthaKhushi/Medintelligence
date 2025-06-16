import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG, and DOCX files are allowed.'));
    }
  }
});

export function convertFileToBase64(fileBuffer: Buffer): string {
  return fileBuffer.toString('base64');
}

export function saveUploadedFile(fileBuffer: Buffer, fileName: string): string {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, fileBuffer);
  
  return filePath;
}

export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  
  return `${baseName}_${timestamp}_${random}${extension}`;
}
