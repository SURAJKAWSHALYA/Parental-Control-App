import { Router } from 'express';
import {
  getPlaces,
  createPlace,
  updatePlace,
  deletePlace
} from '../controllers/place.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getPlaces);
router.post('/', createPlace);
router.put('/:id', updatePlace);
router.delete('/:id', deletePlace);

export default router;
