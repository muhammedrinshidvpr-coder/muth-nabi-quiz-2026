import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const appsScriptSource = await readFile(new URL("../apps-script/Code.gs", import.meta.url), "utf8");

function createAppsScriptContext(initialRows = []) {
  const rows = initialRows.map((row) => [...row]);
  const sheet = {
    getLastRow: () => rows.length,
    appendRow: (row) => rows.push(row),
    setFrozenRows: () => {},
    getRange: (row, column, rowCount, columnCount) => ({
      getValues: () => Array.from({ length: rowCount }, (_, rowOffset) => {
        const values = rows[row - 1 + rowOffset] || [];
        return Array.from({ length: columnCount }, (_, columnOffset) => values[column - 1 + columnOffset] || "");
      }),
      setValues: (values) => values.forEach((newValues, rowOffset) => {
        const rowIndex = row - 1 + rowOffset;
        rows[rowIndex] ||= [];
        newValues.forEach((value, columnOffset) => { rows[rowIndex][column - 1 + columnOffset] = value; });
      }),
    }),
    autoResizeColumns: () => {},
  };
  const spreadsheet = {
    getId: () => "private-sheet-id",
    getSheetByName: (name) => (name === "Registrations" ? sheet : null),
    insertSheet: () => sheet,
  };
  const scriptProperties = new Map([["SPREADSHEET_ID", "private-sheet-id"]]);
  const context = {
    console: { error() {} },
    Date,
    Object,
    String,
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet, openById: () => spreadsheet },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (key) => scriptProperties.get(key) || null,
      setProperty: (key, value) => scriptProperties.set(key, value),
    }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    HtmlService: {
      XFrameOptionsMode: { ALLOWALL: "ALLOWALL" },
      createHtmlOutput: (content) => ({
        getContent: () => content,
        setXFrameOptionsMode() { return this; },
      }),
    },
  };

  vm.runInNewContext(appsScriptSource, context);
  return { context, rows };
}

const validParameters = {
  requestId: "request-123",
  name: "Amina Student",
  number: "+91 98765 43210",
  email: "amina@example.com",
  department: "Computer Science & Engineering",
  className: "M5A",
  gender: "Female",
  joinedWhatsApp: "yes",
};

test("Apps Script saves valid registrations and confirms the matching request", () => {
  const { context, rows } = createAppsScriptContext();
  const response = context.doPost({ parameter: validParameters }).getContent();

  assert.equal(rows.length, 2);
  assert.deepEqual(Array.from(rows[0]), ["Submitted At", "Name", "Number", "Email", "Department", "Class", "Gender", "WhatsApp Joined"]);
  assert.deepEqual(Array.from(rows[1].slice(1)), ["Amina Student", "+91 98765 43210", "amina@example.com", "Computer Science & Engineering", "M5A", "Female", "Yes"]);
  assert.match(response, /"requestId":"request-123"/);
  assert.match(response, /"ok":true/);
});

test("Apps Script rejects invalid data without adding a registration row", () => {
  const { context, rows } = createAppsScriptContext();
  const response = context.doPost({ parameter: { ...validParameters, email: "bad-email" } }).getContent();

  assert.equal(rows.length, 0);
  assert.match(response, /"ok":false/);
});

test("Apps Script requires WhatsApp acknowledgement and the allowed department list", () => {
  const { context, rows } = createAppsScriptContext();
  const noJoinResponse = context.doPost({ parameter: { ...validParameters, joinedWhatsApp: "" } }).getContent();

  assert.equal(rows.length, 0);
  assert.match(noJoinResponse, /"ok":false/);

  const invalidDepartmentResponse = context.doPost({ parameter: { ...validParameters, department: "Unknown" } }).getContent();
  assert.equal(rows.length, 0);
  assert.match(invalidDepartmentResponse, /"ok":false/);
});

test("Apps Script accepts PG as a department", () => {
  const { context, rows } = createAppsScriptContext();
  const response = context.doPost({ parameter: { ...validParameters, department: "PG" } }).getContent();

  assert.equal(rows[1][4], "PG");
  assert.match(response, /"ok":true/);
});

test("Apps Script adds the WhatsApp column without deleting existing registrations", () => {
  const oldHeaders = ["Submitted At", "Name", "Number", "Email", "Department", "Class", "Gender"];
  const existingRegistration = ["previous timestamp", "Existing Student", "+91 90000 00000", "existing@example.com", "Mechanical Engineering", "M3A", "Male"];
  const { context, rows } = createAppsScriptContext([oldHeaders, existingRegistration]);
  const response = context.doPost({ parameter: validParameters }).getContent();

  assert.equal(rows[0][7], "WhatsApp Joined");
  assert.deepEqual(Array.from(rows[1]), existingRegistration);
  assert.equal(rows[2][1], "Amina Student");
  assert.match(response, /"ok":true/);
});
