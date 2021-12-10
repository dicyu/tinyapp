// Dependencies
const bcrypt = require('bcryptjs');

//****Helper Functions ****/

const generateRandomString = () => {
  const randomString = Math.random().toString(36).substring(2, 8);
  return randomString;
};

const checkExistingEmail = (newEmail, database) => {
  for (let email in database) {
    let queryEmail = database[email]['email'];

    if (newEmail === queryEmail) {
      return true;
    }
  }
  return false;
};

const checkExistingPassword = (key1, key2) => {
  if (bcrypt.compareSync(key1, key2)) {
    return true;
  }
  return false;
};

const findUserIdFromEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user].id;
    }
  }
};

const urlsForUser = (id, urlDatabase) => {
  let userURLs = {};

  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

const addingNewURL = (longURL, userID, database) => {
  const dateCreated = new Date();
  const visitCount = 0;
  const uniqueVists = 0;
  const visitHistory = [];
  const visitIDList = [];
  const shortURL = generateRandomString();

  database[shortURL] = {
    userID,
    longURL,
    dateCreated,
    visitCount,
    uniqueVists,
    visitHistory,
    visitIDList
  };
  return shortURL;
};

module.exports = {
  generateRandomString,
  checkExistingEmail,
  checkExistingPassword,
  findUserIdFromEmail,
  urlsForUser,
  addingNewURL
};