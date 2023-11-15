const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    user: users[req.cookies["userID"]],
    urls: urlDatabase,
    // ... any other vars

  };
  console.log("/urls", templateVars.user);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies["userID"]],
  };
  console.log("/urls/new", templateVars.user);
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["userID"]]
  };
  console.log("/urls/:id", templateVars.user);
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies["userID"]]
  };
  console.log("/register", templateVars.user);
  res.render("register", templateVars);
});


app.post("/register", (req, res) => {
  const newUserRandomID = generateRandomString();
  const newUserEmail = req.body.email;
  const newUserPassword = req.body.password;
  users[newUserRandomID] = { id: newUserRandomID, email: newUserEmail, password: newUserPassword };
  res.cookie("userID", newUserRandomID);
  console.log(users);
  res.redirect("urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");  // change to userID
  res.redirect("urls");
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("urls");
});

app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete(urlDatabase[req.params.id]);
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/urls", (req, res) => {
  let newGeneratedID = generateRandomString();
  urlDatabase[newGeneratedID] = req.body.longURL;
  res.redirect(`/urls/${newGeneratedID}`);
});

app.get("/u/:id", (req, res) => {
  res.redirect(urlDatabase[req.params.id]);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

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