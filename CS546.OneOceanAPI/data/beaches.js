import generalUtils from '../utils/general_utils.js'
import beachUtils from '../utils/beach_utils.js'
import users from './users.js'
import {beaches} from '../config/MongoCollections.js'
import {ObjectId} from 'mongodb';


let exportedMethods = {
    async createBeach(beachId, beachName, city, county, status, beachLength, upperLat, lowerLat, upperLon, lowerLon) {
        let beachIdSanatized = beachUtils.validateBeachId(beachId);
        let beachNameSanatized = beachUtils.validateBeachName(beachName);
        let citySanatized = beachUtils.validateBeachCity(city);
        let countySanatized = beachUtils.validateBeachCounty(county);
        let statusSanatized = beachUtils.validateBeachStatus(status);
        let beachLengthSanatized = beachUtils.validateBeachLength(beachLength);
        let upperLatSanatized = beachUtils.validateCoords(upperLat, 'upperLat');
        let lowerLatSanatized = beachUtils.validateCoords(lowerLat, 'lowerLat');
        let upperLonSanatized = beachUtils.validateCoords(upperLon, 'upperLon');
        let lowerLonSanatized = beachUtils.validateCoords(lowerLon, 'lowerLon');

        let newBeach = {
            beachId: beachIdSanatized,
            beachLength: beachLengthSanatized,
            beachName: beachNameSanatized,
            city: citySanatized,
            county: countySanatized,
            upperLat: upperLatSanatized,
            lowerLat: lowerLatSanatized,
            status: statusSanatized,
            upperLon: upperLonSanatized,
            lowerLon: lowerLonSanatized,
            waterQuality: null,
            BeachComments: []
        };
        
        const beachesCollection = await beaches();
        const insertInfo = await beachesCollection.insertOne(newBeach);
        if (!insertInfo.acknowledged || !insertInfo.insertedId)
        {
            throw 'Could not add beach';
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
        return beachesList;
    },

    async getBeachById(id) {
        let idSanatized = generalUtils.checkId(id)
        let id_obj = new ObjectId(idSanatized);
        const beachesCollection = await beaches();
        const currentBeach = await beachesCollection.findOne({_id: id_obj});
        if (currentBeach === null)
        {
            throw 'No beach found with that id';
        } 
    
        currentBeach._id = currentBeach._id.toString();
        return currentBeach;
    },

    async removeBeach(id) {
        let idSanatized = generalUtils.checkId(id)

        let id_obj = new ObjectId(id);
        const beachesCollection = await beaches();
        const deletionInfo =  await beachesCollection.findOneAndDelete({_id: id_obj});

        if (!deletionInfo) 
        {
        throw `Could not delete beach with id of ${id}`;
        }
        return deletionInfo;   
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
        {returnDocument: 'after'});

        if (!patchedBeachInfo)
        {
            throw 'Could not patch beach successfully';
        }

        patchedBeachInfo._id = patchedBeachInfo._id.toString();
        return patchedBeachInfo;
  },

  async addBeachComment(beachId, commenterId, commentStr) {
        beachId = generalUtils.checkId(beachId);
        commenterId = generalUtils.checkId(commenterId);

        let currentBeach = await this.getBeachById(beachId);
        let currentCommenter = await users.getUserById(commenterId);

        let commentObject = generalUtils.createCommentObject(currentCommenter.firstName, currentCommenter.lastName, commentStr);

        let currentBeachComments = currentBeach.BeachComments;
        currentBeachComments.push(commentObject);
        
        
        let id_obj = new ObjectId(beachId);
        const beachCollection = await beaches();
        const updatedBeachInfo =  await beachCollection.updateOne(
            {_id: id_obj},
            {$set: {'BeachComments': currentBeachComments}},
            {returnDocument: 'after'}
            );

        if (!updatedBeachInfo)
        {
            throw `Could not add comment: ${commentObject} to beach: ${beachId}`;
        }

        let updatedBeach = await this.getBeachById(beachId);
        return updatedBeach;
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
        const updatedBeachInfo =  await beachCollection.updateOne(
            {_id: id_obj},
            {$set: {'BeachComments': currentBeachComments}},
            {returnDocument: 'after'}
            );

        if (!updatedBeachInfo)
        {
            throw `Could not remove comment: ${commentId} from beach: ${beachId}`;
        }

        let updatedBeach = await this.getBeachById(beachId);
        return updatedBeach;
    }
}

export default exportedMethods;

//console.log(await exportedMethods.addBeachComment('6a601138399db0547bec6a95', '6a601e3627cd3e4570dc1895', 'Wow this beach was great!'));

//console.log(await exportedMethods.removeBeachComment('6a601138399db0547bec6a95', '6a61be4be0737fbfa9f6df17'));
