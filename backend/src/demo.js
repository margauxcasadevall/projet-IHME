import bcrypt from "bcryptjs";
import { pool } from "./db.js";

export const demoCredentials = {
  fullName: "Compte de démonstration",
  email: "demo@zou.fr",
  password: "ZouDemo2026!"
};

export async function initializeDemoAccount(database = pool) {
  const passwordHash = await bcrypt.hash(demoCredentials.password, 12);
  await database.query(
    `INSERT INTO users (full_name, email, password_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE
     SET full_name = EXCLUDED.full_name,
         password_hash = EXCLUDED.password_hash`,
    [demoCredentials.fullName, demoCredentials.email, passwordHash]
  );
}
