/* eslint-disable no-prototype-builtins */
const express = require("express");
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

//  helper functions
const { generateRandomString, keyValueLookup, filter2DObject } = require('./helpers');


app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ['alphabeta'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));


//  DATA DECLARATIONS
const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ481W"
  },
  i3BoGr: {
    longURL: "http://www.google.com",
    userID: "aJ481W"
  }
};

const analytics = {
  clickCount: {
    // url_id: number of clicks
  },
  uniqueVisitors: {
    //  url_id: { user_id: number of visits }
  },
  visitorLog: {
    //  visitor_id: date of visit
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

//  ------ CRUDS ------

//  --- HOME PAGE ---
app.get("/", (req, res) => {
  if (req.session.user_id === undefined) {
    res.redirect("/login");
    return;
  }
  res.redirect("/urls");
});


//  --- URLs JSON ---
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


//  --- URLS ---
app.get("/urls", (req, res) => {

  if (req.session.user_id === undefined) {
    res.send("<html><body>Please log in to view your shortened URLs</body></html>");
    res.redirect("/login");
    return;
  }

  const templateVars = {
    user: users[req.session.user_id],
    clickCount: analytics.clickCount,
    uniqueVisitors: analytics.uniqueVisitors,
    urls: filter2DObject(urlDatabase, "userID", req.session.user_id),
  };

  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {

  if (req.session.user_id === undefined) {
    res.send("<html><body>Please log in to shorten a URL</body></html>\n");
    res.redirect("/login");
    return;
  }

  let newGeneratedID = generateRandomString();
  urlDatabase[newGeneratedID] = { longURL: req.body.longURL, userID: req.session.user_id, creationDate: new Date() };

  res.redirect(`/urls/${newGeneratedID}`);
});


//  --- URLS/NEW ---
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };

  if (req.session.user_id === undefined) {
    res.redirect("/login");
    return;
  }

  res.render("urls_new", templateVars);
});


//  --- URLS/:ID ---
app.get("/urls/:id", (req, res) => {

  if (req.session.user_id === undefined) {
    res.send("<html><body>Please log in to view and edit short URLs</body></html>");
    return;
  }

  if (urlDatabase[req.params.id] === undefined) {
    res.send(`<html><body>Short URL ${req.params.id} does not exist</body></html>`);
    return;
  }

  if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.send("<html><body>This is URL does not belong to you.</body></html>");
    return;
  }

  let uniqueVisitorCount = 0;

  if (analytics.uniqueVisitors[req.params.id] !== undefined) {
    uniqueVisitorCount = Object.keys(analytics.uniqueVisitors[req.params.id]).length;
  }

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session.user_id],
    clickCount: analytics.clickCount[req.params.id],
    uniqueVisitors: uniqueVisitorCount,
    visitorEvents: analytics.visitorLog,
    creationDate: urlDatabase[req.params.id].creationDate,
  };

  if (!urlDatabase.hasOwnProperty(req.params.id)) {
    res.send("<html><body>Specified shortened URL does not exist</body></html>");
    return;
  }

  res.render("urls_show", templateVars);
});

app.put("/urls/:id", (req, res) => {
  if (req.session.user_id === undefined) {
    res.send("<html><body>If this URL belongs to you, please log in to view it.</body></html>");
    return;
  }

  if (urlDatabase[req.params.id] === undefined) {
    res.send("<html><body>That URL does not exist.</body></html>");
    return;
  }

  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    res.send("<html><body>That URL does not belong to you.</body></html>");
    return;
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  urlDatabase[req.params.id].creationDate = new Date();
  res.redirect("/urls");
});


//  --- URLS/:ID/EDIT ---
app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});


//  --- URLS/ID/DELETE ---
app.delete("/urls/:id/delete", (req, res) => {
  if (req.session.user_id === undefined) {
    res.send("<html><body>If this URL belongs to you, please log in to delete it.</body></html>");
    return;
  }

  if (urlDatabase[req.params.id] === undefined) {
    res.send("<html><body>That URL does not exist.</body></html>");
    return;
  }

  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    res.send("<html><body>That URL does not belong to you.</body></html>");
    return;
  }

  delete(urlDatabase[req.params.id]);
  res.redirect("/urls");
});


//  --- U/ID ---
app.get("/u/:id", (req, res) => {

  if (urlDatabase[req.params.id] === undefined) {
    res.send(`<html><body>Shortened URL ${req.params.id} does not exist</body></html>`);
    return;
  }

  // COUNT TOTAL CLICKS
  if (analytics.clickCount[req.params.id] === undefined) {
    analytics.clickCount[req.params.id] = 0;
  }
  
  analytics.clickCount[req.params.id] ++;

  //  COUNT UNIQUE VISITORS
  if (analytics.uniqueVisitors[req.params.id] === undefined) {
    analytics.uniqueVisitors[req.params.id] = {};
  }
  if (analytics.uniqueVisitors[req.params.id][req.session.user_id] === undefined) {
    analytics.uniqueVisitors[req.session.user_id] = 0;
  }

  analytics.uniqueVisitors[req.params.id][req.session.user_id] ++;

  //  TIMESTAMP OF USAGE AND VISITOR ID
  let visitorID = "visitorID_" + generateRandomString();

  analytics.visitorLog[visitorID] = new Date();

  res.redirect(urlDatabase[req.params.id].longURL);
});


//  --- REGISTER ---
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id]
  };
  
  if (req.session.user_id !== undefined) {
    res.redirect("urls");
    return;
  }

  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const newUserRandomID = generateRandomString();
  const newUserEmail = req.body.email;
  const newUserPassword = bcrypt.hashSync(req.body.password, 10);

  if (!req.body.email || !req.body.password) {
    res.send("<html><body>Username and password must both have entries</body></html>");
    return;
  }

  if (keyValueLookup(newUserEmail, "email", users)) {
    console.log("already exists", keyValueLookup(newUserEmail, "email", users));
    res.send("<html><body>Entered username already exists</body></html>");
    return;
  }

  if (!keyValueLookup(newUserEmail, "email", users) && newUserEmail && newUserPassword) {
    users[newUserRandomID] = { id: newUserRandomID, email: newUserEmail, password: newUserPassword };
    req.session.user_id = newUserRandomID;
    res.redirect("urls");
  }
});


//  --- LOGIN ---
app.get("/login", (req, res) => {
  if (req.session.user_id !== undefined) {
    res.redirect("urls");
    return;
  }

  // pass through undefined if no current session
  const templateVars = {
    user: undefined
  };

  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const valueLookup = keyValueLookup(userEmail, 'email', users);

  if (!valueLookup) {
    //  email does not exist in users object
    res.send("<html><body>No record of entered username</body></html>");
    return;
  }

  //  email exists in users object but password does not match
  if (!bcrypt.compareSync(userPassword, valueLookup.password)) {
    res.send("<html><body>Incorrect password</body></html>");
    return;
  }

  // email exists and password matches
  req.session.user_id = valueLookup.id;
  res.redirect("urls");

});


//  --- LOGOUT ---
app.post("/logout", (req, res) => {
  req.session = null;  // kill session on logout
  res.redirect("login");
});


//  Start server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});