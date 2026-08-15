"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const UPLOADS_DIR = path_1.default.join(__dirname, '../../uploads');
// Ensure uploads directory exists
if (!fs_1.default.existsSync(UPLOADS_DIR)) {
    fs_1.default.mkdirSync(UPLOADS_DIR, { recursive: true });
}
class StorageService {
    /**
     * Abstracted method to upload a file to storage
     * @param fileBuffer The raw file buffer
     * @param extension The file extension (e.g. .jpg)
     * @returns The storage key representing the uploaded file
     */
    static async uploadFile(fileBuffer, extension) {
        const key = `${(0, uuid_1.v4)()}${extension}`;
        const filePath = path_1.default.join(UPLOADS_DIR, key);
        await fs_1.default.promises.writeFile(filePath, fileBuffer);
        return key;
    }
    /**
     * Retrieve a file's read stream
     */
    static getFileStream(key) {
        const filePath = path_1.default.join(UPLOADS_DIR, key);
        if (!fs_1.default.existsSync(filePath)) {
            throw new Error('File not found in storage');
        }
        return fs_1.default.createReadStream(filePath);
    }
    /**
     * Delete a file from storage
     */
    static async deleteFile(key) {
        try {
            const filePath = path_1.default.join(UPLOADS_DIR, key);
            if (fs_1.default.existsSync(filePath)) {
                await fs_1.default.promises.unlink(filePath);
            }
            return true;
        }
        catch (error) {
            console.error(`Failed to delete file with key ${key}`, error);
            return false;
        }
    }
}
exports.StorageService = StorageService;
