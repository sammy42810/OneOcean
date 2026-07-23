import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.render('beaches/search', { title: 'Find Beaches' });
});

router.get('/:id', (req, res) => {
  res.render('beaches/detail', { title: 'Beach Detail' });
});

export default router;
