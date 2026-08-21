import { Router } from 'express';
import moment from 'moment';
import eventData from '../data/events.js';
import beachData from '../data/beaches.js';
import advisoryData from '../data/advisories.js';
import userData from '../data/users.js'; // Added users data import
import { checkId, checkString, errorMessage } from '../helpers.js';
import beachUtils from '../utils/beach_utils.js';

const router = Router();

const LONG_BEACH_CENTER = {
  longitude: -118.149475,
  latitude: 33.7543085
};

const REVIEW_FEED_LIMIT = 8;

// Return the creation Date embedded in a nested comment/rating ObjectId, or null.
const timestampFromId = (id) => {
  if (id && typeof id.getTimestamp === 'function') return id.getTimestamp();
  return null;
};

// Flatten every beach's ratings and comments into a single feed of recent
// activity, newest first (ordered by the ObjectId timestamp each carries).
const buildRecentReviews = (beaches) => {
  const feed = [];
  for (const beach of beaches) {
    for (const rating of beach.BeachRatings || []) {
      feed.push({
        type: 'rating',
        beachId: beach._id,
        beachName: beach.beachName,
        name: rating.name,
        rating: rating.rating,
        timestamp: timestampFromId(rating._id)
      });
    }
    for (const comment of beach.BeachComments || []) {
      feed.push({
        type: 'comment',
        beachId: beach._id,
        beachName: beach.beachName,
        name: comment.name,
        comment: comment.comment,
        timestamp: timestampFromId(comment._id)
      });
    }
  }

  feed.sort((a, b) => {
    const aTime = a.timestamp ? a.timestamp.getTime() : 0;
    const bTime = b.timestamp ? b.timestamp.getTime() : 0;
    return bTime - aTime;
  });

  return feed.slice(0, REVIEW_FEED_LIMIT).map((item) => ({
    ...item,
    when: item.timestamp ? moment(item.timestamp).format('MM/DD/YYYY hh:mma') : null
  }));
};

// Pair each active advisory with the beach it belongs to (advisories store the
// numeric dataset beachId, so map it back to a beach document for name/link).
const buildActiveAdvisories = (advisories, beaches) => {
  const beachByDatasetId = {};
  for (const beach of beaches) beachByDatasetId[String(beach.beachId)] = beach;

  return advisories.map((advisory) => {
    const beach = beachByDatasetId[String(advisory.beachId)];
    return {
      advisoryType: advisory.advisoryType,
      advisoryCause: advisory.advisoryCause,
      startDate: advisory.advisoryStartDate,
      startTime: advisory.advisoryStartTime,
      beachId: beach ? beach._id : null,
      beachName: beach ? beach.beachName : null
    };
  });
};

