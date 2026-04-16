import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const outputPath = path.join(rootDir, "mail.config.js");

function decodeEnvValue(rawValue) {
  let value = rawValue.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");
}

function parseEnv(source) {
  return source.split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return acc;
    }

    const equalIndex = line.indexOf("=");
    if (equalIndex === -1) {
      return acc;
    }

    const key = line.slice(0, equalIndex).trim();
    const rawValue = line.slice(equalIndex + 1);

    if (!key) {
      return acc;
    }

    acc[key] = decodeEnvValue(rawValue);
    return acc;
  }, {});
}

function pickString(env, key) {
  return typeof env[key] === "string" ? env[key] : "";
}

function pickList(env, key) {
  return pickString(env, key)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

const fileEnv = fs.existsSync(envPath)
  ? parseEnv(fs.readFileSync(envPath, "utf8"))
  : {};
const env = {
  ...fileEnv,
  ...process.env,
};

const config = {
  appText: {
    documentTitle: pickString(env, "APP_TITLE"),
    heading: pickString(env, "APP_HEADING"),
    subtitle: pickString(env, "APP_SUBTITLE"),
    hint: pickString(env, "APP_HINT"),
  },
  defaults: {
    name: pickString(env, "DEFAULT_NAME"),
    depart: pickString(env, "DEFAULT_DEPART"),
    title: pickString(env, "DEFAULT_TITLE"),
    mobile: pickString(env, "DEFAULT_MOBILE"),
    phone: pickString(env, "DEFAULT_PHONE"),
    email: pickString(env, "DEFAULT_EMAIL"),
  },
  fixed: {
    logo: pickString(env, "LOGO_URL"),
    qr: pickString(env, "QR_URL"),
    icon1: pickString(env, "ICON1_URL"),
    icon2: pickString(env, "ICON2_URL"),
    icon3: pickString(env, "ICON3_URL"),
    disclaimerImage: pickString(env, "DISCLAIMER_IMAGE_URL"),
    company: pickString(env, "COMPANY_NAME"),
    website: pickString(env, "WEBSITE"),
    fax: pickString(env, "FAX"),
    address1: pickString(env, "ADDRESS1"),
    address2: pickString(env, "ADDRESS2"),
    icon1Text: pickString(env, "ICON1_TEXT"),
    icon2Text: pickString(env, "ICON2_TEXT"),
    icon3Text: pickString(env, "ICON3_TEXT"),
    disclaimer: pickString(env, "DISCLAIMER"),
  },
  departmentOptions: pickList(env, "DEPARTMENT_OPTIONS"),
};

const fileBody = `window.MAIL_CONFIG = ${JSON.stringify(config, null, 2)};\n`;
fs.writeFileSync(outputPath, fileBody, "utf8");

if (fs.existsSync(envPath)) {
  console.log(
    `Generated ${path.basename(outputPath)} from ${path.basename(envPath)}.`,
  );
} else {
  console.log(
    `Generated ${path.basename(outputPath)} from environment variables.`,
  );
}
