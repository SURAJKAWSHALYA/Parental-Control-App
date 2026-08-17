"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const media_controller_1 = require("../controllers/media.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Configure multer (using memory storage for abstraction layer passing)
// Initial configurable limits: 100MB total payload limit to accommodate video
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
    },
    fileFilter: (req, file, cb) => {
        // Validate MIME types
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            // Apply strict size checking per type
            const isImage = file.mimetype.startsWith('image/');
            const maxSize = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
            // We can't easily check file size here as it hasn't streamed fully, 
            // but multer will reject if the global limit is hit. We can also check in controller.
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only images and videos are allowed.'));
        }
    }
});
// Optional auth for the stream route to allow token access
router.get('/:id', auth_middleware_1.optionalProtect, media_controller_1.getMediaStream);
// All other media routes are protected
router.use(auth_middleware_1.protect);
router.post('/upload', upload.single('media'), media_controller_1.uploadMedia);
router.get('/gallery', media_controller_1.getMediaGallery);
router.get('/:id/token', media_controller_1.getMediaToken);
router.delete('/:id', media_controller_1.deleteMedia);
exports.default = router;
