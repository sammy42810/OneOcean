import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.render('community', { title: 'Community' });
});

export default router;
