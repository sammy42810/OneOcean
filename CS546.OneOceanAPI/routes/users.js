import { Router } from 'express';
import userData from '../data/users.js';
import beachData from '../data/beaches.js';
import eventData from '../data/events.js';

const router = Router();

// Resolve a list of beach ids into beach documents, skipping any that no longer exist.
const resolveBeaches = async (beachIds) => {
  const resolved = [];
  for (const beachId of beachIds) {
    try {
      const beach = await beachData.getBeachById(beachId);
      if (beach) resolved.push(beach);
    } catch {
      // Skip beaches that can no longer be found
    }
  }
  return resolved;
};

// ==========================================
// 1. GET /profile (Show current logged-in profile)
// ==========================================
router.get('/profile', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const userId = req.session.user._id;
    const user = await userData.getUserById(userId);

    // Saved beaches (bookmarks)
    const favoriteIds = user.favoriteBeaches || [];
    const bookmarks = await resolveBeaches(favoriteIds);

    // Reviews: this user's ratings/comments left across all beaches
    const allBeaches = await beachData.getAllBeaches();
    const reviews = [];
    for (const beach of allBeaches) {
      const myRating = (beach.BeachRatings || []).find(
        (r) => r.raterId && r.raterId.toString() === userId.toString()
      );
      const myComments = (beach.BeachComments || []).filter(
        (c) => c.commenterId && c.commenterId.toString() === userId.toString()
      );
      if (myRating || myComments.length > 0) {
        reviews.push({
          beachId: beach._id,
          beachName: beach.beachName,
          rating: myRating ? myRating.rating : null,
          comments: myComments
        });
      }
    }

    // Events this user is attending
    const allEvents = await eventData.getAllEvents();
    const attendingEvents = allEvents.filter(
      (e) =>
        Array.isArray(e.attendants) &&
        e.attendants.some((a) => a.toString() === userId.toString())
    );

    const initials = `${(user.firstName || '?').charAt(0)}${(user.lastName || '').charAt(0)}`.toUpperCase();

    return res.render('users/profile', {
      title: 'My Profile',
      user: user,
      isOwner: true,
      initials: initials,
      bookmarks: bookmarks,
      reviews: reviews,
      events: attendingEvents
    });
  } catch (e) {
    return res.status(500).render('error', { error: 'Could not load profile.' });
  }
});

// ==========================================
// 2. GET /profile/edit (Show edit form for logged-in user)
// ==========================================
router.get('/profile/edit', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const userId = req.session.user._id;
    const user = await userData.getUserById(userId);

    return res.render('users/edit', {
      title: 'Edit Profile',
      userInputs: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender,
        city: user.city,
        state: user.state,
        age: user.age
      }
    });
  } catch (e) {
    return res.status(500).render('error', { error: 'Could not load your profile.' });
  }
});

// ==========================================
// 3. POST /profile/edit (Update logged-in user's details)
// ==========================================
router.post('/profile/edit', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  const userId = req.session.user._id;
  const { firstName, lastName, email, gender, city, state, age } = req.body;

  try {
    const updateObject = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      gender: gender,
      city: city,
      state: state,
      age: parseInt(age, 10)
    };

    const updatedUser = await userData.patchUser(userId, updateObject);

    // keep the session copy in sync with the fields it stores
    req.session.user = {
      _id: updatedUser._id.toString(),
      email: updatedUser.email,
      firstName: updatedUser.firstName
    };

    return res.redirect('/profile');
  } catch (e) {
    return res.status(400).render('users/edit', {
      title: 'Edit Profile',
      error: typeof e === 'string' ? e : 'Could not update your profile.',
      hasErrors: true,
      userInputs: req.body
    });
  }
});

// ==========================================
// 4. GET /bookmarks (Show current user's saved beaches)
// ==========================================
router.get('/bookmarks', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const userId = req.session.user._id;
    const user = await userData.getUserById(userId);

    const favoriteIds = user.favoriteBeaches || [];
    const savedBeaches = await resolveBeaches(favoriteIds);

    return res.render('users/bookmarks', {
      title: 'My Saved Beaches',
      beaches: savedBeaches,
      userId: userId,
      isPrivate: user.isBookmarksPrivate || false
    });
  } catch (e) {
    return res.status(500).render('error', { error: 'Could not load bookmarks.' });
  }
});

