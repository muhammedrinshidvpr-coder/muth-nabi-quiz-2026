export const DEPARTMENT_OPTIONS = [
  "Architecture",
  "Chemical Engineering",
  "Civil Engineering",
  "Computer Science & Engineering",
  "Electrical & Electronics Engineering",
  "Electronics & Communication Engineering",
  "Industrial Instrumentation & Control Engineering",
  "Mechanical Engineering",
  "PG",
  "Other / not listed",
];

export const GENDER_OPTIONS = ["Male", "Female"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9() .-]{7,20}$/;

export function validateRegistration(values) {
  const cleaned = {
    name: String(values.name ?? "").trim(),
    number: String(values.number ?? "").trim(),
    email: String(values.email ?? "").trim(),
    department: String(values.department ?? "").trim(),
    className: String(values.className ?? "").trim(),
    gender: String(values.gender ?? "").trim(),
    joinedWhatsApp: String(values.joinedWhatsApp ?? "").trim(),
  };

  const studentFields = Object.entries(cleaned)
    .filter(([field]) => field !== "joinedWhatsApp")
    .map(([, value]) => value);
  if (studentFields.some((value) => !value)) {
    return { ok: false, message: "Please complete every required field." };
  }
  if (cleaned.name.length > 120 || cleaned.department.length > 120 || cleaned.className.length > 40) {
    return { ok: false, message: "Please check the length of your name, department, or class." };
  }
  if (!PHONE_PATTERN.test(cleaned.number)) {
    return { ok: false, message: "Enter a valid mobile number, including country code if needed." };
  }
  if (!EMAIL_PATTERN.test(cleaned.email) || cleaned.email.length > 254) {
    return { ok: false, message: "Enter a valid email address." };
  }
  if (!DEPARTMENT_OPTIONS.includes(cleaned.department)) {
    return { ok: false, message: "Select a department from the list." };
  }
  if (!GENDER_OPTIONS.includes(cleaned.gender)) {
    return { ok: false, message: "Select Male or Female." };
  }
  if (cleaned.joinedWhatsApp !== "yes") {
    return { ok: false, message: "Join the WhatsApp group and confirm before registering." };
  }

  return { ok: true, value: cleaned };
}
