import geojson from 'geojson'
import {ObjectId} from 'mongodb';

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
        if (!/^[A-Za-z-,' ]+$/.test(beachNameSanatized))
        {
            throw 'beachName parameter can only contain letters, hypens, commas, apostrophes, and spaces';
        }
        return beachNameSanatized;
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
    validateWaterQuality(waterQuality) {
        // A 1-10 safety score, or null until it is computed from monitoring data.
        if (waterQuality === null || waterQuality === undefined)
        {
            return null;
        }
        let waterQualitySanatized;
        if (typeof waterQuality !== 'number')
        {
            if (typeof waterQuality === 'string')
            {
                waterQualitySanatized = +(waterQuality.trim());
                if (Number.isNaN(waterQualitySanatized))
                {
                    throw 'if waterQuality is a string it must be in number form';
                }
            }
            else
            {
                throw 'waterQuality must be a number, a string in number form, or null';
            }
        }
        else
        {
            waterQualitySanatized = waterQuality;
        }
        if (waterQualitySanatized < 1 || waterQualitySanatized > 10)
        {
            throw 'waterQuality must be a number between 1 and 10';
        }
        return waterQualitySanatized;
    },
    computeAutoRating(beachLength, waterQuality) {
        // Automatically generated 1-5 rating weighted from objective beach data.
        // Water quality (a 1-10 safety score) dominates, with a smaller bonus for
        // beach size. Returns null while water quality is unpopulated, since the
        // score is meaningless without it.
        let waterQualitySanatized = this.validateWaterQuality(waterQuality);
        if (waterQualitySanatized === null)
        {
            return null;
        }
        let beachLengthSanatized = this.validateBeachLength(beachLength);

        const WATER_QUALITY_WEIGHT = 0.8;
        const BEACH_SIZE_WEIGHT = 0.2;
        const FULL_SIZE_CREDIT_MILES = 5; // beaches >= 5 miles earn the full size bonus

        let waterQualityNorm = waterQualitySanatized / 10;                                  // 0.1 - 1.0
        let beachSizeNorm = Math.min(beachLengthSanatized / FULL_SIZE_CREDIT_MILES, 1);     // 0.0 - 1.0

        let weighted = (WATER_QUALITY_WEIGHT * waterQualityNorm) + (BEACH_SIZE_WEIGHT * beachSizeNorm); // 0 - 1
        let autoRating = weighted * 5; // scale onto the same 1-5 band as userRating

        autoRating = Math.min(Math.max(autoRating, 1), 5);
        return Math.round(autoRating * 10) / 10; // round to 1 decimal place
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
    },
    validateRating(rating) {
        let ratingSanatized;
        if (!rating)
        {
            throw `rating must be provided`;
        }
        if (typeof rating !== 'number')
        {
            if (typeof rating === 'string')
            {
                ratingSanatized = +(rating.trim());
                if (Number.isNaN(ratingSanatized))
                {
                    throw `if rating is a string it must be in number form`;
                }
            }
            else
            {
                throw `rating must be a number or string in number form`;
            }
        }
        else 
        {
            ratingSanatized = rating;
        }
        if (ratingSanatized <= 0 || ratingSanatized >= 5)
        {
            throw 'rating must be a number greater than 0 and less than or equal to 5';
        }
        return ratingSanatized;
    },
    createRatingObject(raterId, firstName, lastName, ratingStr)
    {
        let ratingObject = 
        {
            _id: null,
            raterId: null,
            name: null,
            rating: null
        };

        if (!raterId || !firstName || !lastName || !ratingStr)
        {
            throw 'raterId, firstName, lastName, and ratingStr must be provided';
        }
        if (typeof raterId !== 'string' || typeof firstName !== 'string' || typeof lastName !== 'string'|| typeof ratingStr !== 'string')
        {
            throw 'raterId, firstName, lastName, and ratingStr must be strings';
        }

        raterId = raterId.trim();
        firstName = firstName.trim();
        lastName = lastName.trim();
        ratingStr = ratingStr.trim();

        if (raterId.length === 0 || firstName.length === 0 || lastName.length === 0 || ratingStr.length === 0)
        {
            throw 'raterId, firstName, lastName, and ratingStr cannot be empty strings';
        }

        ratingObject._id = new ObjectId();
        ratingObject.raterId = new ObjectId(raterId);
        ratingObject.name = firstName + " " + lastName;
        ratingObject.rating = this.validateRating(ratingStr);

        return ratingObject
    },
    validateDistance(distance) {
        let distanceSanatized;
        if (!distance)
        {
            throw `distance must be provided`;
        }
        if (typeof distance !== 'number')
        {
            if (typeof distance === 'string')
            {
                distanceSanatized = +(distance.trim());
                if (Number.isNaN(distanceSanatized))
                {
                    throw `if distance is a string it must be in number form`;
                }
            }
            else
            {
                throw `distance must be a number or string in number form`;
            }
        }
        else 
        {
            distanceSanatized = distance;
        }
        if (distanceSanatized <= 0)
        {
            throw 'distance must be a number greater than 0';
        }
        return distanceSanatized;
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
    createGeoObject(upperLon, upperLat, lowerLon, lowerLat) {
        let avgLon;
        let avgLat;
        if (upperLon && upperLat && lowerLon && lowerLat)
        {
            let upperLonSanatized = this.validateCoords(upperLon, 'geoUpperLon');
            let lowerLonSanatized = this.validateCoords(lowerLon, 'geoLowerLon');
            let upperLatSanatized = this.validateCoords(upperLat, 'geoUpperLat');
            let lowerLatSanatized = this.validateCoords(lowerLat, 'geoLowerLat');

            avgLon = (upperLonSanatized + lowerLonSanatized) / 2;
            avgLat = (upperLatSanatized + lowerLatSanatized) / 2;   
        }
        else if (upperLon && upperLat)
        {
            avgLon = this.validateCoords(upperLon, 'geoLon');
            avgLat = this.validateCoords(upperLat, 'geoLat');
        }
        else
        {
            throw 'atleast one set of longitude and latitude values must be provided';
        }
        let geoObject =
        {
            type: "Point",
            coordinates: [avgLon, avgLat]
        };
        return geoObject;
    }
};

export default exportedMethods;
