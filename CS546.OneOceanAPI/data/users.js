import mongodb from 'mongodb';
import beaches from './beaches.js'
import generalUtils from '../utils/general_utils.js'
import userUtils from '../utils/user_utils.js'
import {users} from '../config/MongoCollections.js'
import {ObjectId} from 'mongodb';


let exportedMethods = {
    async createUser(firstName, lastName, email, gender, city, state, age, password) {
        let firstNameSanatized = userUtils.validateName(firstName);
        let lastNameSanatized = userUtils.validateName(lastName);
        let emailSanatized = userUtils.validateUserEmail(email);
        let genderSanatized = userUtils.validateGender(gender);
        let citySanatized = userUtils.validateCity(city);
        let stateSanatized = userUtils.validateState(state);
        let ageSanatized = userUtils.validateAge(age);
        let hashedPassword = userUtils.validateAndHashPassword(password)

        let newUser = {
        firstName: firstNameSanatized,
        lastName: lastNameSanatized,
        email: emailSanatized,
        gender: genderSanatized,
        city: citySanatized,
        state: stateSanatized,
        age: ageSanatized,
        hashedPassword: hashedPassword,
        favoriteBeaches:[]
        };
    
        const usersCollection = await users();
        const insertInfo = await usersCollection.insertOne(newUser);
        if (!insertInfo.acknowledged || !insertInfo.insertedId)
        {
            throw 'Could not add user';
        }
        let idStr = (insertInfo.insertedId.toString());
        let insertedUser = Object.assign({_id:''}, newUser);
        insertedUser._id = idStr;
    
        return insertedUser;
    },

    async getAllUsers() {
        const usersCollection = await users();
        let usersList = await usersCollection.find({}).toArray();
        if (!usersList) 
        {
          throw 'Could not get all users';
        }
        equipmentList = equipmentList.map((element) => 
        {
          element._id = element._id.toString();
          return element;
        });
          return usersList;
    },

    async getUserById(id) {
        let idSanatized = generalUtils.checkId(id)
        let id_obj = new ObjectId(idSanatized);
        const usersCollection = await users();
        const currentUser = await usersCollection.findOne({_id: id_obj});
        if (currentUser === null)
        {
            throw 'No user found with that id';
        } 
    
        currentUser._id = currentUser._id.toString();
    
        return currentUser;
    },

    async removeUser(id) {
        let idSanatized = generalUtils.checkId(id)

        let id_obj = new ObjectId(id);
        const usersCollection = await users();
        const deletionInfo =  await usersCollection.findOneAndDelete({_id: id_obj});

        if (!deletionInfo) 
        {
        throw `Could not delete user with id of ${id}`;
        }

        return deletionInfo;   
    },

    async patchUser(userId, updateObject) {
        userId = generalUtils.checkId(userId);

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
        if (Object.hasOwn(updateObject, '_id') || Object.hasOwn(updateObject, 'favoriteBeaches') || Object.hasOwn(updateObject, 'hashedPassword'))
        {
            throw 'patchUser cannot be used to modify _id, favoriteBeaches or password';
        }

        let patchedUser = await this.getUserById(userId);

        let updateObjectClone = structuredClone(updateObject);
        if (updateObjectClone.hasOwnProperty('firstName'))
        {
            patchedUser.firstName = await userUtils.validateName(updateObject.firstName);
            delete updateObjectClone.firstName;
        } 
            if (updateObjectClone.hasOwnProperty('lastName'))
        {
            patchedUser.lastName = await userUtils.validateName(updateObject.lastName);
            delete updateObjectClone.lastName;
        } 
        if (updateObjectClone.hasOwnProperty('email'))
        {
            patchedUser.email = userUtils.validateUserEmail(updateObject.email);
            delete updateObjectClone.email;
        }
        if (updateObjectClone.hasOwnProperty('city'))
        {
            patchedUser.city = userUtils.validateCity(updateObject.city);
            delete updateObjectClone.city;
        }
        if (updateObjectClone.hasOwnProperty('state'))
        {
            patchedUser.state = userUtils.validateState(updateObject.state);
            delete updateObjectClone.state;
        }
        if (updateObjectClone.hasOwnProperty('age'))
        {
            patchedUser.age = userUtils.validateAge(updateObject.age);
            delete updateObjectClone.age;
        }
        if(Object.keys(updateObjectClone).length !== 0)
        {
            throw 'updateObject contains unexpected additional attributes: only should have firstName, lastName, Email, Gender, City, State, and Age';
        }

        delete patchedUser._id;
        let id_obj = new ObjectId(userId);
        const usersCollection = await users();
        const patchedUserInfo = await usersCollection.findOneAndUpdate(
        {_id: id_obj},
        {$set: patchedUser},
        {returnDocument: 'after'});

        if (!patchedUserInfo)
        {
            throw 'Could not patch user successfully';
        }

        patchedUserInfo._id = patchedUserInfo._id.toString();
        return patchedUserInfo;
    },

    async addFavoriteBeach(userId, beachId) {
        userId = generalUtils.checkId(userId);
        beachId = generalUtils.checkId(beachId);

        let currentUser = await this.getUserById(userId);
        let currentBeach = await beaches.getBeachById(beachId);

        let currentFavoriteBeaches = currentUser.favoriteBeaches;
        if (currentFavoriteBeaches.includes(beachId))
        {
            throw `Favorited beach: ${beachId} already exists for user: ${userId}`;
        }
        else
        {
            currentFavoriteBeaches.push(beachId);
        }

        const usersCollection = await users();
        const updatedUserInfo =  await usersCollection.updateOne(
            {_id: currentUser._id},
            {$set: {'favoriteBeaches': currentFavoriteBeaches}},
            {returnDocument: 'after'}
            );

        if (!updatedUserInfo)
        {
            throw `Could not add beach: ${beachId} from favoriteBeaches for user: ${userId}`;
        }

        updatedUserInfo._id = updatedUserInfo._id.toString();
        return updatedUserInfo;
    },

    async removeFavoriteBeach(userId, beachId) {
        userId = generalUtils.checkId(userId);
        beachId = generalUtils.checkId(beachId);

        let currentUser = await this.getUserById(userId);
        let currentBeach = await beaches.getBeachById(beachId);

        let currentFavoriteBeaches = currentUser.favoriteBeaches;
        let targetBeachIndex = currentFavoriteBeaches.indexOf(beachId);
        if (targetBeachIndex === -1)
        {
            throw `Could not find favorited beach: ${beachId} for user: ${userId}`;
        }
        else
        {
            currentFavoriteBeaches.splice(targetBeachIndex, 1);
        }

        const usersCollection = await users();
        const updatedUserInfo =  await usersCollection.updateOne(
            {_id: currentUser._id},
            {$set: {'favoriteBeaches': currentFavoriteBeaches}},
            {returnDocument: 'after'}
            );

        if (!updatedUserInfo)
        {
            throw `Could not remove beach: ${beachId} from favoriteBeaches for user: ${userId}`;
        }

        updatedUserInfo._id = updatedUserInfo._id.toString();
        return updatedUserInfo;
    }
};

export default exportedMethods;
