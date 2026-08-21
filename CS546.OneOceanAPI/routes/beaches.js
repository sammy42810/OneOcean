import { Router } from 'express';
import beachData from '../data/beaches.js';
import advisoryData from '../data/advisories.js';
import beachUtils from '../utils/beach_utils.js';
import advisoryUtils from '../utils/advisory_utils.js';

const router = Router();

// ==========================================
// 1. GET /beaches (List + Search & Filter)
// ==========================================
router.get('/', async (req, res) => {
  try {
    let allBeaches = await beachData.getAllBeaches();

    const { 
      search, 
      name,
      county, 
      city, 
      status, 
      minLength, 
      maxLength,
      waterQuality,
      minUserRating,
      maxUserRating,
      minAutoRating,
      maxAutoRating,
      minSize,
      maxSize
    } = req.query;

    if (search && search.trim().length > 0) {
      const query = search.trim().toLowerCase();
      allBeaches = allBeaches.filter(
        (beach) =>
          (beach.beachName && beach.beachName.toLowerCase().includes(query)) ||
          (beach.county && beach.county.toLowerCase().includes(query)) ||
          (beach.city && beach.city.toLowerCase().includes(query))
      );
    }
    
    if (name && name.trim().length > 0) {
      const nameQuery = name.trim().toLowerCase();
      allBeaches = allBeaches.filter((b) =>
        b.beachName && b.beachName.toLowerCase().includes(nameQuery)
      );
    }

    if (county && county.trim().length > 0) {
      const countyQuery = county.trim().toLowerCase();
      allBeaches = allBeaches.filter((b) =>
        b.county && b.county.toLowerCase().includes(countyQuery)
      );
    }

    if (city && city.trim().length > 0) {
      const cityQuery = city.trim().toLowerCase();
      allBeaches = allBeaches.filter((b) =>
        b.city && b.city.toLowerCase().includes(cityQuery)
      );
    }

    if (status && status.trim().length > 0) {
      const statusQuery = status.trim().toLowerCase();
      allBeaches = allBeaches.filter(
        (b) => b.status && b.status.toLowerCase() === statusQuery
      );
    }

    if (waterQuality && waterQuality.trim().length > 0) {
      const wqQuery = waterQuality.trim().toLowerCase();
      allBeaches = allBeaches.filter((b) => 
        b.waterQuality !== null && b.waterQuality !== undefined &&
        b.waterQuality.toString().toLowerCase() === wqQuery
      );
    }

    const effectiveMinLength = minLength || minSize;
    if (effectiveMinLength && !isNaN(+effectiveMinLength)) {
      allBeaches = allBeaches.filter((b) => b.beachLength >= parseFloat(effectiveMinLength));
    }

    const effectiveMaxLength = maxLength || maxSize;
    if (effectiveMaxLength && !isNaN(+effectiveMaxLength)) {
      allBeaches = allBeaches.filter((b) => b.beachLength <= parseFloat(effectiveMaxLength));
    }

    if (minUserRating && !isNaN(+minUserRating)) {
      allBeaches = allBeaches.filter((b) => b.userRating !== null && b.userRating !== undefined && b.userRating >= parseFloat(minUserRating));
    }
    if (maxUserRating && !isNaN(+maxUserRating)) {
      allBeaches = allBeaches.filter((b) => b.userRating !== null && b.userRating !== undefined && b.userRating <= parseFloat(maxUserRating));
    }

    if (minAutoRating && !isNaN(+minAutoRating)) {
      allBeaches = allBeaches.filter((b) => b.autoRating !== null && b.autoRating !== undefined && b.autoRating >= parseFloat(minAutoRating));
    }
    if (maxAutoRating && !isNaN(+maxAutoRating)) {
      allBeaches = allBeaches.filter((b) => b.autoRating !== null && b.autoRating !== undefined && b.autoRating <= parseFloat(maxAutoRating));
    }

    return res.render('beaches/search', {
      title: 'Explore Beaches',
      beaches: allBeaches,
      searchQuery: search || name || ''
    });
  } catch (e) {
    return res.status(500).render('error', { error: 'Could not fetch beaches.' });
  }
});