// ==========================================
// 1. GET /community (List All Events + Search/Filters)
// ==========================================
router.get('/', async (req, res) => {
  try {
    const currentUserId = req.session && req.session.user ? req.session.user._id : null;
    
    // Uses getVisibleEvents to filter out friends-only events for unauthorized users
    let eventsList = await eventData.getVisibleEvents(currentUserId);

    const { date, startTime, type, minAttendance, proximityDistance, county, minUserRating, maxUserRating, minAutoRating, maxAutoRating } = req.query;

    //filter by Event Date (YYYY-MM-DD)
    if (date && date.trim().length > 0) {
      eventsList = eventsList.filter((e) => e.eventDate === date.trim());
    }

    //filter by Start Time
    if (startTime && startTime.trim().length > 0) {
      eventsList = eventsList.filter((e) => e.startTime === startTime.trim());
    }

    //filter by Event Type (e.g. Beach Cleanup, Volleyball, etc.)
    if (type && type.trim().length > 0) {
      const typeQuery = type.trim().toLowerCase();
      eventsList = eventsList.filter(
        (e) => e.eventType && e.eventType.toLowerCase() === typeQuery
      );
    }

    //filter by Minimum Attendance/RSVP count
    if (minAttendance && !isNaN(+minAttendance)) {
      const minCount = parseInt(minAttendance, 10);
      eventsList = eventsList.filter(
        (e) => Array.isArray(e.attendants) && e.attendants.length >= minCount
      );
    }

    let filteredBeaches;
    //filter by proximity to long beach (simulates user location)
    if (proximityDistance && proximityDistance !== '0') {
        let sanatizedProximityDistance = (beachUtils.validateDistance(proximityDistance)) * 1609.34
        filteredBeaches = await beachData.getBeachesByDistance(LONG_BEACH_CENTER.longitude, LONG_BEACH_CENTER.latitude, sanatizedProximityDistance)
    }
    else {
        filteredBeaches = await beachData.getAllBeaches();
    }
    //filter by county
    if (county && county.trim().length > 0) {
        const queryCounty = beachUtils.validateBeachCounty(county).toLowerCase()
        filteredBeaches = filteredBeaches.filter((beach) => beach.county.trim().toLowerCase() === queryCounty);
    }
    //filter by min user rating
    if (minUserRating) {
        const queryMinUserRating = beachUtils.validateRating(minUserRating)
        filteredBeaches = filteredBeaches.filter((beach) => beach.userRating >= queryMinUserRating);
    }
    //filter by max user rating
    if (maxUserRating) {
        const queryMaxUserRating = beachUtils.validateRating(maxUserRating)
        filteredBeaches = filteredBeaches.filter((beach) => beach.userRating <= queryMaxUserRating);
    }
    //filter by min auto rating
    if (minAutoRating) {
        const queryMinAutoRating = beachUtils.validateRating(minAutoRating);
        filteredBeaches = filteredBeaches.filter((beach) => beach.autoRating !== null && beach.autoRating !== undefined && beach.autoRating >= queryMinAutoRating);
    }
    //filter by max auto rating
    if (maxAutoRating) {
        const queryMinAutoRating = beachUtils.validateRating(maxAutoRating);
        filteredBeaches = filteredBeaches.filter((beach) => beach.autoRating !== null && beach.autoRating !== undefined && beach.autoRating <= queryMaxAutoRating);
    }
    const criteriaBeachesList = filteredBeaches.map((beach) => beach._id);
    eventsList = eventsList.filter((event) => criteriaBeachesList.includes(event.beachId));

    // Activity feed: recent reviews across all beaches + currently active advisories.
    const allBeaches = await beachData.getAllBeaches();
    const recentReviews = buildRecentReviews(allBeaches);
    const activeAdvisories = buildActiveAdvisories(
      await advisoryData.getAllActiveAdvisories(),
      allBeaches
    );

    return res.render('community/index', {
      title: 'Community Events',
      events: eventsList,
      filters: req.query,
      recentReviews: recentReviews,
      activeAdvisories: activeAdvisories
    });
  } catch (e) {
    return res.status(500).render('error', { error: 'Could not load community events.' });
  }
});

// ==========================================
// 2. GET /community/create (Show Host Event Form)
// ==========================================
router.get('/create', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  const beaches = await beachData.getAllBeaches();
  return res.render('community/create', { title: 'Host an Event', beaches: beaches });
});

// ==========================================
// 3. POST /community/create (Process New Event Form)
// ==========================================
router.post('/create', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  const hostId = req.session.user._id;
  const { beachId, eventName, eventType, eventDate, startTime, endTime, meetingLocation, additionalDetails } = req.body;

  try {
    const beachIdChecked = checkId(beachId, 'Beach ID');
    const eventNameChecked = checkString(eventName, 'Event name');
    const eventTypeChecked = checkString(eventType, 'Event type');
    const eventDateChecked = checkString(eventDate, 'Event date');
    const startTimeChecked = checkString(startTime, 'Start time');
    const endTimeChecked = checkString(endTime, 'End time');
    const meetingLocationChecked = checkString(meetingLocation, 'Meeting location');
    const additionalDetailsChecked = checkString(additionalDetails, 'Additional details');

    const newEvent = await eventData.createEvent(
      hostId,
      beachIdChecked,
      eventNameChecked,
      eventTypeChecked,
      eventDateChecked,
      startTimeChecked,
      endTimeChecked,
      meetingLocationChecked,
      additionalDetailsChecked,
      visibility
    );

    return res.redirect(`/community/${newEvent._id}`);
  } catch (e) {
    const beaches = await beachData.getAllBeaches();
    return res.status(400).render('community/create', {
      title: 'Host an Event',
      error: errorMessage(e, 'Could not create event.'),
      hasErrors: true,
      eventInputs: req.body,
      beaches: beaches
    });
  }
});

