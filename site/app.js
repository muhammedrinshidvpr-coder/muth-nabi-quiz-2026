import { SUBMISSION_ENDPOINT } from "./config.js";
import { validateRegistration } from "./validation.js";

const QUIZ_START = Date.parse("2026-10-05T19:00:00+05:30");
const form = document.querySelector("#registration-form");
const message = document.querySelector("#form-message");
const submitButton = document.querySelector("#submit-button");
const iframe = document.querySelector("#submission-frame");
const requestIdInput = document.querySelector("#request-id");
const successPanel = document.querySelector("#success-panel");
const countdownNote = document.querySelector("#countdown-note");

function tickCountdown() {
  const remaining = Math.max(0, Math.ceil((QUIZ_START - Date.now()) / 1000));
  const units = [
    ["days", Math.floor(remaining / 86400)],
    ["hours", Math.floor(remaining / 3600) % 24],
    ["minutes", Math.floor(remaining / 60) % 60],
    ["seconds", remaining % 60],
  ];
  units.forEach(([id, value]) => {
    document.getElementById(id).textContent = String(value).padStart(2, "0");
  });
  if (remaining === 0) countdownNote.textContent = "The quiz starts now";
}

tickCountdown();
window.setInterval(tickCountdown, 1000);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  message.textContent = "";

  const values = Object.fromEntries(new FormData(form).entries());
  if (values.website) return;

  const result = validateRegistration(values);
  if (!result.ok) {
    message.textContent = result.message;
    return;
  }
  if (!SUBMISSION_ENDPOINT) {
    message.textContent = "Registration is not connected yet. The organizer must finish the Google Sheet setup before accepting entries.";
    return;
  }

  requestIdInput.value = crypto.randomUUID();
  form.action = SUBMISSION_ENDPOINT;
  submitButton.disabled = true;
  submitButton.textContent = "Sending registration…";
  form.dataset.requestId = requestIdInput.value;
  form.submit();
});

window.addEventListener("message", (event) => {
  if (event.source !== iframe.contentWindow) return;
  const result = event.data;
  if (!result || result.type !== "muth-quiz-registration" || result.requestId !== form.dataset.requestId) return;

  submitButton.disabled = false;
  submitButton.innerHTML = 'Complete registration <span aria-hidden="true">↗</span>';
  if (result.ok) {
    form.hidden = true;
    successPanel.hidden = false;
    successPanel.focus();
  } else {
    message.textContent = result.message || "We could not save your registration. Please try again.";
    submitButton.focus();
  }
});
