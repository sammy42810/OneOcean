import mongodb from 'mongodb';
import {ObjectId} from 'mongodb';
let exportedMethods = {
    checkId(id) {
        if (!id || id === undefined || id === null) 
        {
            throw 'ID Must Be Provided!';
        }
        if (typeof id !== 'string' || !Number.isNaN(+id))
        {
            throw 'Bad Request!';
        } 
        id = id.trim();
        if (id.length === 0)
        {
            throw 'Empty ID!';
        }
        if (!ObjectId.isValid(id))
        {
            throw 'Invalid ObjectID!';
        } 
        return id;
    }
};

export default exportedMethods;