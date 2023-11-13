const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});


app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  let newGeneratedID = generateRandomString();
  urlDatabase[newGeneratedID] = req.body.longURL;
  res.redirect(`/urls/${newGeneratedID}`);
});

app.post("/urls/:id/delete", (req, res) => {
  console.log(req.params.id, urlDatabase);
  delete(urlDatabase[req.params.id]);
  res.redirect("/urls");
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