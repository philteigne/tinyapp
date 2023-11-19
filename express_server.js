/* eslint-disable no-prototype-builtins */
const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(cookieParser());

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

app.use(express.urlencoded({ extended: true }));

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

  if (req.cookies["userID"] === undefined) {
    res.send("<html><body>Please log in to view your shortened URLs</body></html>\n");
    res.redirect("/login");
    return;
  }

  const templateVars = {
    user: users[req.cookies["userID"]],
    // ... any other vars
  };

  templateVars.urls = filter2DObject(urlDatabase, "userID", req.cookies["userID"]);

  console.log("/urls", templateVars.user);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["userID"]],
  };

  if (req.cookies["userID"] === undefined) {
    res.redirect("/login");
    return;
  }

  console.log("/urls/new", templateVars.user);
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {

  if (req.cookies["userID"] === undefined) {
    res.redirect("/login");
    return;
  }
  
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.cookies["userID"]]
  };

  if (!urlDatabase.hasOwnProperty(req.params.id)) {
    res.send("<html><body>Specified shortened URL does not exist</body></html>");
    return;
  }
  console.log("/urls/:id", templateVars.user);
  res.render("urls_show", templateVars);
});

//  GET
//  LOGIN AND REGISTER
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["userID"]]
  };
  
  if (req.cookies["userID"] !== undefined) {
    res.redirect("urls");
    return;
  }

  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["userID"]]
  };

  if (req.cookies["userID"] !== undefined) {
    res.redirect("urls");
    return;
  }

  res.render("login", templateVars);
});


//  POST
//  LOGIN AND REGISTER
app.post("/register", (req, res) => {
  const newUserRandomID = generateRandomString();
  const newUserEmail = req.body.email;
  const newUserPassword = req.body.password;

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
    res.cookie("userID", newUserRandomID);
    console.log("users", users);
    res.redirect("urls");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("userID");  // change to userID
  res.redirect("login");
});

app.post("/login", (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;
  const valueLookup = keyValueLookup(userEmail, 'email', users);

  if (!valueLookup) {
    //  email does not exist in users object
    res.sendStatus(403);
  }

  if (valueLookup) {
    //  email exists in users object
    if (valueLookup.password === userPassword) {
      res.cookie("userID", valueLookup.id);
      res.redirect("urls");
    }
    res.sendStatus(403);
  }

});

//  POST
//  URLs
app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete(urlDatabase[req.params.id]);
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls", (req, res) => {

  if (req.cookies["userID"] === undefined) {
    res.send("<html><body>Please log in to shorten a URL</body></html>\n");
    res.redirect("/login");
    return;
  }

  let newGeneratedID = generateRandomString();
  urlDatabase[newGeneratedID] = { longURL: req.body.longURL };

  res.redirect(`/urls/${newGeneratedID}`);
});

app.get("/u/:id", (req, res) => {
  res.redirect(urlDatabase[req.params.id]);
});


//  Start server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//  BUILT IN FUNCTIONS

// return a 6 character long random string of alphanumeric characters
const generateRandomString = () => {
  // establish possible letters
  const possibleCharacters = "abcdefghijklmonpqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomString = "";

  for (let i = 0; i < 6; i++) {
    let possibleCharactersLength = possibleCharacters.length - 1;
    let randomIndex = Math.floor(Math.random() * possibleCharactersLength);

    randomString += possibleCharacters[randomIndex];
  }

  return randomString;
};

//  search through an object's searchProperty values
//  if searchKey is found return key that contains it
//  if not found return null
const keyValueLookup = (searchKey, searchProperty, object) => {
  for (let i in object) {
    if (object[i][searchProperty] === searchKey) {
      return object[i];
    }
  }
  return null;
};

//  search through 2D object for matching key value pair
//  return object containing all matches
const filter2DObject = (object, searchKey, searchKeyValue) => {
  const matchingKeyObject = {};

  const objectKeys = Object.keys(object);
  for (let i of objectKeys) {
    if (object[i][searchKey] === searchKeyValue) {
      matchingKeyObject[i] = object[i];
    }
  }

  return matchingKeyObject;
};
