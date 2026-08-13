import { Router } from 'express';
import {
  getWebsiteRules,
  createWebsiteRule,
  updateWebsiteRule,
  deleteWebsiteRule,
  getAvailableCategories,
  getWebsiteCategories,
  updateWebsiteCategory
} from '../controllers/websiteRule.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/categories/available', getAvailableCategories);

router.get('/:deviceId/rules', getWebsiteRules);
router.post('/:deviceId/rules', createWebsiteRule);
router.put('/:deviceId/rules/:id', updateWebsiteRule);
router.delete('/:deviceId/rules/:id', deleteWebsiteRule);

router.get('/:deviceId/categories', getWebsiteCategories);
router.put('/:deviceId/categories/:category', updateWebsiteCategory);

export default router;
