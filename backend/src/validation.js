const activities = new Set(["hiking", "running", "trail", "cycling"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const date = typeof input.date === "string" ? input.date : "";
  const time = typeof input.time === "string" ? input.time : "";
  const timezoneOffsetMinutes = input.timezoneOffsetMinutes;
  const distance = Number(input.distanceKm);
  const averageSpeed = Number(input.averageSpeed);
  const maxParticipants = Number(input.maxParticipants);

  if (title.length < 3 || title.length > 120) {
    return { error: "Le titre doit contenir entre 3 et 120 caractères." };
  }
  if (!activities.has(activity)) {
    return { error: "Choisissez une activité valide." };
  }
  if (routeDescription.length < 3 || routeDescription.length > 5000) {
    return { error: "Décrivez l’itinéraire (entre 3 et 5 000 caractères)." };
  }
  if (routeUrl) {
    try {
      const parsedUrl = new URL(routeUrl);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error();
    } catch {
      return { error: "Le lien de l’itinéraire doit être une URL HTTP ou HTTPS valide." };
    }
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
      distanceKm: distance,
      date,
      time,
      averageSpeed,
      maxParticipants
    }
  };
}
