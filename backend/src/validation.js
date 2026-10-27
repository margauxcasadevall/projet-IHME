const activities = new Set(["hiking", "running", "trail", "cycling"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxGpxBytes = 1024 * 1024;

export function validateRegistration(body) {
  const input = body && typeof body === "object" ? body : {};
  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (fullName.length < 2 || fullName.length > 80) {
    return { error: "Le nom doit contenir entre 2 et 80 caractères." };
  }
  if (email.length > 254 || !emailPattern.test(email)) {
    return { error: "Saisissez une adresse e-mail valide." };
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return { error: "Le mot de passe doit contenir entre 8 et 72 caractères." };
  }
  return { value: { fullName, email, password } };
}

export function validateLogin(body) {
  const input = body && typeof body === "object" ? body : {};
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!emailPattern.test(email) || !password) {
    return { error: "Saisissez une adresse e-mail et un mot de passe valides." };
  }
  return { value: { email, password } };
}

function isDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function validHttpUrl(value) {
  try {
    const parsedUrl = new URL(value);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

function isGoogleMapsUrl(value) {
  try {
    const parsedUrl = new URL(value);
    const hostname = parsedUrl.hostname.toLowerCase();
    return parsedUrl.protocol === "https:"
      && (hostname === "google.com"
        || hostname.endsWith(".google.com")
        || hostname === "maps.app.goo.gl"
        || hostname === "goo.gl");
  } catch {
    return false;
  }
}

export function isFutureDateTime(date, time, timezoneOffsetMinutes) {
  if (!Number.isInteger(timezoneOffsetMinutes) || Math.abs(timezoneOffsetMinutes) > 14 * 60) {
    return false;
  }
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcTime = Date.UTC(year, month - 1, day, hour, minute)
    + timezoneOffsetMinutes * 60 * 1000;
  return utcTime > Date.now();
}

export function validateOuting(body) {
  const input = body && typeof body === "object" ? body : {};
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const activity = input.activity;
  const routeDescription = typeof input.routeDescription === "string"
    ? input.routeDescription.trim()
    : "";
  const routeUrl = typeof input.routeUrl === "string" ? input.routeUrl.trim() : "";
  const meetingPlace = typeof input.meetingPlace === "string" ? input.meetingPlace.trim() : "";
  const meetingMapsUrl = typeof input.meetingMapsUrl === "string" ? input.meetingMapsUrl.trim() : "";
  const gpxUrl = typeof input.gpxUrl === "string" ? input.gpxUrl.trim() : "";
  const gpxContent = typeof input.gpxContent === "string" ? input.gpxContent.trim() : "";
  const date = typeof input.date === "string" ? input.date : "";
  const time = typeof input.time === "string" ? input.time : "";
  const timezoneOffsetMinutes = input.timezoneOffsetMinutes;
  const distance = Number(input.distanceKm);
  const averageSpeed = Number(input.averageSpeed);
  const maxParticipants = Number(input.maxParticipants);
  const elevationGain = input.elevationGainM === "" || input.elevationGainM == null
    ? null
    : Number(input.elevationGainM);
  const elevationLoss = input.elevationLossM === "" || input.elevationLossM == null
    ? null
    : Number(input.elevationLossM);

  if (title.length < 3 || title.length > 120) {
    return { error: "Le titre doit contenir entre 3 et 120 caractères." };
  }
  if (!activities.has(activity)) {
    return { error: "Choisissez une activité valide." };
  }
  if (routeDescription.length > 5000) {
    return { error: "Les informations complémentaires ne peuvent pas dépasser 5 000 caractères." };
  }
  if (meetingPlace.length < 2 || meetingPlace.length > 300) {
    return { error: "Indiquez un point de rendez-vous (entre 2 et 300 caractères)." };
  }
  if (!isGoogleMapsUrl(meetingMapsUrl)) {
    return { error: "Saisissez un lien Google Maps valide et sécurisé (HTTPS)." };
  }
  if (routeUrl && !validHttpUrl(routeUrl)) {
    return { error: "Le lien de l’itinéraire doit être une URL HTTP ou HTTPS valide." };
  }
  if (gpxUrl && !validHttpUrl(gpxUrl)) {
    return { error: "Le lien GPX doit être une URL HTTP ou HTTPS valide." };
  }
  if (gpxUrl && gpxContent) {
    return { error: "Choisissez un lien GPX ou un fichier GPX, pas les deux." };
  }
  if (gpxContent && (
    Buffer.byteLength(gpxContent, "utf8") > maxGpxBytes
    || !/<gpx(?:\s|>)/i.test(gpxContent)
    || !/<\/gpx\s*>/i.test(gpxContent)
  )) {
    return { error: "Le fichier doit être un tracé GPX valide de 1 Mo maximum." };
  }
  if (elevationGain !== null && (!Number.isInteger(elevationGain) || elevationGain < 0 || elevationGain > 100000)) {
    return { error: "Le dénivelé positif doit être un entier compris entre 0 et 100 000 m." };
  }
  if (elevationLoss !== null && (!Number.isInteger(elevationLoss) || elevationLoss < 0 || elevationLoss > 100000)) {
    return { error: "Le dénivelé négatif doit être un entier compris entre 0 et 100 000 m." };
  }
  if (!isDate(date) || !isTime(time) || !isFutureDateTime(date, time, timezoneOffsetMinutes)) {
    return { error: "Choisissez une date et une heure dans le futur." };
  }
  if (!Number.isFinite(distance) || distance <= 0 || distance > 99999) {
    return { error: "La distance doit être supérieure à 0 km." };
  }
  if (!Number.isFinite(averageSpeed) || averageSpeed <= 0 || averageSpeed > 999) {
    return { error: "Saisissez une vitesse moyenne valide." };
  }
  if (!Number.isInteger(maxParticipants) || maxParticipants < 1 || maxParticipants > 10000) {
    return { error: "Le nombre maximum de participants doit être un entier positif." };
  }

  return {
    value: {
      title,
      activity,
      routeDescription,
      routeUrl: routeUrl || null,
      meetingPlace,
      meetingMapsUrl,
      gpxUrl: gpxUrl || null,
      gpxContent: gpxContent || null,
      elevationGainM: elevationGain,
      elevationLossM: elevationLoss,
      distanceKm: distance,
      date,
      time,
      averageSpeed,
      maxParticipants
    }
  };
}
