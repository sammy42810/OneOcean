export const beachesValidator = {
  $jsonSchema: {
    bsonType: 'object',
    required: [
      '_id',
      'beachId',
      'name',
      'location',
      'status',
      'beachLength',
      'waterQuality',
      'advisories',
      'comments',
      'upperLat',
      'lowerLat',
      'upperLon',
      'lowerLon'
    ],
    additionalProperties: false,
    properties: {
      _id: {
        bsonType: 'objectId',
        description: 'MongoDB-generated beach identifier.'
      },
      beachId: {
        bsonType: 'string',
        minLength: 1,
        description: 'Unique beach identifier from the CA beach water quality dataset.'
      },
      name: { bsonType: 'string', minLength: 1, maxLength: 100 },
      location: { bsonType: 'string', minLength: 1, maxLength: 200 },
      status: {
        enum: ['Active', 'Inactive'],
        description: 'Matches the CA beach water quality dataset\'s own Active/Inactive status.'
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
      advisories: {
        bsonType: 'array',
        items: { bsonType: 'string' }
      },
      comments: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['_id', 'name', 'comment'],
          additionalProperties: false,
          properties: {
            _id: { bsonType: 'objectId' },
            name: { bsonType: 'string', minLength: 1, maxLength: 100 },
            comment: { bsonType: 'string', minLength: 1, maxLength: 1000 }
          }
        }
      },
      upperLat: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: -90, maximum: 90 },
      lowerLat: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: -90, maximum: 90 },
      upperLon: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: -180, maximum: 180 },
      lowerLon: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: -180, maximum: 180 }
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
