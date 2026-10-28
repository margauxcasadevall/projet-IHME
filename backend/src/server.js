import "dotenv/config";
import express from "express";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pool, initializeDatabase } from "./db.js";
import { initializeDemoAccount, initializeSampleData } from "./demo.js";
import {
  clearSessionCookie,
  initializeSessionSecret,
  requireAuth,
  setSessionCookie
} from "./auth.js";
import {
  isFutureDateTime,
  validateLogin,
  validateOuting,
  validateRegistration
} from "./validation.js";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const hasPostgresSettings = Boolean(
  process.env.PGHOST && process.env.PGDATABASE && process.env.PGUSER
);
if (!hasDatabaseUrl && !hasPostgresSettings) {
  throw new Error("Configurez DATABASE_URL ou les variables PGHOST, PGDATABASE et PGUSER.");
}
const app = express();
const port = Number(process.env.PORT || 3000);
const frontendDirectory = fileURLToPath(new URL("../../frontend/dist/", import.meta.url));
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Trop de tentatives. Réessayez dans quelques minutes." }
});

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "2200kb" }));
app.use(cookieParser());
app.use("/api", (_request, response, next) => {
  response.set("Cache-Control", "no-store");
  next();
});

app.get("/api/health", async (_request, response, next) => {
  try {
    await pool.query("SELECT 1");
    response.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/register", authLimiter, async (request, response, next) => {
  const validation = validateRegistration(request.body);
  if (validation.error) return response.status(400).json({ error: validation.error });

  try {
    const { fullName, email, password } = validation.value;
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, email`,
      [fullName, email, passwordHash]
    );
    const user = result.rows[0];
    setSessionCookie(response, user);
    return response.status(201).json({ user: { id: user.id, fullName: user.full_name, email: user.email } });
  } catch (error) {
    if (error.code === "23505") {
      return response.status(409).json({ error: "Un compte utilise déjà cette adresse e-mail." });
    }
    return next(error);
  }
});

app.post("/api/auth/login", authLimiter, async (request, response, next) => {
  const validation = validateLogin(request.body);
  if (validation.error) return response.status(400).json({ error: validation.error });

  try {
    const { email, password } = validation.value;
    const result = await pool.query(
      "SELECT id, full_name, email, password_hash FROM users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;
    if (!passwordMatches) {
      return response.status(401).json({ error: "Adresse e-mail ou mot de passe incorrect." });
    }
    setSessionCookie(response, user);
    return response.json({ user: { id: user.id, fullName: user.full_name, email: user.email } });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/auth/logout", (_request, response) => {
  clearSessionCookie(response);
  response.status(204).end();
});

app.get("/api/auth/me", requireAuth, async (request, response, next) => {
  try {
    const result = await pool.query(
      "SELECT id, full_name, email FROM users WHERE id = $1",
      [request.user.id]
    );
    const user = result.rows[0];
    if (!user) {
      clearSessionCookie(response);
      return response.status(401).json({ error: "Votre session n’est plus valide." });
    }
    return response.json({ user: { id: user.id, fullName: user.full_name, email: user.email } });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/outings", requireAuth, async (request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.organizer_id, o.title, o.activity, o.route_description,
              o.route_url, o.meeting_place, o.meeting_maps_url, o.gpx_url,
              (o.gpx_content IS NOT NULL) AS gpx_is_uploaded,
              o.elevation_gain_m, o.elevation_loss_m,
              o.distance_km, o.event_date, o.start_time,
              o.average_speed, o.max_participants, o.created_at,
              u.full_name AS organizer_name,
              COUNT(p.user_id)::int AS participant_count,
              BOOL_OR(p.user_id = $1) AS user_is_joined
       FROM outings o
       JOIN users u ON u.id = o.organizer_id
       LEFT JOIN outing_participants p ON p.outing_id = o.id
       WHERE o.event_date >= CURRENT_DATE
       GROUP BY o.id, u.full_name
       ORDER BY o.event_date ASC, o.start_time ASC`,
      [request.user.id]
    );
    return response.json({ outings: result.rows });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/outings/:id/gpx", requireAuth, async (request, response, next) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return response.status(400).json({ error: "Sortie invalide." });
  }
  try {
    const result = await pool.query(
      "SELECT gpx_content FROM outings WHERE id = $1 AND gpx_content IS NOT NULL",
      [id]
    );
    if (result.rowCount === 0) {
      return response.status(404).json({ error: "Aucun fichier GPX n’est associé à cette sortie." });
    }
    return response
      .type("application/gpx+xml")
      .attachment("trace.gpx")
      .send(result.rows[0].gpx_content);
  } catch (error) {
    return next(error);
  }
});

