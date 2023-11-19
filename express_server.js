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

//  GET
//  HOME PAGE
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//  GET
//  URLs
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {

  if (req.session.user_id === undefined) {
    res.send("<html><body>Please log in to view your shortened URLs</body></html>\n");
    res.redirect("/login");
    return;
  }

  const templateVars = {
    user: users[req.session.user_id],
    // ... any other vars
  };

  templateVars.urls = filter2DObject(urlDatabase, "userID", req.session.user_id);

  console.log("/urls", templateVars.user);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };

  if (req.session.user_id === undefined) {
    res.redirect("/login");
    return;
  }

  console.log("/urls/new", templateVars.user);
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {

  if (req.session.user_id === undefined) {
    res.redirect("/login");
    return;
  }

  if (req.session.user_id !== urlDatabase[req.params.id].userID) {
    res.send("<html><body>This is URL does not belong to you.</body></html>");
  }

  let countCookieReference = `clickCount-${req.params.id}`;

  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session.user_id],
    clickCount: req.session[countCookieReference],
  };

  if (!urlDatabase.hasOwnProperty(req.params.id)) {
    res.send("<html><body>Specified shortened URL does not exist</body></html>");
    return;
  }

  res.render("urls_show", templateVars);
});

//  GET
//  LOGIN AND REGISTER
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


//  POST
//  LOGIN AND REGISTER
app.post("/register", (req, res) => {
  const newUserRandomID = generateRandomString();
  const newUserEmail = req.body.email;
  const newUserPassword = bcrypt.hashSync(req.body.password, 10);

  if (!newUserEmail || !newUserPassword) {
    console.log("empty user or password");
    res.sendStatus(400);
  }

  if (keyValueLookup(newUserEmail, "email", users)) {
    console.log("already exists", keyValueLookup(newUserEmail, "email", users));
    res.sendStatus(400);
  }

  if (!keyValueLookup(newUserEmail, "email", users) && newUserEmail && newUserPassword) {
    users[newUserRandomID] = { id: newUserRandomID, email: newUserEmail, password: newUserPassword };
    req.session.user_id = newUserRandomID;
    console.log("users", users);
    res.redirect("urls");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;  // kill session on logout
  res.redirect("login");
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const valueLookup = keyValueLookup(userEmail, 'email', users);

  if (!valueLookup) {
    //  email does not exist in users object
    res.sendStatus(403);
    return;
  }

  //  email exists in users object but password does not match
  if (!bcrypt.compareSync(userPassword, valueLookup.password)) {
    res.sendStatus(403);
    return;
  }

  // email exists and password matches
  req.session.user_id = valueLookup.id;
  res.redirect("urls");

});

//  POST
//  URLs
app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls", (req, res) => {

  if (req.session.user_id === undefined) {
    res.send("<html><body>Please log in to shorten a URL</body></html>\n");
    res.redirect("/login");
    return;
  }

  let newGeneratedID = generateRandomString();
  urlDatabase[newGeneratedID] = { longURL: req.body.longURL, userID: req.session.user_id };

  res.redirect(`/urls/${newGeneratedID}`);
});

app.get("/u/:id", (req, res) => {
  let linkCookieCountName = `clickCount-${req.params.id}`;
  
  if (req.session[linkCookieCountName] === undefined) {
    req.session[linkCookieCountName] = 0;
  }
  
  req.session[linkCookieCountName] ++;

  res.redirect(urlDatabase[req.params.id].longURL);
});

//  PUT
//  URLs
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
  res.redirect(`/urls/${req.params.id}`);
});

//  DELETE
//  URLs
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



//  Start server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});