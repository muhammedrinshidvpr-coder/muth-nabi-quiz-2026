const HEADERS = ["Submitted At", "Name", "Number", "Email", "Department", "Class", "Gender", "WhatsApp Joined"];
const LEGACY_HEADERS = HEADERS.slice(0, -1);
const DEPARTMENT_OPTIONS = [
  "Architecture",
  "Chemical Engineering",
  "Civil Engineering",
  "Computer Science & Engineering",
  "Electrical & Electronics Engineering",
  "Electronics & Communication Engineering",
  "Industrial Instrumentation & Control Engineering",
  "Mechanical Engineering",
  "Other / not listed",
];
const GENDER_OPTIONS = ["Male", "Female"];

function doPost(event) {
  const parameters = (event && event.parameter) || {};
  const requestId = String(parameters.requestId || "");

  try {
    if (parameters.website) throw new Error("Registration could not be accepted. Please try again.");

    const registration = validateRegistration_(parameters);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getRegistrationSheet_();
      sheet.appendRow([
        new Date(),
        registration.name,
        registration.number,
        registration.email,
        registration.department,
        registration.className,
        registration.gender,
        "Yes",
      ]);
    } finally {
      lock.releaseLock();
    }

    return response_(requestId, true, "");
  } catch (error) {
    console.error(error);
    return response_(requestId, false, "We could not save your registration. Please check your details and try again.");
  }
}

function validateRegistration_(parameters) {
  const registration = {
    name: String(parameters.name || "").trim(),
    number: String(parameters.number || "").trim(),
    email: String(parameters.email || "").trim(),
    department: String(parameters.department || "").trim(),
    className: String(parameters.className || "").trim(),
    gender: String(parameters.gender || "").trim(),
    joinedWhatsApp: String(parameters.joinedWhatsApp || "").trim(),
  };

  if (Object.values(registration).some((value) => !value)) throw new Error("Required registration details are missing.");
  if (registration.name.length > 120 || registration.department.length > 120 || registration.className.length > 40) {
    throw new Error("A registration field is too long.");
  }
  if (!/^\+?[0-9() .-]{7,20}$/.test(registration.number)) throw new Error("The mobile number is invalid.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registration.email) || registration.email.length > 254) {
    throw new Error("The email address is invalid.");
  }
  if (!DEPARTMENT_OPTIONS.includes(registration.department)) throw new Error("The department selection is invalid.");
  if (!GENDER_OPTIONS.includes(registration.gender)) throw new Error("The gender selection is invalid.");
  if (registration.joinedWhatsApp !== "yes") throw new Error("Join and confirm the WhatsApp group before registering.");
  return registration;
}

function getRegistrationSheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!spreadsheetId) throw new Error("Run setupRegistrationSheet from the bound spreadsheet before deploying.");
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  const sheet = spreadsheet.getSheetByName("Registrations") || spreadsheet.insertSheet("Registrations");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  } else {
    const existingHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0].map((value) => String(value || "").trim());
    const isBlank = existingHeaders.every((value) => !value);
    const isLegacy = LEGACY_HEADERS.every((header, index) => existingHeaders[index] === header);
    const isCurrent = HEADERS.every((header, index) => existingHeaders[index] === header);
    if (isBlank || isLegacy) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    } else if (!isCurrent) {
      throw new Error("The registration sheet headers do not match. Run setupRegistrationSheet to update them.");
    }
  }
  sheet.setFrozenRows(1);
  return sheet;
}

function response_(requestId, ok, message) {
  const payload = JSON.stringify({
    type: "muth-quiz-registration",
    requestId: requestId,
    ok: ok,
    message: message,
  }).replace(/</g, "\\u003c");

  return HtmlService.createHtmlOutput(
    "<!doctype html><html><head><meta charset=\"utf-8\"></head><body><script>window.parent.postMessage(" + payload + ", '*');</script></body></html>"
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Run this once from the Apps Script editor to verify the bound Sheet and headers.
function setupRegistrationSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("Open this Apps Script from the registration spreadsheet.");
  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", spreadsheet.getId());
  const sheet = spreadsheet.getSheetByName("Registrations") || spreadsheet.insertSheet("Registrations");
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
}
