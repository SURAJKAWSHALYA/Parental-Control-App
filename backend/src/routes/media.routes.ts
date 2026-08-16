import { Router } from 'express';
import multer from 'multer';
import { uploadMedia, getMediaStream, deleteMedia, getMediaGallery, getMediaToken } from '../controllers/media.controller';
import { protect, optionalProtect } from '../middleware/auth.middleware';

const router = Router();

// Configure multer (using memory storage for abstraction layer passing)
// Initial configurable limits: 100MB total payload limit to accommodate video
const upload = multer({
  storage: multer.memoryStorage(),
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
    } else {
      cb(new Error('Invalid file type. Only images and videos are allowed.'));
    }
  }
});

// Optional auth for the stream route to allow token access
router.get('/:id', optionalProtect, getMediaStream);

// All other media routes are protected
router.use(protect);

router.post('/upload', upload.single('media'), uploadMedia);
router.get('/gallery', getMediaGallery);
router.get('/:id/token', getMediaToken);
router.delete('/:id', deleteMedia);

export default router;
