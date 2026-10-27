import { randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";

const cookieName = "ihme_session";
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

export async function initializeSessionSecret(database = pool) {
  const configuredSecret = process.env.JWT_SECRET;
  if (configuredSecret !== undefined) {
    if (configuredSecret.length < 32) {
      throw new Error("JWT_SECRET doit contenir au moins 32 caractères.");
    }
    return;
  }

  await database.query(`
    CREATE TABLE IF NOT EXISTS app_secrets (
      name TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  await database.query(
    `INSERT INTO app_secrets (name, value)
     VALUES ($1, $2)
     ON CONFLICT (name) DO NOTHING`,
    ["jwt_secret", randomBytes(32).toString("base64url")]
  );
  const result = await database.query(
    "SELECT value FROM app_secrets WHERE name = $1",
    ["jwt_secret"]
  );
  const secret = result.rows[0]?.value;
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("Impossible d’initialiser la clé de session depuis PostgreSQL.");
  }
  process.env.JWT_SECRET = secret;
}

function sessionOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: sessionDurationMs,
    path: "/"
  };
}

export function setSessionCookie(response, user) {
  const token = jwt.sign(
    { sub: String(user.id) },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  response.cookie(cookieName, token, sessionOptions());
}

export function clearSessionCookie(response) {
  response.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

export function requireAuth(request, response, next) {
  const token = request.cookies[cookieName];
  if (!token) {
    return response.status(401).json({ error: "Connectez-vous pour continuer." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    request.user = { id: Number(payload.sub) };
    return next();
  } catch {
    clearSessionCookie(response);
    return response.status(401).json({ error: "Votre session a expiré. Reconnectez-vous." });
  }
}
