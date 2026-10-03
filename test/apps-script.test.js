import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const appsScriptSource = await readFile(new URL("../apps-script/Code.gs", import.meta.url), "utf8");

function createAppsScriptContext() {
  const rows = [];
  const sheet = {
    getLastRow: () => rows.length,
    appendRow: (row) => rows.push(row),
    setFrozenRows: () => {},
    getRange: () => ({ setValues: (values) => rows.push(...values) }),
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
  department: "Computer Science",
  className: "M5A",
  gender: "Female",
};

test("Apps Script saves valid registrations and confirms the matching request", () => {
  const { context, rows } = createAppsScriptContext();
  const response = context.doPost({ parameter: validParameters }).getContent();

  assert.equal(rows.length, 2);
  assert.deepEqual(Array.from(rows[0]), ["Submitted At", "Name", "Number", "Email", "Department", "Class", "Gender"]);
  assert.deepEqual(Array.from(rows[1].slice(1)), ["Amina Student", "+91 98765 43210", "amina@example.com", "Computer Science", "M5A", "Female"]);
  assert.match(response, /"requestId":"request-123"/);
  assert.match(response, /"ok":true/);
});

test("Apps Script rejects invalid data without adding a registration row", () => {
  const { context, rows } = createAppsScriptContext();
  const response = context.doPost({ parameter: { ...validParameters, email: "bad-email" } }).getContent();

  assert.equal(rows.length, 0);
  assert.match(response, /"ok":false/);
});