// ==========================================
// 2. GET /beaches/map (Get Mapped Beaches Page)
// ==========================================
router.get('/map', async (req, res) => {
  try {
    const { 
      proximityCenter,
      proximityDistance,
      city, 
      county, 
      status,
      minLength, 
      maxLength,
      minUserRating,
      maxUserRating,
      minAutoRating,
      maxAutoRating,
      activeAdvisories
    } = req.query;

    let allBeaches;
    //filter by proximity
    if (proximityCenter && proximityDistance && proximityCenter.trim().length > 0 && proximityDistance.trim().length > 0) {
      let sanatizedProximityCenter = proximityCenter.split(',')
      let sanatizedProximityDistance = parseFloat(proximityDistance) * 1609.34
      allBeaches = await beachData.getBeachesByDistance(sanatizedProximityCenter[0], sanatizedProximityCenter[1], sanatizedProximityDistance)
    }
    else {
      allBeaches = await beachData.getAllBeaches();
    }

    //filter by city
    if (city && city.trim().length > 0) {
      const queryCity = city.trim().toLowerCase();
      allBeaches = allBeaches.filter((beach) => beach.city.trim().toLowerCase() === queryCity);
    }

    //filter by county
    if (county && county.trim().length > 0) {
      const queryCounty = county.trim().toLowerCase()
      allBeaches = allBeaches.filter((beach) => beach.county.trim().toLowerCase() === queryCounty);
    }

    //filter by status
    if (status && status.trim().length > 0) {
      const queryStatus = status.trim().toLowerCase();
      allBeaches = allBeaches.filter((beach) => beach.status.trim().toLowerCase() === queryStatus);
    }

    //filter by min length
    if (minLength) {
      const queryMinLength = beachUtils.validateBeachLength(minLength)
      allBeaches = allBeaches.filter((beach) => beach.beachLength >= queryMinLength);
    }

    //filter by max length
    if (maxLength) {
      const queryMaxLength = beachUtils.validateBeachLength(maxLength)
      allBeaches = allBeaches.filter((beach) => beach.beachLength <= queryMaxLength);
    }

    //filter by min user rating
    if (minUserRating) {
      const queryMinUserRating = beachUtils.validateRating(minUserRating)
      allBeaches = allBeaches.filter((beach) => beach.userRating >= queryMinUserRating);
    }

    //filter by max user rating
    if (maxUserRating) {
      const queryMaxUserRating = beachUtils.validateRating(maxUserRating)
      allBeaches = allBeaches.filter((beach) => beach.userRating <= queryMaxUserRating);
    }

    //filter by min auto rating
    if (minAutoRating && !isNaN(+minAutoRating)) {
      const queryMinAutoRating = parseFloat(minAutoRating);
      allBeaches = allBeaches.filter((beach) => beach.autoRating !== null && beach.autoRating !== undefined && beach.autoRating >= queryMinAutoRating);
    }

    //filter by max auto rating
    if (maxAutoRating && !isNaN(+maxAutoRating)) {
      const queryMaxAutoRating = parseFloat(maxAutoRating);
      allBeaches = allBeaches.filter((beach) => beach.autoRating !== null && beach.autoRating !== undefined && beach.autoRating <= queryMaxAutoRating);
    }

    //filter by has active advisories
    if (activeAdvisories && activeAdvisories.trim().length > 0) {
      let allAdvisories = await Promise.all(allBeaches.map(async (beach) => await advisoryData.getActiveAdvisoriesByBeachId(beach._id)));
      const queryAdvisories = activeAdvisories.trim().toLowerCase();
      if (queryAdvisories === 'yes') {
        allBeaches = allBeaches.filter((beach, index) => allAdvisories[index].length > 0);
      }
      else if (queryAdvisories === 'no') {
        allBeaches = allBeaches.filter((beach, index) => allAdvisories[index].length === 0);
      }
    }

    return res.render('beaches/map', {
      title: 'View Beaches',
      beaches: JSON.stringify(allBeaches),
      filters: req.query
    });
  } catch (e) {
    console.log(e)
    return res.status(500).render('error', { error: 'Could not fetch beaches map.' });
  }
});

// ==========================================
// 2. GET /beaches/:id (Get Single Beach Page)
// ==========================================
router.get('/:id', async (req, res) => {
  try {
    const beachId = req.params.id;
    const beach = await beachData.getBeachById(beachId);
    const activeAdvisories = await advisoryData.getActiveAdvisoriesByBeachId(beachId);

    const userId = req.session && req.session.user ? req.session.user._id.toString() : null;
    const ownRating = userId && Array.isArray(beach.BeachRatings)
      ? beach.BeachRatings.find((r) => r.raterId.toString() === userId)
      : null;

    return res.render('beaches/detail', {
      title: beach.beachName,
      beach: beach,
      activeAdvisories: activeAdvisories,
      hasActiveAdvisories: activeAdvisories.length > 0,
      ownRating: ownRating || null
    });
  } catch (e) {
    return res.status(404).render('error', { error: 'Beach not found.' });
  }
});

// ==========================================
// 3. POST /beaches/:id/comments (Add Comment)
// ==========================================
router.post('/:id/comments', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const beachId = req.params.id;
    const userId = req.session.user._id;
    const commentText = req.body.comment;

    await beachData.addBeachComment(beachId, userId, commentText);
    return res.redirect(`/beaches/${beachId}`);
  } catch (e) {
    return res.status(400).render('error', { error: 'Could not post comment.' });
  }
});

router.post('/:id/ratings', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  try {
    const beachId = req.params.id;
    const userId = req.session.user._id;
    const rating = req.body.rating;

    await beachData.addBeachRating(beachId, userId, rating);
    return res.redirect(`/beaches/${beachId}`);
  } catch (e) {
    return res.status(400).render('error', { error: typeof e === 'string' ? e : 'Could not submit rating.' });
  }
});

router.patch('/:id/ratings', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'You must be logged in to update a rating.' });
  }

  try {
    const beachId = req.params.id;
    const userId = req.session.user._id;
    const rating = req.body.rating;

    const updatedBeach = await beachData.patchBeachRating(beachId, userId, rating);
    return res.status(200).json({ userRating: updatedBeach.userRating, BeachRatings: updatedBeach.BeachRatings });
  } catch (e) {
    return res.status(400).json({ error: typeof e === 'string' ? e : 'Could not update rating.' });
  }
});

router.delete('/:id/ratings', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'You must be logged in to remove a rating.' });
  }

  try {
    const beachId = req.params.id;
    const userId = req.session.user._id;

    const updatedBeach = await beachData.removeBeachRating(beachId, userId);
    return res.status(200).json({ userRating: updatedBeach.userRating, BeachRatings: updatedBeach.BeachRatings });
  } catch (e) {
    return res.status(400).json({ error: typeof e === 'string' ? e : 'Could not remove rating.' });
  }
});

export default router;