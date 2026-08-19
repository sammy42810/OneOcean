import generalUtils from '../utils/general_utils.js'
import beachUtils from '../utils/beach_utils.js'
import users from './users.js'
import {beaches} from '../config/mongoCollections.js'
import {ObjectId} from 'mongodb';
const formatBeach = (beach) => ({ ...beach, _id: beach._id.toString() });


let exportedMethods = {
    async createBeach(beachId, beachName, city, county, status, beachLength, upperLat, lowerLat, upperLon, lowerLon) {
        let beachIdSanatized = generalUtils.validateDatasetId(beachId);
         let beachLengthSanatized = beachUtils.validateBeachLength(beachLength);
        let beachNameSanatized = beachUtils.validateBeachName(beachName);
        let citySanatized = beachUtils.validateBeachCity(city);
        let countySanatized = beachUtils.validateBeachCounty(county);
        let geoObjectSanatized = beachUtils.createGeoObject(upperLon, upperLat, lowerLon, lowerLat);
        let statusSanatized = beachUtils.validateBeachStatus(status);
       

        let newBeach = {
            beachId: beachIdSanatized,
            beachLength: beachLengthSanatized,
            beachName: beachNameSanatized,
            city: citySanatized,
            county: countySanatized,
            geoObject: geoObjectSanatized,
            status: statusSanatized,
            waterQuality: null,
            userRating: null,
            BeachComments: [],
            BeachRatings: []
        };
        
        const beachesCollection = await beaches();
        const insertInfo = await beachesCollection.insertOne(newBeach);
        if (!insertInfo.acknowledged || !insertInfo.insertedId)
        {
            throw `Could not add beach ${newBeach.beachName} to database`;
        }
        let idStr = (insertInfo.insertedId.toString());
        let insertedBeach = Object.assign({_id:''}, newBeach);
        insertedBeach._id = idStr;
        return insertedBeach;
    },

    async getAllBeaches() {
        const beachesCollection = await beaches();
        let beachesList = await beachesCollection.find({}).toArray();
        if (!beachesList) 
        {
          throw 'Could not get all beaches';
        }
        beachesList = beachesList.map((element) => 
        {
          element._id = element._id.toString();
          return element;
        });
        return beachesList.map(formatBeach);
    },

    async getBeachById(id) {
        let idSanatized = generalUtils.checkId(id)
        let id_obj = new ObjectId(idSanatized);
        const beachesCollection = await beaches();
        const currentBeach = await beachesCollection.findOne({_id: id_obj});
        if (currentBeach === null) throw `No beach found with id ${id}`;
        return formatBeach(currentBeach);
    },

    async getBeachesByDistance(centerLon, centerLat, proximityDistance) {
        let distanceQuery = {
            $nearSphere: {
                $geometry: beachUtils.createGeoObject(centerLon, centerLat),
                $minDistance: 0,
                $maxDistance: beachUtils.validateDistance(proximityDistance)
            }
        };
        const beachesCollection = await beaches();
        const currentBeaches = await beachesCollection.find({geoObject: distanceQuery}).toArray();
        return currentBeaches.map(formatBeach);
    },

  async getBeachesByFilter(filters = {}) {
        const beachesCollection = await beaches();
        const query = {};

        if (filters.search && typeof filters.search === 'string' && filters.search.trim().length > 0) {
            const searchRegex = new RegExp(filters.search.trim(), 'i');
            query.$or = [
                { beachName: searchRegex },
                { city: searchRegex },
                { county: searchRegex }
            ];
        }

        if (filters.county && typeof filters.county === 'string' && filters.county.trim().length > 0) {
            query.county = { $regex: new RegExp(filters.county.trim(), 'i') };
        }

        if (filters.city && typeof filters.city === 'string' && filters.city.trim().length > 0) {
            query.city = { $regex: new RegExp(filters.city.trim(), 'i') };
        }

        if (filters.status && typeof filters.status === 'string' && filters.status.trim().length > 0) {
            query.status = filters.status.trim();
        }

        if (filters.waterQuality && typeof filters.waterQuality === 'string' && filters.waterQuality.trim().length > 0) {
            query.waterQuality = { $regex: new RegExp(filters.waterQuality.trim(), 'i') };
        }

        if (filters.minLength !== undefined && filters.minLength !== '' && filters.minLength !== null) {
            const numLength = Number(filters.minLength);
            if (!isNaN(numLength)) {
                query.beachLength = { $gte: numLength };
            }
        }

        if (filters.maxLength !== undefined && filters.maxLength !== '' && filters.maxLength !== null) {
            const numLength = Number(filters.maxLength);
            if (!isNaN(numLength)) {
                query.beachLength = {...query.beachLength, $lte: numLength};
            }
        }

        if (filters.minUserRating !== undefined && filters.minUserRating !== '') {
            query.userRating = {...query.userRating, $gte: Number(filters.minUserRating)};
        }

        if (filters.maxUserRating !== undefined && filters.maxUserRating !== '') {
            query.userRating = {...query.userRating, $lte: Number(filters.maxUserRating)};
        }

        if (filters.minAutoRating !== undefined && filters.minAutoRating !== '') {
            query.autoRating = {...query.autoRating, $gte: Number(filters.minAutoRating)};
        }

        if (filters.maxAutoRating !== undefined && filters.maxAutoRating !== '') {
            query.autoRating = {...query.autoRating, $lte: Number(filters.maxAutoRating)};
        }

        if (filters.proximity && typeof filters.proximity === 'object') {   
            query.geoObject = {
                $nearSphere: {
                    $geometry: {
                        type : "Point",
                        coordinates: [
                            beachUtils.validateCoords(filters.proximity.longitude, 'proximityLongitude'), 
                            beachUtils.validateCoords(filters.proximity.latitude, 'proximityLatitude')
                        ]
                    },
                    $minDistance: 0,
                    $maxDistance: beachUtils.validateDistance(filters.proximity.distance)
                }
            };
        }

        let filteredBeaches = await beachesCollection.find(query).toArray();
        return filteredBeaches.map(formatBeach);
    },

    async getBeachComments(beachId) {
        beachId = generalUtils.checkId(beachId);
        let currentBeach = await this.getBeachById(beachId);
        return currentBeach.BeachComments;
    },

    async getBeachRatings(beachId) {
        beachId = generalUtils.checkId(beachId);
        let currentBeach = await this.getBeachById(beachId);
        return currentBeach.BeachRatings;
    },

    async removeBeach(id) {
        let idSanatized = generalUtils.checkId(id)
        let id_obj = new ObjectId(id);
        const beachesCollection = await beaches();
        const deletionInfo =  await beachesCollection.findOneAndDelete({_id: id_obj});
        if (!deletionInfo) throw `Could not delete beach with id of ${id}`;
        return formatBeach(deletionInfo);   
    },

    async patchBeach(beachId, updateObject) {
        beachId = generalUtils.checkId(beachId);

        if (!updateObject || updateObject === undefined || updateObject === null)
        {
            throw 'updateObject parameter is required';
        }
        if (typeof updateObject !== 'object' || Array.isArray(updateObject))
        {
            throw 'updateObject parameter must be an object';
        }
        if (Object.keys(updateObject).length === 0)
        {
            throw 'updateObject parameter cannot be an empty object';
        }
        if (Object.hasOwn(updateObject, '_id') || Object.hasOwn(updateObject, 'beachId') || Object.hasOwn(updateObject, 'status') || Object.hasOwn(updateObject, 'waterQuality') || Object.hasOwn(updateObject, 'BeachComments'))
        {
            throw 'patchBeach cannot be used to modify _id, beachId, status, waterQuality or BeachComments';
        }

        let patchedBeach = await this.getBeachById(beachId);

        let updateObjectClone = structuredClone(updateObject);
        if (updateObjectClone.hasOwnProperty('beachName'))
        {
            patchedBeach.beachName = beachUtils.validateBeachName(updateObject.beachName);
            delete updateObjectClone.beachName;
        }
        if (updateObjectClone.hasOwnProperty('city'))
        {
            patchedBeach.city = beachUtils.validateBeachCity(updateObject.city);
            delete updateObjectClone.city;
        }
        if (updateObjectClone.hasOwnProperty('county'))
        {
            patchedBeach.county = beachUtils.validateBeachCounty(updateObject.county);
            delete updateObjectClone.county;
        }
        if (updateObjectClone.hasOwnProperty('status'))
        {
            patchedBeach.status = beachUtils.validateBeachStatus(updateObject.status);
            delete updateObjectClone.status;
        }
        if (updateObjectClone.hasOwnProperty('beachLength'))
        {
            patchedBeach.beachLength = beachUtils.validateBeachLength(updateObject.beachLength);
            delete updateObjectClone.beachLength;
        }
        if (updateObjectClone.hasOwnProperty('upperLat'))
        {
            patchedBeach.upperLat = beachUtils.validateCoords(updateObject.upperLat, 'upperLat');
            delete updateObjectClone.upperLat;
        }
        if (updateObjectClone.hasOwnProperty('lowerLat'))
        {
            patchedBeach.lowerLat = beachUtils.validateCoords(updateObject.lowerLat, 'lowerLat');
            delete updateObjectClone.lowerLat;
        }
        if (updateObjectClone.hasOwnProperty('upperLon'))
        {
            patchedBeach.upperLon = beachUtils.validateCoords(updateObject.upperLon, 'upperLon');
            delete updateObjectClone.upperLon;
        }
        if (updateObjectClone.hasOwnProperty('lowerLon'))
        {
            patchedBeach.lowerLon = beachUtils.validateCoords(updateObject.lowerLon, 'lowerLon');
            delete updateObjectClone.lowerLon;
        }

        if(Object.keys(updateObjectClone).length !== 0)
        {
            throw 'updateObject contains unexpected additional attributes: only should have beachName, city, county, status, beachLength, upperLat, lowerLat, upperLon, and lowerLon';
        }

        delete patchedBeach._id;
        let id_obj = new ObjectId(beachId);
        const beachesCollection = await beaches();
        const patchedBeachInfo = await beachesCollection.findOneAndUpdate(
        {_id: id_obj},
        {$set: patchedBeach},
        {returnDocument: 'after'}
        );
        if (!patchedBeachInfo) throw 'Could not patch beach successfully';
        return formatBeach(patchedBeachInfo);
  },

    async addBeachComment(beachId, commenterId, commentStr) {
        beachId = generalUtils.checkId(beachId);
        commenterId = generalUtils.checkId(commenterId);

        let currentBeach = await this.getBeachById(beachId);
        let currentCommenter = await users.getUserById(commenterId);

        let commentObject = generalUtils.createCommentObject(currentCommenter._id, currentCommenter.firstName, currentCommenter.lastName, commentStr);

        let currentBeachComments = currentBeach.BeachComments;
        currentBeachComments.push(commentObject);
        
        let id_obj = new ObjectId(beachId);
        const beachCollection = await beaches();
        const updatedBeachInfo =  await beachCollection.findOneAndUpdate(
            {_id: id_obj},
            {$set: {'BeachComments': currentBeachComments}},
            {returnDocument: 'after'}
            );
        if (!updatedBeachInfo) throw `Could not add comment: ${commentObject} to beach: ${beachId}`;
        return formatBeach(updatedBeachInfo);
    },

    async removeBeachComment(beachId, commentId) {
        beachId = generalUtils.checkId(beachId);
        commentId = generalUtils.checkId(commentId);

        let currentBeach = await this.getBeachById(beachId);
    
        let currentBeachComments = currentBeach.BeachComments;
        let targetCommentIndex = currentBeachComments.findIndex((comment) => comment._id.toString() === commentId);

        if (targetCommentIndex === -1)
        {
            throw `Could not find comment: ${commentId} for beach: ${beachId}`;
        }
        else
        {
            currentBeachComments.splice(targetCommentIndex, 1);
        }

        let id_obj = new ObjectId(beachId);
        const beachCollection = await beaches();
        const updatedBeachInfo =  await beachCollection.findOneAndUpdate(
            {_id: id_obj},
            {$set: {'BeachComments': currentBeachComments}},
            {returnDocument: 'after'}
            );
        if (!updatedBeachInfo) throw `Could not remove comment: ${commentId} from beach: ${beachId}`;
        return formatBeach(updatedBeachInfo);
    },
    
    async addBeachRating(beachId, raterId, ratingStr) {
        beachId = generalUtils.checkId(beachId);
        raterId = generalUtils.checkId(raterId);

        let currentBeach = await this.getBeachById(beachId);
        let currentRater = await users.getUserById(raterId);

        let ratingObject = beachUtils.createRatingObject(currentRater._id, currentRater.firstName, currentRater.lastName, ratingStr);

        let currentBeachRatings = currentBeach.BeachRatings;

        let ratingExists = currentBeachRatings.findIndex((rating) => rating.raterId.toString() === raterId);

        if (ratingExists === -1)
        {
            currentBeachRatings.push(ratingObject);
        }
        else
        {
            throw `Rating from rater: ${raterId} already exists for beach: ${beachId}`;
        }
        
        let newUserRating = (currentBeachRatings.reduce((r, {rating}) => r + rating, 0)) / currentBeachRatings.length;

        let id_obj = new ObjectId(beachId);
        const beachCollection = await beaches();
        const updatedBeachInfo = await beachCollection.findOneAndUpdate(
            {_id: id_obj},
            {$set: {'userRating': newUserRating, 'BeachRatings': currentBeachRatings}},
            {returnDocument: 'after'}
            );
        if (!updatedBeachInfo) throw `Could not add rating: ${ratingObject} to beach: ${beachId}`;
        return formatBeach(updatedBeachInfo);
    },

    async removeBeachRating(beachId, raterId) {
        beachId = generalUtils.checkId(beachId);
        raterId = generalUtils.checkId(raterId);

        let currentBeach = await this.getBeachById(beachId);

        let currentBeachRatings = currentBeach.BeachRatings;
        let targetRatingIndex = currentBeachRatings.findIndex((rating) => rating.raterId.toString() === raterId);

        if (targetRatingIndex === -1)
        {
            throw `Could not find rating from rater: ${raterId} for beach: ${beachId}`;
        }
        else
        {
            currentBeachRatings.splice(targetRatingIndex, 1);
        }

        let newUserRating = (currentBeachRatings.reduce((r, {rating}) => r + rating, 0)) / currentBeachRatings.length;

        let id_obj = new ObjectId(beachId);
        const beachCollection = await beaches();
        const updatedBeachInfo = await beachCollection.findOneAndUpdate(
            {_id: id_obj},
            {$set: {'userRating': newUserRating, 'BeachRatings': currentBeachRatings}},
            {returnDocument: 'after'}
            );
        if (!updatedBeachInfo) throw `Could not remove rating from rater: ${raterId} for beach: ${beachId}`;
        return formatBeach(updatedBeachInfo);
    },
    
    async patchBeachRating(beachId, raterId, ratingStr) {
        beachId = generalUtils.checkId(beachId);
        raterId = generalUtils.checkId(raterId);

        let currentBeach = await this.getBeachById(beachId);

        let currentBeachRatings = currentBeach.BeachRatings;
        let targetRatingIndex = currentBeachRatings.findIndex((rating) => rating.raterId.toString() === raterId);
        if (targetRatingIndex === -1)
        {
            throw `Could not find rating from rater: ${raterId} for beach: ${beachId}`;
        }
        else
        {
            let newRating = beachUtils.validateRating(ratingStr);
            currentBeachRatings[targetRatingIndex].rating = newRating;
        }

        let newUserRating = (currentBeachRatings.reduce((r, {rating}) => r + rating, 0)) / currentBeachRatings.length;

        let id_obj = new ObjectId(beachId);
        const beachCollection = await beaches();
        const updatedBeachInfo = await beachCollection.findOneAndUpdate(
            {_id: id_obj},
            {$set: {'userRating': newUserRating, 'BeachRatings': currentBeachRatings}},
            {returnDocument: 'after'}
            );
        if (!updatedBeachInfo) throw `Could not update rating from rater: ${raterId} for beach: ${beachId}`;
        return formatBeach(updatedBeachInfo);
    }
}

export default exportedMethods;