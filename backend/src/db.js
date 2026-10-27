import pg from "pg";

const { Pool } = pg;

export const pool = new Pool(
  process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {}
);

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      full_name VARCHAR(80) NOT NULL,
      email VARCHAR(254) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS outings (
      id BIGSERIAL PRIMARY KEY,
      organizer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(120) NOT NULL,
      activity VARCHAR(20) NOT NULL CHECK (activity IN ('hiking', 'running', 'trail', 'cycling')),
      route_description TEXT NOT NULL,
      route_url TEXT,
      meeting_place TEXT NOT NULL DEFAULT '',
      meeting_maps_url TEXT NOT NULL DEFAULT '',
      gpx_url TEXT,
      gpx_content TEXT,
      elevation_gain_m INTEGER CHECK (elevation_gain_m BETWEEN 0 AND 100000),
      elevation_loss_m INTEGER CHECK (elevation_loss_m BETWEEN 0 AND 100000),
      distance_km NUMERIC(7, 2) NOT NULL CHECK (distance_km > 0),
      event_date DATE NOT NULL,
      start_time TIME NOT NULL,
      average_speed NUMERIC(5, 2) NOT NULL CHECK (average_speed > 0),
      max_participants INTEGER NOT NULL CHECK (max_participants > 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE outings ADD COLUMN IF NOT EXISTS meeting_place TEXT NOT NULL DEFAULT '';
    ALTER TABLE outings ADD COLUMN IF NOT EXISTS meeting_maps_url TEXT NOT NULL DEFAULT '';
    ALTER TABLE outings ADD COLUMN IF NOT EXISTS gpx_url TEXT;
    ALTER TABLE outings ADD COLUMN IF NOT EXISTS gpx_content TEXT;
    ALTER TABLE outings ADD COLUMN IF NOT EXISTS elevation_gain_m INTEGER
      CHECK (elevation_gain_m BETWEEN 0 AND 100000);
    ALTER TABLE outings ADD COLUMN IF NOT EXISTS elevation_loss_m INTEGER
      CHECK (elevation_loss_m BETWEEN 0 AND 100000);

    CREATE TABLE IF NOT EXISTS outing_participants (
      outing_id BIGINT NOT NULL REFERENCES outings(id) ON DELETE CASCADE,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (outing_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS outings_event_date_idx ON outings(event_date, start_time);
    CREATE INDEX IF NOT EXISTS outing_participants_user_idx ON outing_participants(user_id);
  `);
}
