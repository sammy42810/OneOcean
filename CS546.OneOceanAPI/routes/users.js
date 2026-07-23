import { Router } from 'express';

const router = Router();

router.get('/profile', (req, res) => {
  res.render('profile', { title: 'My Profile' });
});

router.get('/bookmarks', (req, res) => {
  res.render('bookmarks', { title: 'My Bookmarks' });
});

export default router;
