import mongodb from 'mongodb';
import {beaches} from '../config/MongoCollections.js'

let exportedMethods = {
    validateBeachName (beachName) {
        if (!beachName || beachName === undefined || beachName === null)
        {
            throw 'beachName parameter is required';
        }
        if (typeof beachName !== 'string')
        {
            throw 'beachName parameter must be a string';
        }
        let beachNameSanatized = beachName.trim();
        if (beachNameSanatized.length < 5 || beachNameSanatized.length > 80)
        {
            throw 'beachName parameter must be a string between 5-80 characters long';
        }
        if (!/^[A-Za-z-, ]+$/.test(beachNameSanatized))
        {
            throw 'beachName parameter can only contain letters, hypens, commas, and spaces';
        }

        return beachNameSanatized;
    },
    validateBeachId(beachId) {
        let beachIdSanatized;
        if (!beachId)
        {
            throw 'beachId must be provided';
        }
        if (typeof beachId !== 'number')
        {
            if (typeof beachId === 'string')
            {
                beachIdSanatized = +(beachId.trim());
                if (Number.isNaN(beachIdSanatized))
                {
                    throw 'if beachId is a string it must be in number form';
                }
            }
            else
            {
                throw 'beachId must be a number or string in number form';
            }
        }
        else 
        {
            beachIdSanatized = beachId;
        }
        if (beachIdSanatized <= 0)
        {
            throw 'beachId must be a number greater than 0';
        }
        return beachIdSanatized;
    },
    validateBeachLength(beachLength) {
        let beachLengthSanatized;
        if (!beachLength)
        {
            throw `beachLength must be provided`;
        }
        if (typeof beachLength !== 'number')
        {
            if (typeof beachLength === 'string')
            {
                beachLengthSanatized = +(beachLength.trim());
                if (Number.isNaN(beachLengthSanatized))
                {
                    throw `if beachLength is a string it must be in number form`;
                }
            }
            else
            {
                throw `beachLength must be a number or string in number form`;
            }
        }
        else 
        {
            beachLengthSanatized = beachLength;
        }
        if (beachLengthSanatized <= 0)
        {
            throw 'beachLength must be a number greater than 0';
        }
        return beachLengthSanatized;
    },
     validateCoords(coordinate, fieldName) {
        let coordinateSanatized;
        if (!coordinate)
        {
            throw `${fieldName} must be provided`;
        }
        if (typeof coordinate !== 'number')
        {
            if (typeof coordinate === 'string')
            {
                coordinateSanatized = +(coordinate.trim());
                if (Number.isNaN(coordinateSanatized))
                {
                    throw `if ${fieldName} is a string it must be in number form`;
                }
            }
            else
            {
                throw `${fieldName} must be a number or string in number form`;
            }
        }
        else 
        {
            coordinateSanatized = coordinate;
        }
        return coordinateSanatized;
    },
    validateBeachCity(beachCity) {
        if (!beachCity || typeof beachCity !== 'string')
        {
            throw 'beachCity parameter must be provided and must be a string';
        }
        let beachCitySanatized = beachCity.trim();
        if (beachCitySanatized.length < 2 || beachCitySanatized.length > 50)
        {
            throw 'beachCity parameter must be a string between 2-50 characters long';
        }
        if (!/^[A-Za-z-' ]+$/.test(beachCitySanatized))
        {
            throw 'beachCity parameter can only contain letters, hypens, apostrophes, and spaces';
        }
        return beachCitySanatized;
    },
    validateBeachCounty(beachCounty) {
        if (!beachCounty || typeof beachCounty !== 'string')
        {
            throw 'beachCounty parameter must be provided and must be a string';
        }
        let beachCountySanatized = beachCounty.trim();
        if (beachCountySanatized.length < 2 || beachCountySanatized.length > 50)
        {
            throw 'beachCounty parameter must be a string between 2-50 characters long';
        }
        if (!/^[A-Za-z-' ]+$/.test(beachCountySanatized))
        {
            throw 'beachCounty parameter can only contain letters, hypens, apostrophes, and spaces';
        }
        return beachCountySanatized;
    },
    validateBeachStatus(status) {
        if (!status|| typeof status !== 'string')
        {
            throw 'status parameter must be provided and must be a string';
        }
        let statusSanatized = status.trim();
        if (statusSanatized.length < 6)
        {
            throw 'status parameter cannot be an empty string and must be either Active, Closed, or Unknown';
        }
        statusSanatized = statusSanatized.charAt(0).toUpperCase() + statusSanatized.slice(1);
        if (!['Active', 'Closed', 'Unknown'].includes(statusSanatized))
        {
            throw 'status parameter must be either Active, Closed, or Unknown';
        }
        return statusSanatized
    }
};

export default exportedMethods;
