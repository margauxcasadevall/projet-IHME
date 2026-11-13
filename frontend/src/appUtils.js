export function formatDate(date, time) {
  const datePart = String(date).slice(0, 10);
  const timePart = String(time).slice(0, 5);
  const parsed = new Date(`${datePart}T${timePart}`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsed);
}

export function timezoneOffsetFor(date, time) {
  return new Date(`${date}T${time}:00`).getTimezoneOffset();
}

export function isOutingUpcoming(outing) {
  const date = String(outing.event_date).slice(0, 10);
  const time = String(outing.start_time).slice(0, 5);
  return new Date(`${date}T${time}:00`).getTime() > Date.now();
}

export function hasParticipant(outing, userId) {
  return (outing.participants || []).some((participant) => Number(participant.id) === Number(userId));
}
