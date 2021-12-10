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
const urlDatabase = {
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    userID: '34iibk',
    dateCreated: new Date(),
    visitCount: 0,
    unqiueVists: 0, 
    visitHistory: [],
    visitIDList: []
  },
  '9sm5xK': {
    longURL: 'http://www.google.ca',
    userID: '34iibk',
    dateCreated: new Date(),
    visitCount: 0,
    unqiueVists: 0, 
    visitHistory: [],
    visitIDList: []
  },
  'r9mcvl': {
    longURL: 'http://www.google.ca',
    dateCreated: new Date(),
    userID: 'buq4s7',
    visitCount: 0,
    unqiueVists: 0, 
    visitHistory: [],
    visitIDList: []
  }
};

const users = {
  '34iibk': {
    id: '34iibk',
    email: 'user@example.com',
    password: bcrypt.hashSync('test1', salt)
  },
  'buq4s7': {
    id: 'buq4s7',
    email: 'user2@example.com',
    password: bcrypt.hashSync('test2', salt)
  }
};

/***
Routes
***/

app.get('/', (req, res) => {
  res.redirect('/urls');
});

// Post new URL into database
app.post('/urls', (req, res) => {
  let templateVars = { 
    user: users[req.session['user_id']]
  }

  if (!templateVars.user) { // => if user isn't logged in output this error
    res.status(400).send('You need to be logged in or registered to see this page.');
  } else {
    const longURL = req.body.longURL;
    const userID = req.session['user_id'];
    const shortURL = addingNewURL(longURL, userID, urlDatabase)
    res.redirect(`/urls/${shortURL}`);
  }
});

// a redirect to the actual website
app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
} else {
    res.status(404).send('Tiny URL ID does not exist.')
  }
});

// Get urls from the database for the url page
app.get('/urls', (req, res) => {
  let templateVars = { 
    user: users[req.session['user_id']],
    urls: urlsForUser(req.session['user_id'], urlDatabase) // => checking to see if relevant URLs match account
  };
  res.render('urls_index', templateVars);
});

// Get URL form page to add new URL
app.get('/urls/new', (req, res) => {
  let templateVars = { 
    user: users[req.session['user_id']] 
  };

  if (!templateVars.user) { // => if the user isn't logged in
    res.redirect('/login');
  } else {
    res.render('urls_new', templateVars);
  }

});

// ShortURL page
app.get('/urls/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {

    let templateVars = {
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      urlUserID: urlDatabase[req.params.shortURL].userID,
      user: users[req.session['user_id']],
      urls: urlDatabase
    };
    res.render('urls_show', templateVars);
  } else {
    res.status(404).send('The short URL you entered does not exist.')
  }

});

// Update a URL
app.put('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL
  const longURL = req.body.newURL

  // urlDatabase[shortURL] = { longURL, userID };
  
  urlDatabase[shortURL].longURL = longURL;
  urlDatabase[shortURL].dateCreated = new Date();
  urlDatabase[shortURL].visitCount = 0;
  urlDatabase[shortURL].unqiueVists = 0; 
  urlDatabase[shortURL].visitHistory = [];
  urlDatabase[shortURL].visitIDList = [];

  res.redirect('/urls')
});

// Delete a URL
app.delete('/urls/:shortURL', (req, res) => {
  const userID = req.session['user_id'];
  const userURLs = urlsForUser(userID);
  const shortURL = req.params.shortURL

  // Check if user is logged in or not won't be able to delete
  if (urlsForUser(userID, urlDatabase)[shortURL]) {
    delete urlDatabase[shortURL]
    res.redirect('/urls')
  } else {
    res.status(401).send('Error.');
  }
});

// Check to see if user is logged in to be able to POST
app.post('/urls/:id', (req, res) => {
  const userID = req.session['user_id'];
  const userURLs = urlsForUser(userID);
  const shortURL = req.params.id;

  if (Object.keys(userURLs).includes(shortURL)) {
    urlDatabase[shortURL] = { longURL, userID }
    res.redirect('/urls');
  } else {
    res.status(401).send('Error');
  }
});

// Registration GET and POST
app.get('/register', (req, res) => {
  let templateVars = { 
    user: users[req.session['user_id']],
  };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const newUserID = generateRandomString();
  const newEmail = req.body.email;
  const newPass = bcrypt.hashSync(req.body.password, salt);

  if (newEmail === "" && newPass === "") {
    res.status(400).send('Please enter an email and a password.');
    } else if (newEmail === "") {
      res.status(400).send('Please enter a email.');
    } else if (newPass === "") {
      res.send('Please enter a password.');
    }
    
    if (checkExistingEmail(newEmail, users) === true) {
      res.status(400).send('Email already exists')
    } else {
      req.session['user_id'] = newUserID;
      res.redirect('/urls');
      users[newUserID] = { id: newUserID, email: newEmail, password: newPass }
    };
});

// Login GET and POST
app.get('/login', (req, res) => {
  let templateVars = {
    user: users[req.session['user_id]']]
  }
  res.render('urls_login', templateVars)
});

app.post('/login', (req, res) => {
  const loginEmail = req.body.email
  const loginPass = req.body.password
  const user = findUserIdFromEmail(loginEmail, users);

  if (!user) {
    res.status(403).send('Email not found.')
  } else {
    if (checkExistingPassword(loginPass, users[user].password)) {
      req.session['user_id'] = user;
      res.redirect('/urls')
    } else {
      res.status(403).send('Password is wrong.')
    }
  }
  });

// Logout post and deleting cookies
app.post('/logout', (req, res) => {
  req.session['user_id'] = null;
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Tiny App is listening on port ${PORT}!`)
});