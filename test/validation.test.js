import test from "node:test";
import assert from "node:assert/strict";
import { validateRegistration } from "../site/validation.js";

const validRegistration = {
  name: "  Amina Student ",
  number: "+91 98765 43210",
  email: "amina@example.com",
  department: "Computer Science",
  className: "M5A",
  gender: "Prefer not to say",
};

test("accepts a valid registration and trims text fields", () => {
  const result = validateRegistration(validRegistration);

  assert.equal(result.ok, true);
  assert.equal(result.value.name, "Amina Student");
  assert.equal(result.value.className, "M5A");
});

test("rejects incomplete registration fields", () => {
  const result = validateRegistration({ ...validRegistration, department: " " });

  assert.equal(result.ok, false);
  assert.match(result.message, /every required field/i);
});

test("rejects invalid mobile numbers, email addresses, and gender choices", () => {
  assert.equal(validateRegistration({ ...validRegistration, number: "call me" }).ok, false);
  assert.equal(validateRegistration({ ...validRegistration, email: "not-an-email" }).ok, false);
  assert.equal(validateRegistration({ ...validRegistration, gender: "Other" }).ok, false);
});