app.post("/api/outings", requireAuth, async (request, response, next) => {
  const validation = validateOuting(request.body);
  if (validation.error) return response.status(400).json({ error: validation.error });

  let client;
  try {
    client = await pool.connect();
    const outing = validation.value;
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO outings
         (organizer_id, title, activity, route_description, route_url, meeting_place,
          meeting_maps_url, gpx_url, gpx_content, elevation_gain_m, elevation_loss_m,
          distance_km, event_date, start_time, average_speed, max_participants)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING id`,
      [
        request.user.id,
        outing.title,
        outing.activity,
        outing.routeDescription,
        outing.routeUrl,
        outing.meetingPlace,
        outing.meetingMapsUrl,
        outing.gpxUrl,
        outing.gpxContent,
        outing.elevationGainM,
        outing.elevationLossM,
        outing.distanceKm,
        outing.date,
        outing.time,
        outing.averageSpeed,
        outing.maxParticipants
      ]
    );
    await client.query(
      "INSERT INTO outing_participants (outing_id, user_id) VALUES ($1, $2)",
      [result.rows[0].id, request.user.id]
    );
    await client.query("COMMIT");
    return response.status(201).json({ id: result.rows[0].id });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(rollbackError);
      }
    }
    return next(error);
  } finally {
    client?.release();
  }
});

app.patch("/api/outings/:id", requireAuth, async (request, response, next) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return response.status(400).json({ error: "Sortie invalide." });
  }
  const validation = validateOuting(request.body);
  if (validation.error) return response.status(400).json({ error: validation.error });

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const existing = await client.query(
      "SELECT id FROM outings WHERE id = $1 AND organizer_id = $2 FOR UPDATE",
      [id, request.user.id]
    );
    if (existing.rowCount === 0) {
      await client.query("ROLLBACK");
      return response.status(404).json({ error: "Sortie introuvable ou vous n’en êtes pas l’organisateur." });
    }
    const participants = await client.query(
      "SELECT COUNT(*)::int AS count FROM outing_participants WHERE outing_id = $1",
      [id]
    );
    const outing = validation.value;
    if (outing.maxParticipants < participants.rows[0].count) {
      await client.query("ROLLBACK");
      return response.status(409).json({ error: "La capacité ne peut pas être inférieure au nombre d’inscrits." });
    }
    await client.query(
      `UPDATE outings
       SET title = $1, activity = $2, route_description = $3, route_url = $4,
           meeting_place = $5, meeting_maps_url = $6, gpx_url = $7,
           gpx_content = $8, elevation_gain_m = $9, elevation_loss_m = $10,
           distance_km = $11, event_date = $12, start_time = $13,
           average_speed = $14, max_participants = $15
       WHERE id = $16`,
      [
        outing.title,
        outing.activity,
        outing.routeDescription,
        outing.routeUrl,
        outing.meetingPlace,
        outing.meetingMapsUrl,
        outing.gpxUrl,
        outing.gpxContent,
        outing.elevationGainM,
        outing.elevationLossM,
        outing.distanceKm,
        outing.date,
        outing.time,
        outing.averageSpeed,
        outing.maxParticipants,
        id
      ]
    );
    await client.query("COMMIT");
    return response.status(204).end();
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(rollbackError);
      }
    }
    return next(error);
  } finally {
    client?.release();
  }
});

app.delete("/api/outings/:id", requireAuth, async (request, response, next) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return response.status(400).json({ error: "Sortie invalide." });
  }
  try {
    const result = await pool.query(
      "DELETE FROM outings WHERE id = $1 AND organizer_id = $2",
      [id, request.user.id]
    );
    if (result.rowCount === 0) {
      return response.status(404).json({ error: "Sortie introuvable ou vous n’en êtes pas l’organisateur." });
    }
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

app.post("/api/outings/:id/participants", requireAuth, async (request, response, next) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return response.status(400).json({ error: "Sortie invalide." });
  }

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const outingResult = await client.query(
      `SELECT id, max_participants, event_date::text AS event_date,
              TO_CHAR(start_time, 'HH24:MI') AS start_time
       FROM outings WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (outingResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return response.status(404).json({ error: "Cette sortie n’est plus disponible." });
    }
    if (!isFutureDateTime(
      outingResult.rows[0].event_date,
      outingResult.rows[0].start_time,
      request.body?.timezoneOffsetMinutes
    )) {
      await client.query("ROLLBACK");
      return response.status(409).json({ error: "Cette sortie a déjà commencé ou la date est invalide." });
    }
    const existing = await client.query(
      "SELECT 1 FROM outing_participants WHERE outing_id = $1 AND user_id = $2",
      [id, request.user.id]
    );
    if (existing.rowCount > 0) {
      await client.query("ROLLBACK");
      return response.status(409).json({ error: "Vous êtes déjà inscrit à cette sortie." });
    }
    const count = await client.query(
      "SELECT COUNT(*)::int AS count FROM outing_participants WHERE outing_id = $1",
      [id]
    );
    if (count.rows[0].count >= outingResult.rows[0].max_participants) {
      await client.query("ROLLBACK");
      return response.status(409).json({ error: "Cette sortie est complète." });
    }
    await client.query(
      "INSERT INTO outing_participants (outing_id, user_id) VALUES ($1, $2)",
      [id, request.user.id]
    );
    await client.query("COMMIT");
    return response.status(201).json({ message: "Inscription confirmée." });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(rollbackError);
      }
    }
    return next(error);
  } finally {
    client?.release();
  }
});