// ==========================================
// 4. GET /community/:id (Single Event Details)
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await eventData.getEventById(eventId);

    //pass session user so the view knows RSVP/host state
    const sessionUser = req.session && req.session.user ? req.session.user : null;
    const userId = sessionUser ? sessionUser._id.toString() : null;

    // Enforce Friends-Only Access Control
    if (event.visibility === 'friends') {
      if (!userId) {
        return res.status(403).render('error', { error: 'This event is restricted to friends of the host.' });
      }

      const isHost = event.hostId.toString() === userId;
      const currentUser = await userData.getUserById(userId);
      const isFriend = Array.isArray(currentUser.friends) && currentUser.friends.some((f) => f.toString() === event.hostId.toString());

      if (!isHost && !isFriend) {
        return res.status(403).render('error', { error: 'This event is restricted to friends of the host.' });
      }
    }

    return res.render('community/single', {
      title: event.eventName,
      event: event,
      user: sessionUser,
      isHost: userId !== null && event.hostId.toString() === userId,
      isAttending: userId !== null && Array.isArray(event.attendants) && event.attendants.some((a) => a.toString() === userId)
    });
  } catch (e) {
    return res.status(404).render('error', { error: 'Event not found.' });
  }
});

// ==========================================
// 5. PATCH /community/:id (Update Event Details)
// ==========================================
router.patch('/:id', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }

  try {
    const eventId = checkId(req.params.id, 'Event ID');
    const userId = req.session.user._id;

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length === 0) {
      throw 'Request body must be a non-empty object.';
    }

    //check host authorization
    const event = await eventData.getEventById(eventId);
    if (event.hostId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'You are not authorized to update this event.' });
    }

    const updatedEvent = await eventData.patchEvent(eventId, req.body);
    return res.status(200).json(updatedEvent);
  } catch (e) {
    return res.status(400).json({ error: errorMessage(e, 'Could not update event.') });
  }
});

// ==========================================
// 6. DELETE /community/:id (Cancel Event)
// ==========================================
router.delete('/:id', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'You must be logged in.' });
  }

  try {
    const eventId = req.params.id;
    const userId = req.session.user._id;

    //check host authorization
    const event = await eventData.getEventById(eventId);
    if (event.hostId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'You are not authorized to cancel this event.' });
    }

    await eventData.removeEvent(eventId);
    return res.status(200).json({ deleted: true, eventId: eventId });
  } catch (e) {
    return res.status(400).json({ error: typeof e === 'string' ? e : 'Could not cancel event.' });
  }
});

// ==========================================
// 7. POST /community/:id/attend (RSVP to Event)
// ==========================================
router.post('/:id/attend', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const eventId = checkId(req.params.id, 'Event ID');
    const userId = req.session.user._id;

    const event = await eventData.getEventById(eventId);
    const alreadyAttending = Array.isArray(event.attendants) && event.attendants.some((a) => a.toString() === userId.toString());
    if (!alreadyAttending) {
      await eventData.addEventAttendant(eventId, userId);
    }

    return res.redirect(`/community/${eventId}`);
  } catch (e) {
    return res.status(400).render('error', { error: errorMessage(e, 'Could not RSVP to event.') });
  }
});

// ==========================================
// 8. POST /community/:id/comments (Add Comment to Event)
// ==========================================
router.post('/:id/comments', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const eventId = checkId(req.params.id, 'Event ID');
    const userId = req.session.user._id;
    const commentText = checkString(req.body.comment, 'Comment');

    await eventData.addEventComment(eventId, userId, commentText);

    return res.redirect(`/community/${eventId}`);
  } catch (e) {
    return res.status(400).render('error', { error: errorMessage(e, 'Could not post comment.') });
  }
});

export default router;