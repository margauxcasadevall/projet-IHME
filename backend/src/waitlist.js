export async function promoteWaitingList(client, outingId, capacity) {
  const participants = await client.query(
    "SELECT COUNT(*)::int AS count FROM outing_participants WHERE outing_id = $1",
    [outingId]
  );
  const availableSpots = Number(capacity) - participants.rows[0].count;
  if (availableSpots <= 0) return [];

  const promoted = await client.query(
    `WITH next_in_line AS (
       SELECT user_id
       FROM outing_waitlist
       WHERE outing_id = $1
       ORDER BY joined_at ASC, user_id ASC
       LIMIT $2
       FOR UPDATE
     ),
     removed AS (
       DELETE FROM outing_waitlist AS waiting
       USING next_in_line
       WHERE waiting.outing_id = $1
         AND waiting.user_id = next_in_line.user_id
       RETURNING waiting.user_id
     ),
     promoted AS (
       INSERT INTO outing_participants (outing_id, user_id)
       SELECT $1, user_id FROM removed
       RETURNING outing_id, user_id
     ),
     notifications AS (
       INSERT INTO app_notifications (user_id, outing_id, message)
       SELECT promoted.user_id, promoted.outing_id,
              'Une place s’est libérée : vous êtes inscrit·e à « ' || outings.title || ' ».'
       FROM promoted
       JOIN outings ON outings.id = promoted.outing_id
       RETURNING id, user_id, outing_id, message, created_at, read_at
     )
     SELECT notifications.id, notifications.user_id, notifications.outing_id,
            notifications.message, notifications.created_at, notifications.read_at
     FROM notifications`,
    [outingId, availableSpots]
  );
  return promoted.rows;
}
