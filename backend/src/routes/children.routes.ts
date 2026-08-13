import express from 'express';
import { getChildren, addChild, getChild, updateChild, deleteChild } from '../controllers/children.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.route('/')
  .get(protect, getChildren)
  .post(protect, addChild);

router.route('/:id')
  .get(protect, getChild)
  .put(protect, updateChild)
  .delete(protect, deleteChild);

export default router;
