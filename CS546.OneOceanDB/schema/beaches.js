export const beachesValidator = {
  $jsonSchema: {
    bsonType: 'object',
    required: [
      '_id',
      'beachId',
      'beachName',
      'city',
      'county',
      'status',
      'beachLength',
      'waterQuality',
      'userRating',
      'BeachComments',
      'BeachRatings',
      'geoObject'
    ],
    additionalProperties: false,
    properties: {
      _id: {
        bsonType: 'objectId',
        description: 'MongoDB-generated beach identifier.'
      },
      beachId: {
        bsonType: 'int',
        minLength: 1,
        description: 'Unique beach identifier from the CA beach water quality dataset.'
      },
      beachName: { bsonType: 'string', minLength: 1, maxLength: 100 },
      city: { bsonType: 'string', minLength: 1, maxLength: 100 },
      county: { bsonType: 'string', minLength: 1, maxLength: 100 },
      status: {
        enum: ['Active', 'Closed', 'Unknown'],
        description: 'Beach status as produced by the API (utils/beach_utils.js#validateBeachStatus). The CA dataset\'s Active/Inactive status is mapped into this set on import (Inactive -> Unknown).'
      },
      beachLength: {
        bsonType: ['int', 'long', 'double', 'decimal'],
        minimum: 0,
        description: 'Length of the beach in miles.'
      },
      waterQuality: {
        bsonType: ['int', 'long', 'double', 'decimal', 'null'],
        minimum: 1,
        maximum: 10,
        description: 'A 1-10 safety score, or null until computed from bacteria monitoring results.'
      },
      userRating: {
        bsonType: ['int', 'long', 'double', 'decimal', 'null'],
        minimum: 1,
        maximum: 5,
        description: 'A 1-5 averaged user rating score, or null until the first user review is entered'
      },
      autoRating: {
        bsonType: ['int', 'long', 'double', 'decimal', 'null'],
        minimum: 1,
        maximum: 5,
        description: 'A 1-5 automatically generated rating weighted from beach size and water quality, or null until water quality is populated.'
      },
      swimSeasonLength: {
        bsonType: 'string',
        description: 'Human-readable swim season length (e.g. "Year-round").'
      },
      BeachComments: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['_id', 'name', 'comment'],
          additionalProperties: false,
          properties: {
            _id: { bsonType: 'objectId' },
            commenterId: { bsonType: 'objectId'},
            name: { bsonType: 'string', minLength: 1, maxLength: 100 },
            postTime: { bsonType: 'string'},
            comment: { bsonType: 'string', minLength: 1, maxLength: 1000 }
          }
        }
      },
      BeachRatings: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['_id', 'raterId', 'name', 'rating'],
          additionalProperties: false,
          properties: {
            _id: { bsonType: 'objectId'},
            raterId: { bsonType: 'objectId'},
            name: { bsonType: 'string', minLength: 1, maxLength: 100 },
            rating: { bsonType: ['int', 'long', 'double', 'decimal'] }
          }
        }
      },
      geoObject: {
          bsonType: 'object',
          required: ['type', 'coordinates'],
          additionalProperties: false,
          properties: {
            type: { bsonType: 'string', minLength: 1, maxLength: 10},
            coordinates: {
              bsonType: 'array', 
              items: {bsonType: ['int', 'long', 'double', 'decimal', 'null']}
            }
          }   
      }
    }
  }
};

export const beachesIndexes = [
  {
    key: { beachId: 1 },
    name: 'beaches_beachId_unique',
    unique: true
  }
];
