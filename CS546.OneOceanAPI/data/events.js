import mongodb from 'mongodb';
import generalUtils from '../utils/general_utils.js'
import eventUtils from '../utils/event_utils.js'
import users from './users.js'
import {events} from '../config/MongoCollections.js'
import {ObjectId} from 'mongodb';


let exportedMethods = {
    async createEvent(
        hostId, 
        beachId,
        eventName,
        eventType, 
        eventDate, 
        startTime, 
        endTime, 
        meetingLocation, 
        additionalDetails) {
        let hostIdSanatized = generalUtils.checkId(hostId);
        let beachIdSanatized = generalUtils.checkId(beachId)
        let eventNameSanatized = eventUtils.validateEventName(eventName);
        let eventTypeSanatized = eventUtils.validateEventType(eventType);
        let eventDateSanatized = eventUtils.validateEventDate(eventDate);
        let startTimeSanatized = eventUtils.validateStartTime(startTime);
        let endTimeSanatized = eventUtils.validateEndTime(endTime, startTimeSanatized);
        let meetingLocationSanatized = eventUtils.validateMeetingLocation(meetingLocation);
        let additionalDetailsSanatized = eventUtils.validateAdditionalDetails(additionalDetails);

        let newEvent = {
            hostId: hostIdSanatized,
            beachId: beachIdSanatized,
            eventName: eventNameSanatized,
            eventType: eventTypeSanatized,
            eventDate: eventDateSanatized,
            startTime: startTimeSanatized,
            endTime: endTimeSanatized,
            meetingLocation: meetingLocationSanatized,
            additionalDetails: additionalDetailsSanatized,
            attendants: [],
            EventComments: [],
        };
        
        const eventsCollection = await events();
        const insertInfo = await eventsCollection.insertOne(newEvent);
        if (!insertInfo.acknowledged || !insertInfo.insertedId)
        {
            throw 'Could not add event';
        }

        let idStr = (insertInfo.insertedId.toString());
        let insertedEvent = Object.assign({_id:''}, newEvent);
        insertedEvent._id = idStr;

        return insertedEvent;
    },

    async getAllEvents() {
        const eventsCollection = await events();
        let eventsList = await eventsCollection.find({}).toArray();
        if (!eventsList) 
        {
          throw 'Could not get all events';
        }
        eventsList = eventsList.map((element) => 
        {
          element._id = element._id.toString();
          return element;
        });
        return eventsList;
    },

    async getEventById(id) {
        let idSanatized = generalUtils.checkId(id)
        let id_obj = new ObjectId(idSanatized);
        const eventsCollection = await events();
        const currentEvent = await eventsCollection.findOne({_id: id_obj});
        if (currentEvent === null)
        {
            throw 'No event found with that id';
        } 
        currentEvent._id = currentEvent._id.toString();
        return currentEvent;
    },

    async removeEvent(id) {
        let idSanatized = generalUtils.checkId(id)
        let id_obj = new ObjectId(idSanatized);
        const eventsCollection = await events();
        const deletionInfo =  await eventsCollection.findOneAndDelete({_id: id_obj});

        if (!deletionInfo) 
        {
        throw `Could not delete event with id of ${id}`;
        }
        return deletionInfo;   
    },

    async patchEvent(eventId, updateObject) {
        eventId = generalUtils.checkId(eventId);

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
        if (Object.hasOwn(updateObject, '_id') || Object.hasOwn(updateObject, 'attendants') || Object.hasOwn(updateObject, 'EventComments'))
        {
            throw 'patchEvent cannot be used to modify _id, attendants, or EventComments';
        }

        let patchedEvent = await this.getEventById(eventId);

        let updateObjectClone = structuredClone(updateObject);
        if (updateObjectClone.hasOwnProperty('hostId'))
        {
            patchedEvent.hostId = generalUtils.checkId(updateObject.hostId);
            delete updateObjectClone.hostId;
        }
        if (updateObjectClone.hasOwnProperty('beachId'))
        {
            patchedEvent.beachId = generalUtils.checkId(updateObject.beachId);
            delete updateObjectClone.beachId;
        }
        if (updateObjectClone.hasOwnProperty('eventName'))
        {
            patchedEvent.eventName = eventUtils.validateEventName(updateObject.eventName);
            delete updateObjectClone.eventName;
        }
        if (updateObjectClone.hasOwnProperty('eventType'))
        {
            patchedEvent.eventType = eventUtils.validateEventType(updateObject.eventType);
            delete updateObjectClone.eventType;
        }
        if (updateObjectClone.hasOwnProperty('eventDate'))
        {
            patchedEvent.eventDate = eventUtils.validateEventDate(updateObject.eventDate);
            delete updateObjectClone.eventDate;
        }
        if (updateObjectClone.hasOwnProperty('startTime'))
        {
            patchedEvent.startTime = eventUtils.validateStartTime(updateObject.startTime);
            delete updateObjectClone.startTime;
        }
        if (updateObjectClone.hasOwnProperty('endTime'))
        {
            patchedEvent.endTime = eventUtils.validateEndTime(updateObject.endTime, patchedEvent.startTime);
            delete updateObjectClone.endTime;
        }
        if (updateObjectClone.hasOwnProperty('meetingLocation'))
        {
            patchedEvent.meetingLocation = eventUtils.validateMeetingLocation(updateObject.meetingLocation);
            delete updateObjectClone.meetingLocation;
        }
        if (updateObjectClone.hasOwnProperty('additionalDetails'))
        {
            patchedEvent.additionalDetails = eventUtils.validateAdditionalDetails(updateObject.additionalDetails);
            delete updateObjectClone.additionalDetails;
        }

        if(Object.keys(updateObjectClone).length !== 0)
        {
            throw 'updateObject contains unexpected additional attributes: only should have hostId, eventName, eventType, eventDate, startTime, endTime, meetingLocation, and additionalDetails';
        }

        delete patchedEvent._id;
        let id_obj = new ObjectId(eventId);
        const eventsCollection = await events();
        const patchedEventInfo = await eventsCollection.findOneAndUpdate(
        {_id: id_obj},
        {$set: patchedEvent},
        {returnDocument: 'after'});

        if (!patchedEventInfo)
        {
            throw 'Could not patch event successfully';
        }

        patchedEventInfo._id = patchedEventInfo._id.toString();
        return patchedEventInfo;
  },

  async addEventAttendant(eventId, userId) {
        userId = generalUtils.checkId(userId);
        eventId = generalUtils.checkId(eventId);

        let currentUser = await users.getUserById(userId);
        let currentEvent = await this.getEventById(eventId);

        let currentAttendants = currentEvent.attendants
        if (currentAttendants.includes(userId))
        {
            throw `Attendant: ${userId} already exists for event: ${eventId}`;
        }
        else
        {
            currentAttendants.push(userId);
        }
        
        let id_obj = new ObjectId(eventId);
        const eventsCollection = await events();
        const updatedEventInfo =  await eventsCollection.updateOne(
            {_id: id_obj},
            {$set: {'attendants': currentAttendants}},
            {returnDocument: 'after'}
            );

        if (!updatedEventInfo)
        {
            throw `Could not add attendant: ${userId} to event: ${eventId}`;
        }

        let updatedEvent = await this.getEventById(eventId);
        return updatedEvent;
    },

    async removeEventAttendant(eventId, userId) {
        eventId = generalUtils.checkId(eventId);
        userId = generalUtils.checkId(userId);

        let currentEvent = await this.getEventById(eventId);
        let currentUser = await users.getUserById(userId);

        let currentAttendants = currentEvent.attendants
        let targetAttendantIndex = currentAttendants.indexOf(userId);
        if (targetAttendantIndex === -1)
        {
            throw `Could not find attendant: ${userId} for event: ${eventId}`;
        }
        else
        {
            currentAttendants.splice(targetAttendantIndex, 1);
        }

        let id_obj = new ObjectId(eventId);
        const eventsCollection = await events();
        const updatedEventInfo =  await eventsCollection.updateOne(
            {_id: id_obj},
            {$set: {'attendants': currentAttendants}},
            {returnDocument: 'after'}
            );

        if (!updatedEventInfo)
        {
            throw `Could not remove attendant: ${userId} from event: ${eventId}`;
        }

        let updatedEvent = await this.getEventById(eventId);
        return updatedEvent;
    },

    async addEventComment(eventId, commenterId, commentStr) {
        eventId = generalUtils.checkId(eventId);
        commenterId = generalUtils.checkId(commenterId);

        let currentEvent = await this.getEventById(eventId);
        let currentCommenter = await users.getUserById(commenterId);

        let commentObject = generalUtils.createCommentObject(currentCommenter.firstName, currentCommenter.lastName, commentStr);

        let currentEventComments = currentEvent.EventComments;
        currentEventComments.push(commentObject);
        
        
        let id_obj = new ObjectId(eventId);
        const eventsCollection = await events();
        const updatedEventInfo =  await eventsCollection.updateOne(
            {_id: id_obj},
            {$set: {'EventComments': currentEventComments}},
            {returnDocument: 'after'}
            );

        if (!updatedEventInfo)
        {
            throw `Could not add comment: ${commentObject} to event: ${eventId}`;
        }

        let updatedEvent = await this.getEventById(eventId);
        return updatedEvent;
    },

    async removeEventComment(eventId, commentId) {
        eventId = generalUtils.checkId(eventId);
        commentId = generalUtils.checkId(commentId);

        let currentEvent = await this.getEventById(eventId);
    
        let currentEventComments = currentEvent.EventComments;
        let targetCommentIndex = currentEventComments.findIndex((comment) => comment._id.toString() === commentId);

        if (targetCommentIndex === -1)
        {
            throw `Could not find comment: ${commentId} for event: ${eventId}`;
        }
        else
        {
            currentEventComments.splice(targetCommentIndex, 1);
        }

        let id_obj = new ObjectId(eventId);
        const eventsCollection = await events();
        const updatedEventInfo =  await eventsCollection.updateOne(
            {_id: id_obj},
            {$set: {'EventComments': currentEventComments}},
            {returnDocument: 'after'}
            );

        if (!updatedEventInfo)
        {
            throw `Could not remove comment: ${commentId} from event: ${eventId}`;
        }

        let updatedEvent = await this.getEventById(eventId);
        return updatedEvent;
    }
}

export default exportedMethods;

//console.log(await exportedMethods.createEvent('6a601e3627cd3e4570dc1895','6a601138399db0547bec6a95','Daniels First Event', 'Volleyball','07/23/2026', '12:00PM', '3:00PM', 'Parking Lot', 'this is a test'));

//console.log(await exportedMethods.addEventAttendant('6a61bad8c9d123831ef8312e', '6a601e3627cd3e4570dc1895'))

//console.log(await exportedMethods.addEventComment('6a61bad8c9d123831ef8312e', '6a601e3627cd3e4570dc1895', 'This code sucks!'));

//console.log(await exportedMethods.removeEventComment('6a61bad8c9d123831ef8312e', '6a61bd54d841964151d07187'));