// ==========================================
// 5. POST /bookmarks/:beachId (Add bookmark)
// ==========================================
router.post('/bookmarks/:beachId', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const userId = req.session.user._id;
    const beachId = req.params.beachId;

    await userData.addFavoriteBeach(userId, beachId);

    return res.redirect('/bookmarks');
  } catch (e) {
    return res.status(400).render('error', { error: 'Could not add bookmark.' });
  }
});

// ==========================================
// 6. POST /bookmarks/:beachId/delete (Remove bookmark via HTML Form)
// ==========================================
router.post('/bookmarks/:beachId/delete', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const userId = req.session.user._id;
    const beachId = req.params.beachId;

    await userData.removeFavoriteBeach(userId, beachId);

    return res.redirect('/bookmarks');
  } catch (e) {
    return res.status(400).render('error', { error: 'Could not delete bookmark.' });
  }
});

// ======================================================
// 7. GET /users/:id/favorites (List target user's favorites + Privacy)
// ======================================================
router.get('/users/:id/favorites', async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.session?.user?._id;

    const targetUser = await userData.getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).render('error', { error: 'User not found.' });
    }

    const isOwner = currentUserId && currentUserId.toString() === targetUserId.toString();
    if (targetUser.isBookmarksPrivate && !isOwner) {
      return res.status(403).render('error', {
        error: 'This user’s bookmarked beaches are private.'
      });
    }

    const favoriteIds = targetUser.favoriteBeaches || targetUser.favorites || [];
    const favoriteBeaches = await Promise.all(
      favoriteIds.map(async (beachId) => {
        try {
          return await beachData.getBeachById(beachId);
        } catch {
          return null;
        }
      })
    );

    return res.render('users/favorites', {
      title: `${targetUser.firstName}'s Saved Beaches`,
      beaches: favoriteBeaches.filter((b) => b !== null),
      isOwner: isOwner,
      isPrivate: targetUser.isBookmarksPrivate || false,
      targetUser: targetUser
    });
  } catch (e) {
    return res.status(500).render('error', {
      error: typeof e === 'string' ? e : 'Could not retrieve favorites.'
    });
  }
});

// ======================================================
// 8. POST /users/:id/favorites (RESTful Add Favorite)
// ======================================================
router.post('/users/:id/favorites', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  const targetUserId = req.params.id;
  const currentUserId = req.session.user._id;

  if (currentUserId.toString() !== targetUserId.toString()) {
    return res.status(403).render('error', { error: 'You can only manage your own bookmarks.' });
  }

  const { beachId } = req.body;
  try {
    await userData.addFavoriteBeach(currentUserId, beachId.trim());
    return res.redirect(`/users/${currentUserId}/favorites`);
  } catch (e) {
    return res.status(400).render('error', { error: typeof e === 'string' ? e : 'Could not add favorite.' });
  }
});

// ======================================================
// 9. DELETE /users/:id/favorites/:beachId (RESTful Remove Favorite)
// ======================================================
router.delete('/users/:id/favorites/:beachId', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }

  const { id: targetUserId, beachId } = req.params;
  const currentUserId = req.session.user._id;

  if (currentUserId.toString() !== targetUserId.toString()) {
    return res.status(403).json({ error: 'You can only modify your own bookmarks.' });
  }

  try {
    await userData.removeFavoriteBeach(currentUserId, beachId);
    return res.status(200).json({ success: true, removedBeachId: beachId });
  } catch (e) {
    return res.status(400).json({ error: typeof e === 'string' ? e : 'Could not remove favorite.' });
  }
});

// ======================================================
// 10. PATCH /users/:id/favorites/visibility (Toggle Privacy)
// ======================================================
router.patch('/users/:id/favorites/visibility', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }

  const targetUserId = req.params.id;
  const currentUserId = req.session.user._id;

  if (currentUserId.toString() !== targetUserId.toString()) {
    return res.status(403).json({ error: 'You can only update your own settings.' });
  }

  try {
    const { isPrivate } = req.body;
    const updatedUser = await userData.setBookmarkVisibility(currentUserId, Boolean(isPrivate));

    return res.status(200).json({
      success: true,
      isBookmarksPrivate: updatedUser.isBookmarksPrivate
    });
  } catch (e) {
    return res.status(400).json({ error: typeof e === 'string' ? e : 'Could not update visibility.' });
  }
});

export default router;