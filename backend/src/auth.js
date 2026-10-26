import jwt from "jsonwebtoken";

const cookieName = "ihme_session";
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

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
