import test from "node:test";
import assert from "node:assert/strict";
import { validateRegistration } from "../site/validation.js";

const validRegistration = {
  name: "  Amina Student ",
  number: "+91 98765 43210",
  email: "amina@example.com",
  department: "Computer Science & Engineering",
  className: "M5A",
  gender: "Female",
  joinedWhatsApp: "yes",
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

test("rejects invalid contact details and values outside the dropdown options", () => {
  assert.equal(validateRegistration({ ...validRegistration, number: "call me" }).ok, false);
  assert.equal(validateRegistration({ ...validRegistration, email: "not-an-email" }).ok, false);
  assert.equal(validateRegistration({ ...validRegistration, gender: "Other" }).ok, false);
  assert.equal(validateRegistration({ ...validRegistration, department: "Unlisted department" }).ok, false);
});

test("requires a WhatsApp group join confirmation", () => {
  const result = validateRegistration({ ...validRegistration, joinedWhatsApp: "" });

  assert.equal(result.ok, false);
  assert.match(result.message, /join the whatsapp group/i);
});