app.delete("/api/outings/:id/participants/me", requireAuth, async (request, response, next) => {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return response.status(400).json({ error: "Sortie invalide." });
  }
  try {
    const organizer = await pool.query(
      "SELECT organizer_id FROM outings WHERE id = $1",
      [id]
    );
    if (organizer.rowCount === 0) {
      return response.status(404).json({ error: "Sortie introuvable." });
    }
    if (Number(organizer.rows[0].organizer_id) === request.user.id) {
      return response.status(409).json({ error: "L’organisateur ne peut pas annuler sa propre participation." });
    }
    const result = await pool.query(
      "DELETE FROM outing_participants WHERE outing_id = $1 AND user_id = $2",
      [id, request.user.id]
    );
    if (result.rowCount === 0) {
      return response.status(404).json({ error: "Vous n’êtes pas inscrit à cette sortie." });
    }
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

app.use(express.static(frontendDirectory));
app.get(/^(?!\/api(?:\/|$)).*/, (_request, response, next) => {
  response.sendFile("index.html", { root: frontendDirectory }, (error) => {
    if (error) next(error);
  });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  if (response.headersSent) return;
  if (error.type === "entity.parse.failed") {
    return response.status(400).json({ error: "Le corps de la requête doit être un JSON valide." });
  }
  if (error.type === "entity.too.large") {
    return response.status(413).json({ error: "La requête est trop volumineuse." });
  }
  return response.status(500).json({ error: "Une erreur interne est survenue." });
});

await initializeDatabase();
await initializeDemoAccount();
await initializeSampleData();
await initializeSessionSecret();
app.listen(port, "0.0.0.0", () => {
  console.log(`Application projet IHME prête sur le port ${port}.`);
});
