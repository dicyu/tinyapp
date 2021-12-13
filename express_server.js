// Dependencies
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');

// Global
const PORT = 8080; // => Default Port : 8080
const salt = bcrypt.genSaltSync(10);

// Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: [
    'e549d7a4-9615-4e88-a07e-65a9b351308b',
    'b0b26882-ee4c-48b6-9ff0-6a33cc93cd88',
  ],
}));
app.use(methodOverride('_method'));

// Functions
const {
  generateRandomString, checkExistingEmail, checkExistingPassword, findUserIdFromEmail, urlsForUser, addingNewURL
} = require('./helpers');

// Database for URLs and users
const urlDatabase = {};
const users = {};

/***
Routes
***/

// GET => Main page redirects
app.get('/', (req, res) => {
  if (req.session['user_id']) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// POST => a new URL into the database //
app.post('/urls', (req, res) => {
  const templateVars = {
    user: users[req.session['user_id']]
  };

  if (!templateVars.user) { // => if user isn't logged in output this error
    res.status(400).send('You need to be logged in or registered to see this page.');
  } else {
    const longURL = req.body.longURL;
    const userID = req.session['user_id'];
    const shortURL = addingNewURL(longURL, userID, urlDatabase);
    res.redirect(`/urls/${shortURL}`);
  }
});

// GET => a redirect to the actual website //
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const dateVisted = new Date();
  
  // Added visit analytics into the database
  if (!urlDatabase[shortURL]) {
      res.status(404).send('This TinyURL does not exist');
    } else if (!req.session['user_id']) {
    req.session['user_id'] = generateRandomString();
    urlDatabase[shortURL].visitHistory.push([dateVisted, req.session['user_id']]);
    urlDatabase[shortURL].visitCount++;
    urlDatabase[shortURL].visitIDList.push(req.session['user_id']);
    urlDatabase[shortURL].uniqueVisits++;
  } else {
    const visitID = urlDatabase[shortURL].visitIDList;
    urlDatabase[shortURL].visitHistory.push([dateVisted, req.session['user_id']]);
    urlDatabase[shortURL].visitCount++;
    if (!visitID.includes(req.session['user_id'])) {
      visitID.push(req.session['user_id']);
      urlDatabase[shortURL].uniqueVisits++;
    }
  }
  const longURL = urlDatabase[shortURL].longURL;
  if (longURL.startsWith('http://')) {
    res.redirect(longURL);
  } else {
    res.redirect(`http://${longURL}`);
  }
});

// GET => urls from the database, display them //
app.get('/urls', (req, res) => {
  const templateVars = {
    user: users[req.session['user_id']],
    urls: urlsForUser(req.session['user_id'], urlDatabase) // => checking to see if relevant URLs match account
  };
  res.render('urls_index', templateVars);
});

// GET => URL form page to add new URLs //
app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: users[req.session['user_id']]
  };
  if (!templateVars.user) { // => if the user isn't logged in
    res.redirect('/login');
  } else {
    res.render('urls_new', templateVars);
  }
});

// GET => shortURL page //
app.get('/urls/:shortURL', (req, res) => {
  if (!urlDatabase[req.params.shortURL]) {
    res.status(404).send('Looks like this TinyURL does not exist!')
  }
  const templateVars = {
    shortURL: req.params.shortURL,
    urlUserID: urlDatabase[req.params.shortURL].userID,
    user: users[req.session['user_id']],
    urls: urlDatabase
  };
  if (req.session['user_id'] === templateVars.urlUserID) {
    res.render('urls_show', templateVars);
  } else {
    res.status(401);
    res.render('urls_show', templateVars);
  }
});

// PUT => Update a URL when logged in //
app.put('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.newURL;
  
  if (req.session['user_id'] === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = longURL;
    urlDatabase[shortURL].dateCreated = new Date();
    urlDatabase[shortURL].visitCount = 0;
    urlDatabase[shortURL].unqiueVists = 0;
    urlDatabase[shortURL].visitHistory = [];
    urlDatabase[shortURL].visitIDList = [];
    res.redirect('/urls');
  } else {
    res.status(401).send(`You're not allowed to edit this TinyURL.`)
  }
});

// DELETE => a URL //
app.delete('/urls/:shortURL', (req, res) => {
  const userID = req.session['user_id'];
  const userURL = urlsForUser(userID, urlDatabase);
  
  // Check if user is logged in or not, won't be able to delete if not
  if (Object.keys(userURL).includes(req.params.shortURL)) {
    const shortURL = req.params.shortURL;
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.status(403).send(`You're not logged in, you can't delete this.`);
  }
});

// POST => Check to see if user is logged in, if yes, can POST //
app.post('/urls/:id', (req, res) => {
  const userID = req.session['user_id'];
  const userURLs = urlsForUser(userID, urlDatabase);
  const shortURL = req.params.id;

  if (Object.keys(userURLs).includes(shortURL)) {
    urlDatabase[shortURL].longURL = req.body.newURL;
    res.redirect('/urls');
  } else {
    res.status(401).send(`You're not logged in, you do not have authorization.`);
  }
});

// GET => Registration GET and POST //
app.get('/register', (req, res) => {
  const templateVars = {
    user: users[req.session['user_id']],
  };
  if (templateVars.user) {
    res.redirect('/urls')
  } else {
    res.render('urls_register', templateVars);
  }
});

app.post('/register', (req, res) => {
  const newUserID = generateRandomString();
  const newEmail = req.body.email;
  const password = req.body.password;
  const newPass = bcrypt.hashSync(req.body.password, salt);

  if (!newEmail || !password) {
    res.status(400).send('Please enter an email or a password.');
  } else if (checkExistingEmail(newEmail, users) === true) {
    res.status(400).send('This email already exists');
  } else {
    req.session['user_id'] = newUserID;
    users[newUserID] = { id: newUserID, email: newEmail, password: newPass };
    res.redirect('/urls');
  }
});

// GET => Login GET and POST //
app.get('/login', (req, res) => {
  const templateVars = {
    user: users[req.session['user_id']],
  };
  if (templateVars.user) {
    res.redirect('/urls')
  } else {
    res.render('urls_login', templateVars);
  }
});

app.post('/login', (req, res) => {
  const loginEmail = req.body.email;
  const loginPass = req.body.password;
  const user = findUserIdFromEmail(loginEmail, users);

  if (!user) {
    res.status(403).send('This email is not found.');
  } else {
    if (!checkExistingPassword(loginPass, users[user].password)) {
      res.status(403).send('This password is wrong.');
    } else {
      req.session['user_id'] = user;
      res.redirect('/urls');
    }
  }
});

// POST => Logout and deleting cookies //
app.post('/logout', (req, res) => {
  req.session['user_id'] = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Tiny App is listening on port ${PORT}!`);
});