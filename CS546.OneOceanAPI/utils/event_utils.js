import mongodb from 'mongodb';
import moment from 'moment';
import {events} from '../config/MongoCollections.js'

let exportedMethods = {
    validateEventName (eventName) {
        if (!eventName || eventName === undefined || eventName === null)
        {
            throw 'eventName parameter is required';
        }
        if (typeof eventName !== 'string')
        {
            throw 'eventName parameter must be a string';
        }
        let eventNameSanatized = eventName.trim();
        if (eventNameSanatized.length < 5 || eventNameSanatized.length > 80)
        {
            throw 'eventName parameter must be a string between 5-80 characters long';
        }
        if (!/^[A-Za-z-,' ]+$/.test(eventNameSanatized))
        {
            throw 'eventName parameter can only contain letters, hypens, commas, apostrophes, and spaces';
        }

        return eventNameSanatized;
    },
    validateEventType(eventType) {
        let eventTypes = ['Meet up', 'Beach Cleanup', 'Pinic', 'Barbeque', 'Contest',
            'Fishing', 'Swimming', 'Volleyball', 'Frisbee', 'Football', 'Other']

        if (!eventType|| typeof eventType !== 'string')
        {
            throw 'eventType parameter must be provided and must be a string';
        }
        let eventTypeSanatized = eventType.trim();
        if (eventTypeSanatized.length === 0)
        {
            throw 'eventType cannot be empty';
        }
        eventTypeSanatized = eventTypeSanatized.charAt(0).toUpperCase() + eventTypeSanatized.slice(1);
        if (!eventTypes.includes(eventTypeSanatized))
        {
            throw `eventType must be one of the predefined types: ${eventTypes}`;
        }
        return eventTypeSanatized
    },
    validateEventDate(eventDate) {
        if (!eventDate || typeof eventDate !== 'string')
        {
            throw 'eventDate must be a string';
        }
        let eventDateSanatized = eventDate.trim();
        if (eventDateSanatized.length !== 10)
        {
            throw 'eventDate cannot be an empty string and must be in MM/DD/YYYY format';
        }
        if (!/^[0-9/]+$/.test(eventDateSanatized))
        {
            throw 'eventDate can only contain whole numbers and forward slashes';
        }
        if(!(moment(eventDateSanatized, "MM/DD/YYYY").isValid()))
        {
            throw 'eventDate is not a valid date';
        }
        return eventDateSanatized;
    },
    validateStartTime(startTime) {
        if (!startTime || typeof startTime !== 'string')
        {
            throw 'startTime must be a string';
        }
        let startTimeSanatized = startTime.trim();
        if (startTimeSanatized.length < 6)
        {
            throw 'startTime cannot be an empty string and must be in H:MM(AM/PM) or HH:MM(AM/PM) format';
        }
        if (!/^(1[0-2]|0?[1-9]):[0-5][0-9](AM|PM)$/.test(startTimeSanatized) || !(moment(startTimeSanatized, "hh:mma").isValid()))
        {
            throw 'startTime is not a valid time and must be in H:MM(AM/PM) or HH:MM(AM/PM) format';
        }
        return startTimeSanatized;
    },
    validateEndTime(endTime, startTime) {
        if (!endTime || typeof endTime !== 'string')
        {
            throw 'endTime must be a string';
        }
        let endTimeSanatized = endTime.trim();
        if (endTimeSanatized.length < 6)
        {
            throw 'endTime cannot be an empty string and must be in H:MM(AM/PM) or HH:MM(AM/PM) format';
        }
        if (!/^(1[0-2]|0?[1-9]):[0-5][0-9](AM|PM)$/.test(endTimeSanatized) || !(moment(endTimeSanatized, "hh:mma").isValid()))
        {
            throw 'endTime is not a valid time and must be in H:MM(AM/PM) or HH:MM(AM/PM) format';
        }
        if(!(moment(endTimeSanatized, "hh:mma") > moment(startTime, "hh:mma")))
        {
            throw 'endTime must be after the given startTime';
        }
        return endTimeSanatized;
    },
    validateMeetingLocation(meetingLocation) {
         if (!meetingLocation || typeof meetingLocation !== 'string')
        {
            throw 'meetingLocation parameter must be provided and must be a string';
        }
        let meetingLocationSanatized = meetingLocation.trim();
        if (meetingLocation.length < 5 || meetingLocation.length > 100)
        {
            throw 'meetingLocation parameter must be a string between 2-50 characters long';
        }
        if (!/^[A-Za-z-'. ]+$/.test(meetingLocationSanatized))
        {
            throw 'meetingLocation parameter can only contain letters, hypens, apostrophes, periods, and spaces';
        }
        return meetingLocationSanatized;
    },
    validateAdditionalDetails(additionalDetails) {
         if (!additionalDetails || typeof additionalDetails !== 'string')
        {
            throw 'additionalDetails parameter must be provided and must be a string';
        }
        let additionalDetailsSanatized = additionalDetails.trim();
        return additionalDetailsSanatized;
    }
};

export default exportedMethods;