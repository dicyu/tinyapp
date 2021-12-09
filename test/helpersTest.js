const { assert } = require('chai');
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const { 
  generateRandomString, checkExistingEmail, checkExistingPassword, findUserIdFromEmail, urlsForUser 
} = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: bcrypt.hashSync("purple-monkey-dinosaur", salt)
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: bcrypt.hashSync("dishwasher-funk", salt)
  }
};

const testUrlDatabase = {
  "aubn4a": {
    longUrl: "http://www.lighthouselabs.ca",
    userID: "user1"
  },
  "bkaib4": {
    longUrl: "http://www.google.com",
    userID: "user2"
  },
  "a74jag": {
    longUrl: "http://www.reddit.com",
    userID: "user3"
  }
};

describe('generateRandomString', () => {
  it('should return a 6 character random string can have numbers or not', () => {
    const stringLength = generateRandomString().length;
    const expectedOutput = 6;
    assert.equal(stringLength, expectedOutput);
  });
  it('should keep everything random, none two random strings should be the same', () => {
    const string1 = generateRandomString();
    const string2 = generateRandomString();
    assert.notEqual(string1, string2);
  });
});

describe('checkExistingEmail', () => {
  it('should find a email already existing in the database', () => {
    const existingEmail = checkExistingEmail('user@example.com', testUsers);
    const expectedOutput = true;
    assert.equal(existingEmail, expectedOutput);
  });
  it('should return false if email does not exist in database', () => {
    const existingEmail = checkExistingEmail('hello@hello.com', testUsers);
    const expectedOutput = false;
    assert.equal(existingEmail, expectedOutput);
  });
});

describe('checkExistingPassword', () => {
  it('should find a password already existing to login', () => {
    const existingPass = checkExistingPassword('purple-monkey-dinosaur', testUsers['userRandomID']['password']);
    const expectedOutput = true;
    assert.equal(existingPass, expectedOutput);
  });
  it('should return false if password does not exist to login', () => {
    const existingPass = checkExistingPassword('thisisapassword', testUsers['user2RandomID']['password']);
    const expectedOutput = false;
    assert.equal(existingPass, expectedOutput);
  });
});

describe('findUserIdFromEmail', () => {
  it('should find a user with a valid email in the database', () => {
    const existingEmail = findUserIdFromEmail('user@example.com', testUsers);
    const expectedOutput = 'userRandomID';
    assert.equal(existingEmail, expectedOutput);
  });
  it('should return undefined if no user was found with given email', () => {
    const existingEmail = findUserIdFromEmail('hello@hello.com', testUsers);
    const expectedOutput = undefined;
    assert.equal(existingEmail, expectedOutput);
  });
});

describe('urlsForUser', () => {
  it('should return an object of the url info specific to the given user', () => {
    const existingURL = urlsForUser('user1', testUrlDatabase);
    const expectedOutput = {
      "aubn4a": {
        longUrl: "http://www.lighthouselabs.ca",
        userID: "user1"
      },
    };
    assert.deepEqual(existingURL, expectedOutput);
  });
  it('should return a empty object if no url info specific for given user', () => {
    const existingURL = urlsForUser('user3RandomID', testUrlDatabase);
    const expectedOutput = {};
    assert.deepEqual(existingURL, expectedOutput);
  });
});