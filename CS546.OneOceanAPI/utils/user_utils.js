import mongodb from 'mongodb';
import bcrypt from 'bcrypt'
import {users} from '../config/MongoCollections.js'

let exportedMethods = {
    validateName (name) {
        if (!name || name === undefined || name === null)
        {
            throw 'name parameter is required';
        }
        if (typeof name !== 'string')
        {
            throw 'name parameter must be a string';
        }
        let nameSanatized = name.trim();
        if (nameSanatized.length < 2 || nameSanatized.length > 50)
        {
            throw 'name parameter must be a string between 2-50 characters long';
        }
        if (!/^[A-Za-z-]+$/.test(nameSanatized))
        {
            throw 'name parameter can only contain letters and hypens';
        }

        nameSanatized = nameSanatized.charAt(0).toUpperCase() + nameSanatized.slice(1);

        return nameSanatized;
    },
    validateUserEmail(userEmail) {
        if (!userEmail || typeof userEmail !== 'string')
        {
            throw 'userEmail parameter must be provided and must be a string';
        }
        let userEmailSanatized = userEmail.trim();
        if (!/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(userEmailSanatized))
        {
            throw 'userEmail parameter must be in a valid email format';
        }
        return userEmailSanatized;
    },
    validateGender(userGender) {
        if (!userGender|| typeof userGender !== 'string')
        {
            throw 'gender parameter must be provided and must be a string';
        }
        let userGenderSanatized = userGender.trim();
        if (userGenderSanatized.length < 1 || userGenderSanatized.length > 2)
        {
            throw 'gender cannot be empty and must be either M, F, or NB';
        }
        if (!['M', 'F', 'NB'].includes(userGenderSanatized))
        {
            throw 'gender must be either M, F, or NB';
        }
        return userGenderSanatized
    },
    validateCity(userCity) {
        if (!userCity || typeof userCity !== 'string')
        {
            throw 'userCity parameter must be provided and must be a string'
        }
        let userCitySanatized = userCity.trim();
        if (userCitySanatized.length < 2 || userCitySanatized.length > 50)
        {
            throw 'userCity parameter must be a string between 2-50 characters long';
        }
        if (!/^[A-Za-z-' ]+$/.test(userCitySanatized))
        {
            throw 'userCity parameter can only contain letters, hypens, apostrophes, and spaces';
        }
        return userCitySanatized;
    },
    validateState(userState) {
        if (!userState|| typeof userState !== 'string')
        {
            throw 'userState parameter must be provided and must be a string';
        }
        let userStateSanatized = userState.trim();
        if (userStateSanatized.length !== 2)
        {
            throw 'userState must be a 2 letter abbreviation of a U.S state';
        }
        if (!/^[A-Za-z]+$/.test(userStateSanatized))
        {
            throw 'userState parameter can only contain letters';
        }
        return userStateSanatized
    },
    validateAge(userAge) {
        let userAgeSanatized;
        if (!userAge)
        {
            throw 'userAge must be provided'
        }
        if (typeof userAge !== 'number')
        {
            if (typeof userAge === 'string')
            {
                userAgeSanatized = +(userAge.trim());
                if (Number.isNaN(userAgeSanatized))
                {
                    throw 'if userAge is a string it must be in number form';
                }
            }
            else
            {
                throw 'userAge must be a number or string in number form';
            }
        }
        else 
        {
            userAgeSanatized = userAge;
        }
        if (userAgeSanatized <= 0)
        {
            throw 'userAge must be a number greater than 0';
        }
        return userAgeSanatized;
    },
    validateAndHashPassword(userPassword)
    {
        if (!userPassword|| typeof userPassword !== 'string')
        {
            throw 'userPassword parameter must be provided and must be a string';
        }
        let userPasswordSanatized = userPassword.trim();
        if (userPasswordSanatized.length < 8 || userPasswordSanatized.length > 35)
        {
            throw 'userPassword parameter must be a string between 8-35 characters long';
        }
        if (!/^[A-Za-z0-9!@#$%^&*]+$/.test(userPasswordSanatized))
        {
            throw 'userPassword parameter can only contain letters, numbers and the following special characters: !, @, #, $, %, ^, &, *';
        }
        let hashedUserPassword = bcrypt.hashSync(userPasswordSanatized, 10);
        if(!bcrypt.compareSync(userPasswordSanatized, hashedUserPassword))
        {
            throw 'something went wrong hashing the given password'
        }        

        return hashedUserPassword;
    }
};

export default exportedMethods;