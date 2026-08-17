import generalUtils from '../utils/general_utils.js'
import advisoryUtils from '../utils/advisory_utils.js'
import beaches from './beaches.js'
import {advisories} from '../config/MongoCollections.js'
import {ObjectId} from 'mongodb';
const formatAdvisory = (advisory) => ({ ...advisory, _id: advisory._id.toString() });

let exportedMethods = {
    async createAdvisory(advisoryId, beachId, advisoryType, advisoryCause, advisoryDuration, advisoryStartDate, advisoryStartTime, advisoryEndDate, advisoryEndTime) {
        let advisoryIdSanatized = generalUtils.validateDatasetId(advisoryId);
        let beachIdSanatized = generalUtils.validateDatasetId(beachId);
        let advisoryTypeSanatized = advisoryUtils.validateAdvisoryType(advisoryType);
        let advisoryCauseSanatized = advisoryUtils.validateAdvisoryCause(advisoryCause);
        let advisoryDurationSanatized = advisoryUtils.validateAdvisoryDuration(advisoryDuration);
        let advisoryStartDateSanatized = advisoryUtils.validateAdvisoryStartDate(advisoryStartDate);
        let advisoryStartTimeSanatized = advisoryUtils.validateAdvisoryStartTime(advisoryStartTime);
        let advisoryEndDateSanatized = advisoryUtils.validateAdvisoryEndDate(advisoryEndDate);
        let advisoryEndTimeSanatized = advisoryUtils.validateAdvisoryEndTime(advisoryEndTime);

        let newAdvisory = {
            advisoryId: advisoryIdSanatized,
            beachId: beachIdSanatized,
            advisoryType: advisoryTypeSanatized,
            advisoryCause: advisoryCauseSanatized,
            advisoryDuration: advisoryDurationSanatized,
            advisoryStartDate: advisoryStartDateSanatized,
            advisoryStartTime: advisoryStartTimeSanatized,
            advisoryEndDate: advisoryEndDateSanatized,
            advisoryEndTime: advisoryEndTimeSanatized
        };
        
        const advisoriesCollection = await advisories();
        const insertInfo = await advisoriesCollection.insertOne(newAdvisory);
        if (!insertInfo.acknowledged || !insertInfo.insertedId)
        {
            throw 'Could not add advisory';
        }

        let idStr = (insertInfo.insertedId.toString());
        let insertedAdvisory = Object.assign({_id:''}, newAdvisory);
        insertedAdvisory._id = idStr;
        
        return insertedAdvisory;
    },

    async getAllAdvisories() {
        const advisoriesCollection = await advisories();
        let advisoriesList = await advisoriesCollection.find({}).toArray();
        return advisoriesList.map(formatAdvisory);
    },

    async getAdvisoryById(id) {
        let idSanatized = generalUtils.checkId(id);
        let id_obj = new ObjectId(idSanatized);
        const advisoriesCollection = await advisories();
        const currentAdvisory = await advisoriesCollection.findOne({_id: id_obj});
        if (currentAdvisory === null) throw 'No advisory found with that id';
        return formatAdvisory(currentAdvisory);
    },

    async getAdvisoriesByBeachId(beachId) {
        let idSanatized = generalUtils.checkId(beachId);
        let currentBeach = await beaches.getBeachById(beachId);
        let currentBeachDatasetId = currentBeach.beachId;

        let id_obj = new ObjectId(idSanatized);
        const advisoriesCollection = await advisories();
        let advisoriesList = await advisoriesCollection.find({'beachId': currentBeachDatasetId}).toArray();
        return advisoriesList.map(formatAdvisory);
    },

    async getActiveAdvisoriesByBeachId(beachId) {
        let currentBeachAdvisories = await this.getAdvisoriesByBeachId(beachId)
        return currentBeachAdvisories.filter((advisory) => advisoryUtils.isActiveAdvisory(advisory));
    },

    async removeAdvisory(id) {
        let idSanatized = generalUtils.checkId(id)

        let id_obj = new ObjectId(idSanatized);
        const advisoriesCollection = await advisories();
        const deletionInfo =  await advisoriesCollection.findOneAndDelete({_id: id_obj});
        if (!deletionInfo) throw `Could not delete advisory with id of ${id}`;
        return formatAdvisory(deletionInfo);
    },

    async patchAdvisory(advisoryId, updateObject) {
        advisoryId = generalUtils.checkId(advisoryId);

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
        if (Object.hasOwn(updateObject, '_id') || Object.hasOwn(updateObject, 'advisoryId') || Object.hasOwn(updateObject, 'beachId'))
        {
            throw 'patchAdvisory cannot be used to modify _id, advisoryId, or beachId';
        }

        let patchedAdvisory = await this.getAdvisoryById(advisoryId);

        let updateObjectClone = structuredClone(updateObject);
        if (updateObjectClone.hasOwnProperty('advisoryType'))
        {
            patchedAdvisory.advisoryType = advisoryUtils.validateAdvisoryType(updateObject.advisoryType);
            delete updateObjectClone.advisoryType;
        }
        if (updateObjectClone.hasOwnProperty('advisoryCause'))
        {
            patchedAdvisory.advisoryCause = advisoryUtils.validateAdvisoryCause(updateObject.advisoryCause);
            delete updateObjectClone.advisoryCause;
        }
        if (updateObjectClone.hasOwnProperty('advisoryDuration'))
        {
            patchedAdvisory.advisoryDuration = advisoryUtils.validateAdvisoryDuration(updateObject.advisoryDuration);
            delete updateObjectClone.advisoryDuration;
        }
        if (updateObjectClone.hasOwnProperty('advisoryStartDate'))
        {
            patchedAdvisory.advisoryStartDate = advisoryUtils.validateAdvisoryStartDate(updateObject.advisoryStartDate);
            delete updateObjectClone.advisoryStartDate;
        }
        if (updateObjectClone.hasOwnProperty('advisoryStartTime'))
        {
            patchedAdvisory.advisoryStartTime = advisoryUtils.validateAdvisoryStartTime(updateObject.advisoryStartTime);
            delete updateObjectClone.advisoryStartTime;
        }
        if (updateObjectClone.hasOwnProperty('advisoryEndDate'))
        {
            patchedAdvisory.advisoryEndDate = advisoryUtils.validateAdvisoryEndDate(updateObject.advisoryEndDate);
            delete updateObjectClone.advisoryEndDate;
        }
        if (updateObjectClone.hasOwnProperty('advisoryEndTime'))
        {
            patchedAdvisory.advisoryEndTime = advisoryUtils.validateAdvisoryEndTime(updateObject.advisoryEndTime);
            delete updateObjectClone.advisoryEndTime;
        }

        if(Object.keys(updateObjectClone).length !== 0)
        {
            throw 'updateObject contains unexpected additional attributes: only should have advisoryType, advisoryCause, advisoryDuration, advisoryStartDate, advisoryStartTime, advisoryEndDate, and advisoryEndTime';
        }

        delete patchedAdvisory._id;
        let id_obj = new ObjectId(advisoryId);
        const advisoriesCollection = await advisories();
        const patchedAdvisoryInfo = await advisoriesCollection.findOneAndUpdate(
        {_id: id_obj},
        {$set: patchedAdvisory},
        {returnDocument: 'after'});

        if (!patchedAdvisoryInfo)
        {
            throw 'Could not patch advisory successfully';
        }

        return formatAdvisory(patchedAdvisoryInfo);
  }
}

export default exportedMethods;