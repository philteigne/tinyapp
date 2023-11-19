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

exports.module = { generateRandomString, keyValueLookup, filter2DObject };