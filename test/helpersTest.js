const { assert } = require('chai');

const { keyValueLookup } = require('../helpers');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe("#keyValueLookup", () => {
  it("should return a user with valid email", () => {
    const userKey = keyValueLookup("user@example.com", "email", testUsers);
    const expectedUserID = "userRandomID";
    assert.strictEqual(userKey.id, expectedUserID);
  });
  it("should return undefined if email is not in object", () => {
    const userKey = keyValueLookup("notauser@example.com", "email", testUsers);
    const expectedUserID = undefined;
    assert.strictEqual(userKey, expectedUserID);
  });
});