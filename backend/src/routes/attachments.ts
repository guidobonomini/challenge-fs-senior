import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  upload, 
  uploadTaskAttachment, 
  getTaskAttachments, 
  downloadAttachment, 
  deleteAttachment 
} from '../controllers/attachmentController';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Apply rate limiting to upload routes
router.use('/tasks/:taskId/upload', rateLimiter({ windowMs: 60000, max: 10 })); // 10 uploads per minute

// Upload attachment to task
router.post('/tasks/:taskId/upload', upload.single('file'), uploadTaskAttachment);

// Get all attachments for a task
router.get('/tasks/:taskId', getTaskAttachments);

// Download specific attachment
router.get('/:attachmentId/download', downloadAttachment);

// Delete specific attachment
router.delete('/:attachmentId', deleteAttachment);

export default router;