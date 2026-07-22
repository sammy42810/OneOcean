export const usersValidator = {
  $jsonSchema: {
    bsonType: 'object',
    required: [
      '_id',
      'firstName',
      'lastName',
      'email',
      'gender',
      'city',
      'state',
      'age',
      'hashedPassword',
      'favoriteBeaches'
    ],
    additionalProperties: false,
    properties: {
      _id: {
        bsonType: 'objectId',
        description: 'MongoDB-generated user identifier.'
      },
      firstName: { bsonType: 'string', minLength: 2, maxLength: 50 },
      lastName: { bsonType: 'string', minLength: 2, maxLength: 50 },
      email: {
        bsonType: 'string',
        pattern: '^.+@.+\\..+$',
        description: 'Must be an email address.'
      },
      gender: { enum: ['M', 'F', 'NB'] },
      city: { bsonType: 'string', minLength: 2, maxLength: 50 },
      state: { bsonType: 'string', pattern: '^[A-Za-z]{2}$' },
      age: { bsonType: ['int', 'long', 'double', 'decimal'], minimum: 1 },
      hashedPassword: { bsonType: 'string', minLength: 1 },
      favoriteBeaches: {
        bsonType: 'array',
        items: { bsonType: 'string' },
        description: 'Stores favorited beach document IDs.'
      }
    }
  }
};

export const usersIndexes = [
  {
    key: { email: 1 },
    name: 'users_email_unique',
    unique: true,
    collation: { locale: 'en', strength: 2 }
  }
];
