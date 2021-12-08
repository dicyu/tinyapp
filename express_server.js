const express = require('express');
const app = express();
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const PORT = 8080; // => Default Port : 8080

// Middleware
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

// Database
const urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.ca'
};

const users = {
  '34iibk': {
    id: '34iibk',
    email: 'user@example.com',
    password: 'test1'
  },
  'buq4s7': {
    id: 'buq4s7',
    email: 'user2@example.com',
    password: 'test2'
  }
};

// Helper Functions
function generateRandomString() {
  const randomString = Math.random().toString(36).substring(2, 8);
  // console.log(randomString);
  return randomString;  
};

/***
Routes
***/

app.get('/', (req, res) => {
  res.send('Hello!');
});


// Post new URL from form page, into database
app.post('/urls', (req, res) => {
  // console.log(req.body.longURL) // Logs the POST request to body to the console
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

// a redirect to the actual website
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  // console.log(longURL);
  res.redirect(longURL);
});

// Get urls for the url page
app.get('/urls', (req, res) => {
  let templateVars = { 
    user: users[req.cookies['user_id']],
    urls: urlDatabase,
  };
  res.render('urls_index', templateVars);
});

// Get URL form page to add new URL
app.get('/urls/new', (req, res) => {
  let templateVars = { 
    user: users[req.cookies['user_id']] 
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = { 
    shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    user: users[req.cookies['user_id']]
  }
  res.render('urls_show', templateVars);
});

// Delete a URL
app.post('/urls/:shortURL/delete', (req, res) => {
  const urlId = req.params.shortURL;
  delete urlDatabase[urlId]
  res.redirect('/urls')
});

// Update a URL
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL
  const longURL = req.body.newURL
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls')
});

// Login post, username cookies
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// Logout post and deleting cookies
app.post('/logout', (req, res) => {
  res.clearCookie('user_id', req.cookies['user_id']);
  res.redirect('/urls');
});

// Registration GET and POST
app.get('/register', (req, res) => {
  let templateVars = { 
    user: users[req.cookies['user_id']],
  };
  res.render('urls_register', templateVars);
});

app.post('/register', (req, res) => {
  const newUserID = generateRandomString();
  const newEmail = req.body.email;
  const newPass = req.body.password;

  users[newUserID] = { id: newUserID, email: newEmail, password: newPass }

  console.log(users);
  // console.log(users[newUserID]);

  res.cookie('user_id', newUserID);
  res.redirect('/urls');
});


app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

// app.get('/hello', (req, res) => {
//   res.send('<html><body>Hello <b>World</b></body></html>\n')
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`)
});