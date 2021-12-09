const express = require('express');
const app = express();
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const e = require('express');
const PORT = 8080; // => Default Port : 8080

// Middleware
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

// Database
const urlDatabase = {
  'b2xVn2': {
    longURL: 'http://www.lighthouselabs.ca',
    userID: '34iibk'
  },
  '9sm5xK': {
    longURL: 'http://www.google.ca',
    userID: '34iibk'
  },
  'r9mcvl': {
    longURL: 'http://www.google.ca',
    userID: 'buq4s7'
  }
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

function checkExistingEmail(newEmail) {
  // console.log("Testing");
  for (let email in users) {
    let queryEmail = users[email]['email'];

    if (newEmail === queryEmail) {
      return true;
    } else {
      return false;
    }
  }
};

function checkExistingPassword(user, password) {
    if (user.password === password) {
      return true;
    } else {
      return false;
    }
};

const findUser = email => {
  return Object.values(users).find(user => user.email === email);
}

const urlsForUser = (id) => {
  let userURLs = {};

  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
};

/***
Routes
***/

app.get('/', (req, res) => {
  res.send('Hello!');
});


// Post new URL from form page, into database
app.post('/urls', (req, res) => {
  let templateVars = { 
    user: users[req.cookies['user_id']]
  }
  // console.log(req.body.longURL) // Logs the POST request to body to the console

  if (!templateVars.user) { // => if user isn't logged in
    res.status(400).send('You need to be logged in or registered to see this page.');
  } else {
    let shortURL = generateRandomString();
    let longURL = req.body.longURL;
    let userID = req.cookies['user_id'];

    urlDatabase[shortURL] = { longURL, userID };
    res.redirect(`/urls/${shortURL}`);
  }
});

// a redirect to the actual website
app.get('/u/:shortURL', (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  // console.log(longURL);
  res.redirect(longURL);
} else {
    res.status(404).send('Tiny URL ID does not exist.')
  }
});

// Get urls for the url page
app.get('/urls', (req, res) => {
  let templateVars = { 
    user: users[req.cookies['user_id']],
    urls: urlsForUser(req.cookies['user_id']) // => checking to see if relvant URLs match account
  };
  res.render('urls_index', templateVars);
});

// Get URL form page to add new URL
app.get('/urls/new', (req, res) => {
  let templateVars = { 
    user: users[req.cookies['user_id']] 
  };

  if (!templateVars.user) { // => if the user isn't logged in
    res.redirect('/login');
  } else {
    res.render('urls_new', templateVars);
  }

});

app.get('/urls/:shortURL', (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    urlUserID: urlDatabase[req.params.shortURL].userID,
    user: users[req.cookies['user_id']]
  };
  console.log(templateVars)
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

  if (newEmail === "" && newPass === "") {
    res.status(400).send('Please enter an email and a password.');
    // console.log(users);
    } else if (newEmail === "") {
      res.status(400).send('Please enter a email.');
      // console.log(users);
    } else if (newPass === "") {
      res.send('Please enter a password.');
      // console.log(users);
    }
    
    if (checkExistingEmail(newEmail) === true) {
      res.status(400).send('Email already exists')
      // console.log(users);
    } else {
      res.cookie('user_id', newUserID);
      res.redirect('/urls');
      users[newUserID] = { id: newUserID, email: newEmail, password: newPass }
      // console.log(users);
    };

  // console.log(users);
  // console.log(users[newUserID]);
});

// Login GET and POST
app.get('/login', (req, res) => {
  let templateVars = {
    user: users[req.cookies['user_id]']]
  }
  res.render('urls_login', templateVars)
});

app.post('/login', (req, res) => {
  loginEmail = req.body.email
  loginPass = req.body.password
  const user = findUser(loginEmail);

  console.log(loginEmail)
  console.log(loginPass);

  if (!user) {
    res.status(403).send('Email not found.')
  } else {
    if (!checkExistingPassword(user, loginPass)) {
      res.status(403).send('Password is wrong.')
    } else {
      console.log(users);
      res.cookie('user_id', user.id);
      res.redirect('/urls')
    }
  }
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