import { Router } from 'express';
import usersData from '../data/users.js';

const router = Router();

const sessionUser = (user) => ({ id: user._id, email: user.email, firstName: user.firstName });

const publicUser = (user) => {
  const { hashedPassword, ...rest } = user;
  return rest;
};

router.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up' });
});

router.get('/login', (req, res) => {
  res.render('login', { title: 'Log In' });
});

router.post('/signup', async (req, res) => {
  const { firstName, lastName, email, gender, city, state, age, password } = req.body;

  let newUser;
  try {
    newUser = await usersData.createUser(firstName, lastName, email, gender, city, state, age, password);
  } catch (e) {
    const message = typeof e === 'string' ? e : 'Could not create user';
    return res.status(/already exists/i.test(message) ? 409 : 400).json({ error: message });
  }

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Could not start session' });
    req.session.user = sessionUser(newUser);
    return res.status(201).json(publicUser(newUser));
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  let user;
  try {
    user = await usersData.checkLogin(email, password);
  } catch (e) {
    const message = typeof e === 'string' ? e : 'Could not log in';
    return res.status(/invalid/i.test(message) ? 401 : 400).json({ error: message });
  }

  req.session.regenerate((err) => {
    if (err) return res.status(500).json({ error: 'Could not start session' });
    req.session.user = sessionUser(user);
    return res.status(200).json(publicUser(user));
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Could not log out' });
    res.clearCookie('AuthenticationState');
    return res.status(200).json({ message: 'Logged out successfully' });
  });
});

export default router;
