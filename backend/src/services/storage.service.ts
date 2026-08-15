import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export class StorageService {
  /**
   * Abstracted method to upload a file to storage
   * @param fileBuffer The raw file buffer
   * @param extension The file extension (e.g. .jpg)
   * @returns The storage key representing the uploaded file
   */
  static async uploadFile(fileBuffer: Buffer, extension: string): Promise<string> {
    const key = `${uuidv4()}${extension}`;
    const filePath = path.join(UPLOADS_DIR, key);
    
    await fs.promises.writeFile(filePath, fileBuffer);
    
    return key;
  }

  /**
   * Retrieve a file's read stream
   */
  static getFileStream(key: string) {
    const filePath = path.join(UPLOADS_DIR, key);
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found in storage');
    }
    return fs.createReadStream(filePath);
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(key: string): Promise<boolean> {
    try {
      const filePath = path.join(UPLOADS_DIR, key);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return true;
    } catch (error) {
      console.error(`Failed to delete file with key ${key}`, error);
      return false;
    }
  }
}
