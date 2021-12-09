// Dependencies
const bcrypt = require('bcryptjs');

// Helper Functions
const generateRandomString = () => {
  const randomString = Math.random().toString(36).substring(2, 8);
  return randomString;
};

const checkExistingEmail = (newEmail) => {
  for (let email in users) {
    let queryEmail = users[email]['email'];

    if (newEmail === queryEmail) {
      return true;
    } else {
      return false;
    }
  }
};

const checkExistingPassword = (key1, key2) => {
    if (bcrypt.compareSync(key1, key2)) {
      return true;
    } else {
      return false;
    }
};

const findUserIdFromEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user].id;
    }
  }
}

const urlsForUser = (id, urlDatabase) => {
  let userURLs = {};

  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

module.exports = { 
  generateRandomString,
  checkExistingEmail,
  checkExistingPassword,
  findUserIdFromEmail,
  urlsForUser
};