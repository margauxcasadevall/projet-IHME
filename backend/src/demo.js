import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
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

const sampleProfiles = [
  { fullName: "Camille Martin", email: "camille.martin@example.test" },
  { fullName: "Inès Benali", email: "ines.benali@example.test" },
  { fullName: "Léa Fournier", email: "lea.fournier@example.test" },
  { fullName: "Hugo Bernard", email: "hugo.bernard@example.test" },
  { fullName: "Sami Diallo", email: "sami.diallo@example.test" }
];

const sampleOutings = [
  {
    title: "Randonnée aux Calanques",
    activity: "hiking",
    organizer: "camille.martin@example.test",
    distanceKm: 12,
    date: "2026-11-07",
    time: "08:30",
    averageSpeed: 4.5,
    maxParticipants: 6,
    participants: [
      "camille.martin@example.test",
      "ines.benali@example.test",
      "hugo.bernard@example.test",
      "sami.diallo@example.test"
    ]
  },
  {
    title: "Course au parc Borély",
    activity: "running",
    organizer: "ines.benali@example.test",
    distanceKm: 7,
    date: "2026-11-08",
    time: "09:00",
    averageSpeed: 6,
    maxParticipants: 4,
    participants: [
      "camille.martin@example.test",
      "ines.benali@example.test",
      "lea.fournier@example.test"
    ]
  },
  {
    title: "Trail de la Sainte-Victoire",
    activity: "trail",
    organizer: "lea.fournier@example.test",
    distanceKm: 18,
    date: "2026-11-14",
    time: "07:30",
    averageSpeed: 7,
    maxParticipants: 5,
    participants: [
      "ines.benali@example.test",
      "lea.fournier@example.test",
      "hugo.bernard@example.test",
      "sami.diallo@example.test"
    ]
  },
  {
    title: "Vélo sur la Côte Bleue",
    activity: "cycling",
    organizer: "hugo.bernard@example.test",
    distanceKm: 35,
    date: "2026-11-15",
    time: "08:00",
    averageSpeed: 20,
    maxParticipants: 6,
    participants: [
      "camille.martin@example.test",
      "lea.fournier@example.test",
      "hugo.bernard@example.test",
      "sami.diallo@example.test"
    ]
  },
  {
    title: "Randonnée au Garlaban",
    activity: "hiking",
    organizer: "sami.diallo@example.test",
    distanceKm: 10,
    date: "2026-11-21",
    time: "09:00",
    averageSpeed: 4,
    maxParticipants: 3,
    participants: [
      "camille.martin@example.test",
      "hugo.bernard@example.test",
      "sami.diallo@example.test"
    ]
  },
  {
    title: "Footing au Prado",
    activity: "running",
    organizer: "camille.martin@example.test",
    distanceKm: 5,
    date: "2026-11-21",
    time: "10:00",
    averageSpeed: 5.5,
    maxParticipants: 5,
    participants: [
      "camille.martin@example.test",
      "ines.benali@example.test",
      "lea.fournier@example.test",
      "hugo.bernard@example.test",
      "sami.diallo@example.test"
    ]
  },
  {
    title: "Trail du massif de l’Étoile",
    activity: "trail",
    organizer: "ines.benali@example.test",
    distanceKm: 14,
    date: "2026-11-22",
    time: "08:00",
    averageSpeed: 6.5,
    maxParticipants: 4,
    participants: [
      "ines.benali@example.test",
      "lea.fournier@example.test",
      "sami.diallo@example.test"
    ]
  }
];

export async function initializeSampleData(database = pool) {
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const seed = await client.query(
      `INSERT INTO app_seeds (name)
       VALUES ($1)
       ON CONFLICT (name) DO NOTHING
       RETURNING name`,
      ["sample_outdoor_data_v1"]
    );
    if (seed.rowCount === 0) {
      await client.query("COMMIT");
      return;
    }

    const profileIds = new Map();
    for (const profile of sampleProfiles) {
      const passwordHash = await bcrypt.hash(randomBytes(32).toString("base64url"), 12);
      await client.query(
        `INSERT INTO users (full_name, email, password_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO NOTHING`,
        [profile.fullName, profile.email, passwordHash]
      );
      const result = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [profile.email]
      );
      if (result.rowCount !== 1) {
        throw new Error(`Impossible de retrouver le profil fictif ${profile.email}.`);
      }
      profileIds.set(profile.email, result.rows[0].id);
    }

    for (const outing of sampleOutings) {
      const result = await client.query(
        `INSERT INTO outings
           (organizer_id, title, activity, route_description, meeting_place,
            distance_km, event_date, start_time, average_speed, max_participants)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id`,
        [
          profileIds.get(outing.organizer),
          outing.title,
          outing.activity,
          "Données fictives de démonstration. Point de rendez-vous à préciser.",
          "À préciser",
          outing.distanceKm,
          outing.date,
          outing.time,
          outing.averageSpeed,
          outing.maxParticipants
        ]
      );
      for (const email of outing.participants) {
        await client.query(
          "INSERT INTO outing_participants (outing_id, user_id) VALUES ($1, $2)",
          [result.rows[0].id, profileIds.get(email)]
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error(rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}
