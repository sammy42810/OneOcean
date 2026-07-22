import beaches from './beaches.js';
import generalUtils from '../utils/general_utils.js';
import userUtils from '../utils/user_utils.js';
import { users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';

const formatUser = (user) => ({ ...user, _id: user._id.toString() });

const exportedMethods = {
  async createUser(firstName, lastName, email, gender, city, state, age, password) {
    const newUser = {
      firstName: userUtils.validateName(firstName),
      lastName: userUtils.validateName(lastName),
      email: userUtils.validateUserEmail(email),
      gender: userUtils.validateGender(gender),
      city: userUtils.validateCity(city),
      state: userUtils.validateState(state),
      age: userUtils.validateAge(age),
      hashedPassword: userUtils.validateAndHashPassword(password),
      favoriteBeaches: []
    };

    const usersCollection = await users();
    try {
      const insertInfo = await usersCollection.insertOne(newUser);
      if (!insertInfo.acknowledged || !insertInfo.insertedId) throw 'Could not add user';
      return formatUser({ ...newUser, _id: insertInfo.insertedId });
    } catch (error) {
      if (error?.code === 11000) throw 'A user with that email already exists';
      throw error;
    }
  },

  async getAllUsers() {
    const usersCollection = await users();
    const usersList = await usersCollection.find({}).toArray();
    return usersList.map(formatUser);
  },

  async getUserById(id) {
    const userId = generalUtils.checkId(id);
    const usersCollection = await users();
    const currentUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!currentUser) throw 'No user found with that id';
    return formatUser(currentUser);
  },

  async removeUser(id) {
    const userId = generalUtils.checkId(id);
    const usersCollection = await users();
    const deletionInfo = await usersCollection.findOneAndDelete({ _id: new ObjectId(userId) });
    if (!deletionInfo) throw `Could not delete user with id of ${userId}`;
    return formatUser(deletionInfo);
  },

  async patchUser(userId, updateObject) {
    const id = generalUtils.checkId(userId);
    if (!updateObject || typeof updateObject !== 'object' || Array.isArray(updateObject) || Object.keys(updateObject).length === 0) {
      throw 'updateObject parameter must be a non-empty object';
    }

    const validators = {
      firstName: userUtils.validateName,
      lastName: userUtils.validateName,
      email: userUtils.validateUserEmail,
      gender: userUtils.validateGender,
      city: userUtils.validateCity,
      state: userUtils.validateState,
      age: userUtils.validateAge
    };
    const updates = {};
    for (const [field, value] of Object.entries(updateObject)) {
      if (!Object.hasOwn(validators, field)) throw `updateObject contains an unsupported field: ${field}`;
      updates[field] = validators[field](value);
    }

    const usersCollection = await users();
    try {
      const patchedUser = await usersCollection.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updates },
        { returnDocument: 'after' }
      );
      if (!patchedUser) throw 'No user found with that id';
      return formatUser(patchedUser);
    } catch (error) {
      if (error?.code === 11000) throw 'A user with that email already exists';
      throw error;
    }
  },

  async addFavoriteBeach(userId, beachId) {
    const id = generalUtils.checkId(userId);
    const favoriteBeachId = generalUtils.checkId(beachId);
    await beaches.getBeachById(favoriteBeachId);
    const usersCollection = await users();
    const updatedUser = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id), favoriteBeaches: { $ne: favoriteBeachId } },
      { $addToSet: { favoriteBeaches: favoriteBeachId } },
      { returnDocument: 'after' }
    );
    if (!updatedUser) {
      await this.getUserById(id);
      throw `Favorited beach: ${favoriteBeachId} already exists for user: ${id}`;
    }
    return formatUser(updatedUser);
  },

  async removeFavoriteBeach(userId, beachId) {
    const id = generalUtils.checkId(userId);
    const favoriteBeachId = generalUtils.checkId(beachId);
    const usersCollection = await users();
    const updatedUser = await usersCollection.findOneAndUpdate(
      { _id: new ObjectId(id), favoriteBeaches: favoriteBeachId },
      { $pull: { favoriteBeaches: favoriteBeachId } },
      { returnDocument: 'after' }
    );
    if (!updatedUser) {
      await this.getUserById(id);
      throw `Could not find favorited beach: ${favoriteBeachId} for user: ${id}`;
    }
    return formatUser(updatedUser);
  }
};

export default exportedMethods;