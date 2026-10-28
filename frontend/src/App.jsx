import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bike,
  CalendarDays,
  Check,
  Download,
  Footprints,
  Link2,
  LogOut,
  MapPin,
  Mountain,
  Plus,
  Route,
  Search,
  SlidersHorizontal,
  Users,
  X
} from "lucide-react";

const activities = {
  hiking: { label: "Randonnée", icon: Footprints, speed: "km/h", tint: "moss" },
  running: { label: "Course", icon: Footprints, speed: "min/km", tint: "violet" },
  trail: { label: "Trail", icon: Mountain, speed: "min/km", tint: "lime" },
  cycling: { label: "Vélo", icon: Bike, speed: "km/h", tint: "pine" }
};

const filters = [
  { id: "all", label: "Toutes les sorties" },
  { id: "hiking", label: "Randonnée" },
  { id: "running", label: "Course" },
  { id: "trail", label: "Trail" },
  { id: "cycling", label: "Vélo" }
];

const emptyForm = {
  title: "",
  activity: "hiking",
  routeDescription: "",
  routeUrl: "",
  meetingPlace: "",
  meetingMapsUrl: "",
  gpxUrl: "",
  gpxContent: "",
  elevationGainM: "",
  elevationLossM: "",
  distanceKm: "",
  date: "",
  time: "",
  averageSpeed: "",
  maxParticipants: ""
};

const appBasePath = import.meta.env.BASE_URL;

async function api(path, options = {}) {
  const response = await fetch(`${appBasePath}api${path}`, {
    ...options,
    credentials: "same-origin",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  });
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error || "Une erreur est survenue.");
    error.status = response.status;
    throw error;
  }
  return body;
}

function formatDate(date, time) {
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

function timezoneOffsetFor(date, time) {
  return new Date(`${date}T${time}:00`).getTimezoneOffset();
}

function isOutingUpcoming(outing) {
  const date = String(outing.event_date).slice(0, 10);
  const time = String(outing.start_time).slice(0, 5);
  return new Date(`${date}T${time}:00`).getTime() > Date.now();
}

function AuthScreen({ onLogin, initialError }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api(`/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        body: JSON.stringify(form)
      });
      onLogin(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-art">
        <div className="auth-art-top"><Brand /></div>
        <div className="art-copy">
          <span className="eyebrow light">ZOU! · ESPACE ADHÉRENTS</span>
          <h1>Sorties<br /><em>outdoor.</em></h1>
          <p>Randonnée, course, trail et vélo entre adhérents.</p>
        </div>
        <div className="art-caption"><span>RANDONNÉE</span><span>COURSE · TRAIL · VÉLO</span></div>
      </div>
      <section className="auth-panel">
        <div className="mobile-brand"><Brand /></div>
        <div className="auth-form-wrap">
          <span className="eyebrow"><span className="eyebrow-dot" /> ESPACE ADHÉRENTS</span>
          <h2>{mode === "login" ? "Connexion" : "Créer un compte"}</h2>
          <p className="auth-subtitle">{mode === "login" ? "Accédez aux sorties et à vos inscriptions." : "Inscrivez-vous pour accéder aux sorties."}</p>
          <div className="auth-tabs" role="tablist" aria-label="Connexion ou inscription">
            <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Connexion</button>
            <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>Créer un compte</button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && (
              <label>
                Votre nom
                <input required minLength="2" maxLength="80" autoComplete="name" placeholder="Camille Martin" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
              </label>
            )}
            <label>
              Adresse e-mail
              <input required type="email" autoComplete="email" placeholder="vous@exemple.fr" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label>
              Mot de passe
              <input required type="password" minLength="8" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="8 caractères minimum" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </label>
            {(error || initialError) && <div className="form-error" role="alert">{error || initialError}</div>}
            <button className="button button-dark auth-submit" disabled={busy}>
              {busy ? "Un instant…" : mode === "login" ? "Se connecter" : "Créer mon compte"} <ArrowRight size={17} />
            </button>
          </form>
          <aside className="demo-credentials" aria-label="Identifiants de démonstration">
            <p>Compte de démonstration partagé</p>
            <span>E-mail <code>demo@zou.fr</code></span>
            <span>Mot de passe <code>ZouDemo2026!</code></span>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Brand({ dark = false }) {
  return (
    <a className={`brand ${dark ? "brand-dark" : ""}`} href={appBasePath} aria-label="Zou!, accueil">
      <svg className="brand-mark" viewBox="0 0 60 44" aria-hidden="true">
        <path className="brand-z" d="M7 8h45L12 36h41" />
        <g className="brand-people">
          <circle cx="19" cy="14" r="2.1" />
          <path d="m18 17 3 3-2 4m-1-5-3 3m5-2 4 1m-6 3-2 4m4-4 3 3" />
          <circle cx="35" cy="23" r="2" />
          <path d="m34 25 3 2-1 4m-2-4-4 2m4-2 4-2" />
          <circle cx="29" cy="33" r="3" />
          <circle cx="40" cy="33" r="3" />
          <path d="m29 33 4-6 4 6h-8l3-4 4 4m-2-7 3 1" />
          <circle cx="46" cy="28" r="1.8" />
          <path d="m45 30 1 4m-1-3-3 2m4-1 3 2m-3 0-2 3m3-3 3 2" />
        </g>
      </svg>
      <span className="brand-word">Zou<span>!</span></span>
    </a>
  );
}

function OutingForm({ outing, onClose, onSave }) {
  const [form, setForm] = useState(outing ? {
    title: outing.title,
    activity: outing.activity,
    routeDescription: outing.route_description || "",
    routeUrl: outing.route_url || "",
    meetingPlace: outing.meeting_place || "",
    meetingMapsUrl: outing.meeting_maps_url || "",
    gpxUrl: outing.gpx_url || "",
    gpxContent: "",
    elevationGainM: outing.elevation_gain_m ?? "",
    elevationLossM: outing.elevation_loss_m ?? "",
    distanceKm: outing.distance_km,
    date: String(outing.event_date).slice(0, 10),
    time: String(outing.start_time).slice(0, 5),
    averageSpeed: outing.average_speed,
    maxParticipants: outing.max_participants
  } : emptyForm);
  const [gpxFileName, setGpxFileName] = useState("");
  const [gpxLoadFailed, setGpxLoadFailed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(Boolean(outing?.gpx_is_uploaded));
  const selectedActivity = activities[form.activity] || activities.hiking;

  useEffect(() => {
    if (!outing?.gpx_is_uploaded) return undefined;
    let active = true;
    fetch(`${appBasePath}api/outings/${outing.id}/gpx`, { credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Impossible de charger le fichier GPX.");
        }
        return response.text();
      })
      .then((content) => {
        if (!active) return;
        setForm((current) => ({ ...current, gpxContent: content }));
        setGpxFileName("Tracé GPX actuel");
      })
      .catch((requestError) => {
        if (active) {
          setGpxLoadFailed(true);
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => { active = false; };
  }, [outing]);

  async function submit(event) {
    event.preventDefault();
    if (gpxLoadFailed) {
      setError("Le tracé GPX actuel n’a pas pu être chargé. Supprimez-le ou sélectionnez un autre tracé avant d’enregistrer.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave({
        ...form,
        routeDescription: form.routeDescription.trim(),
        gpxContent: form.gpxContent.trim(),
        distanceKm: Number(form.distanceKm),
        averageSpeed: Number(form.averageSpeed),
        maxParticipants: Number(form.maxParticipants),
        timezoneOffsetMinutes: timezoneOffsetFor(form.date, form.time)
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="outing-modal" role="dialog" aria-modal="true" aria-labelledby="outing-form-title">
        <div className="modal-head">
          <div><span className="eyebrow"><span className="eyebrow-dot" /> SORTIES</span><h2 id="outing-form-title">{outing ? "Modifier la sortie" : "Proposer une sortie"}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Fermer"><X size={20} /></button>
        </div>
        <form className="outing-form" onSubmit={submit}>
          <label className="field-wide">Nom de la sortie
            <input required minLength="3" maxLength="120" placeholder="Ex. Les calanques au petit matin" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="field-wide">Activité
            <select value={form.activity} onChange={(event) => setForm({ ...form, activity: event.target.value })}>
              {Object.entries(activities).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
            </select>
          </label>
          <div className="form-section-title field-wide"><MapPin size={16} /><span>Point de rendez-vous</span></div>
          <label>Lieu
            <input required minLength="2" maxLength="300" placeholder="Ex. Parking de Luminy, Marseille" value={form.meetingPlace} onChange={(event) => setForm({ ...form, meetingPlace: event.target.value })} />
          </label>
          <label>Lien Google Maps
            <input required type="url" placeholder="https://maps.google.com/…" value={form.meetingMapsUrl} onChange={(event) => setForm({ ...form, meetingMapsUrl: event.target.value })} />
          </label>
          <label className="field-wide">Description / informations supplémentaires <span className="optional">facultatif</span>
            <textarea maxLength="5000" rows="3" placeholder="Détails utiles sur le parcours, le matériel ou l’organisation…" value={form.routeDescription} onChange={(event) => setForm({ ...form, routeDescription: event.target.value })} />
          </label>
          <div className="form-section-title field-wide"><Route size={16} /><span>Tracé GPX</span><span className="optional">facultatif</span></div>
          <label>Fichier GPX
            <input type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml" onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 1024 * 1024) {
                setError("Le fichier GPX ne peut pas dépasser 1 Mo.");
                event.target.value = "";
                return;
              }
              try {
                const content = await file.text();
                setForm({ ...form, gpxContent: content, gpxUrl: "" });
                setGpxFileName(file.name);
                setGpxLoadFailed(false);
                setError("");
              } catch {
                setError("Impossible de lire ce fichier GPX.");
              }
            }} />
            {outing?.gpx_is_uploaded && !gpxFileName && <small>Chargement du tracé GPX actuel…</small>}
            {gpxFileName && <small>Fichier sélectionné : {gpxFileName}</small>}
          </label>
          <label>Lien vers un fichier GPX
            <input type="url" placeholder="https://…" value={form.gpxUrl} onChange={(event) => {
              setForm({ ...form, gpxUrl: event.target.value, gpxContent: "" });
              setGpxFileName("");
              setGpxLoadFailed(false);
            }} />
          </label>
          {(form.gpxUrl || form.gpxContent || outing?.gpx_is_uploaded) && <button type="button" className="button button-delete field-wide" onClick={() => {
            setForm({ ...form, gpxUrl: "", gpxContent: "" });
            setGpxFileName("");
            setGpxLoadFailed(false);
          }}>Supprimer le tracé GPX</button>}
          <label>Dénivelé positif <span className="optional">facultatif</span>
            <span className="input-suffix"><input type="number" min="0" max="100000" step="1" placeholder="500" value={form.elevationGainM} onChange={(event) => setForm({ ...form, elevationGainM: event.target.value })} /><span>m</span></span>
          </label>
          <label>Dénivelé négatif <span className="optional">facultatif</span>
            <span className="input-suffix"><input type="number" min="0" max="100000" step="1" placeholder="500" value={form.elevationLossM} onChange={(event) => setForm({ ...form, elevationLossM: event.target.value })} /><span>m</span></span>
          </label>
          <label>Distance
            <span className="input-suffix"><input required type="number" min="0.1" step="0.1" max="99999" placeholder="12" value={form.distanceKm} onChange={(event) => setForm({ ...form, distanceKm: event.target.value })} /><span>km</span></span>
          </label>
          <label>Vitesse moyenne
            <span className="input-suffix"><input required type="number" min="0.1" step="0.1" max="999" placeholder={form.activity === "running" || form.activity === "trail" ? "6.0" : "5.0"} value={form.averageSpeed} onChange={(event) => setForm({ ...form, averageSpeed: event.target.value })} /><span>{selectedActivity.speed}</span></span>
          </label>
          <label>Date
            <input required type="date" min={new Date().toISOString().slice(0, 10)} value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </label>
          <label>Heure de rendez-vous
            <input required type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} />
          </label>
          <label className="field-wide">Nombre maximum de participants
            <span className="input-suffix"><input required type="number" min={outing ? outing.participant_count : 1} max="10000" step="1" placeholder="12" value={form.maxParticipants} onChange={(event) => setForm({ ...form, maxParticipants: event.target.value })} /><span>personnes</span></span>
            <small>L’organisateur compte parmi les participants.</small>
          </label>
          {error && <div className="form-error field-wide" role="alert">{error}</div>}
          <div className="form-actions field-wide">
            <button type="button" className="button button-quiet" onClick={onClose}>Annuler</button>
            <button className="button button-dark" disabled={busy}>{busy ? "Enregistrement…" : outing ? "Enregistrer" : "Publier la sortie"} <ArrowRight size={16} /></button>
          </div>
        </form>
      </section>
    </div>
  );
}

function OutingCard({ outing, currentUserId, onJoin, onLeave, onEdit, onDelete, busy }) {
  const activity = activities[outing.activity] || activities.hiking;
  const ActivityIcon = activity.icon;
  const isOrganizer = Number(outing.organizer_id) === Number(currentUserId);
  const full = Number(outing.participant_count) >= Number(outing.max_participants);
  const remaining = Number(outing.max_participants) - Number(outing.participant_count);
  const organizerName = typeof outing.organizer_name === "string" ? outing.organizer_name : "Adhérent";
  const hasUploadedGpx = outing.gpx_is_uploaded;
  const gpxHref = hasUploadedGpx ? `${appBasePath}api/outings/${outing.id}/gpx` : outing.gpx_url;

  return (
    <article className="outing-card">
      <div className={`card-art ${activity.tint}`}>
        <span className="activity-pill"><ActivityIcon size={14} /> {activity.label}</span>
        <span className="art-coordinates">{outing.activity === "cycling" ? "VÉLO" : outing.activity === "trail" ? "TRAIL" : outing.activity === "running" ? "COURSE" : "RANDONNÉE"}</span>
        <div className="card-date"><CalendarDays size={14} /><span>{formatDate(outing.event_date, outing.start_time)}</span></div>
      </div>
      <div className="card-content">
        <div className="card-title-row"><h3>{outing.title}</h3>{isOrganizer && <button className="more-button" onClick={onEdit} aria-label="Modifier la sortie"><SlidersHorizontal size={17} /></button>}</div>
        <div className="outing-organizer"><span className="avatar">{organizerName.trim().slice(0, 1).toUpperCase()}</span><span>Proposée par <strong>{isOrganizer ? "vous" : organizerName}</strong></span></div>
        {(outing.meeting_place || outing.meeting_maps_url) && (
          <div className="meeting-point">
            <MapPin size={15} />
            <span><strong>{outing.meeting_place || "Point de rendez-vous"}</strong>
              {outing.meeting_maps_url && <a href={outing.meeting_maps_url} target="_blank" rel="noreferrer">Ouvrir dans Google Maps <ArrowRight size={12} /></a>}
            </span>
          </div>
        )}
        {outing.route_description && <p className="route-summary">{outing.route_description}</p>}
        {outing.route_url && <a className="route-link" href={outing.route_url} target="_blank" rel="noreferrer"><Link2 size={14} /> Ancien lien cartographique <ArrowRight size={13} /></a>}
        {gpxHref && <a className="route-link" href={gpxHref} target={hasUploadedGpx ? undefined : "_blank"} rel={hasUploadedGpx ? undefined : "noreferrer"}><Download size={14} /> Télécharger le tracé GPX <ArrowRight size={13} /></a>}
        <div className="card-stats">
          <div><Route size={16} /><span><strong>{Number(outing.distance_km).toLocaleString("fr-FR")} km</strong><small>distance</small></span></div>
          <div><ArrowDownUp size={16} /><span><strong>{Number(outing.average_speed).toLocaleString("fr-FR")} {activity.speed}</strong><small>allure moyenne</small></span></div>
          <div><Users size={16} /><span><strong>{outing.participant_count}/{outing.max_participants}</strong><small>participants</small></span></div>
        </div>
        {(outing.elevation_gain_m != null || outing.elevation_loss_m != null) && (
          <div className="outing-elevation">
            {outing.elevation_gain_m != null && <span><ArrowUp size={13} /> +{outing.elevation_gain_m} m</span>}
            {outing.elevation_loss_m != null && <span><ArrowDown size={13} /> −{outing.elevation_loss_m} m</span>}
          </div>
        )}
        <div className="card-footer">
          <span className={`spots ${full ? "spots-full" : remaining <= 3 ? "spots-low" : ""}`}>
            <span className="spot-dot" />{full ? "Complet" : `${remaining} place${remaining > 1 ? "s" : ""} disponible${remaining > 1 ? "s" : ""}`}
          </span>
          {isOrganizer ? (
            <button className="button button-delete" disabled={busy} onClick={onDelete}>Annuler la sortie</button>
          ) : outing.user_is_joined ? (
            <button className="button button-joined" disabled={busy} onClick={onLeave}><Check size={15} /> Inscrit·e</button>
          ) : (
            <button className="button button-card" disabled={busy || full} onClick={onJoin}>{full ? "Complet" : "Rejoindre"} <ArrowRight size={15} /></button>
          )}
        </div>
      </div>
    </article>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [outings, setOutings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function loadOutings() {
    const result = await api("/outings");
    setOutings(result.outings.filter(isOutingUpcoming));
  }

  useEffect(() => {
    let active = true;
    api("/auth/me")
      .then((result) => {
        if (!active) return;
        setUser(result.user);
        return api("/outings").then((data) => {
          if (active) setOutings(data.outings.filter(isOutingUpcoming));
        });
      })
      .catch((requestError) => {
        if (active && requestError.status !== 401) {
          setError(requestError.message);
        }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const visibleOutings = useMemo(() => outings
    .filter((outing) => filter === "all" || outing.activity === filter)
    .filter((outing) => `${outing.title} ${outing.route_description} ${outing.organizer_name}`.toLowerCase().includes(search.toLowerCase())), [outings, filter, search]);

  async function handleLogin(nextUser) {
    setUser(nextUser);
    setError("");
    try {
      await loadOutings();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function handleLogout() {
    setError("");
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
      setOutings([]);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function saveOuting(form) {
    if (modal.outing) {
      await api(`/outings/${modal.outing.id}`, { method: "PATCH", body: JSON.stringify(form) });
    } else {
      await api("/outings", { method: "POST", body: JSON.stringify(form) });
    }
    setModal(null);
    try {
      await loadOutings();
    } catch (requestError) {
      setError(`La sortie a été enregistrée, mais la liste n’a pas pu être actualisée : ${requestError.message}`);
    }
  }

  async function joinOuting(id) {
    const outing = outings.find((item) => Number(item.id) === Number(id));
    if (!outing) return;
    setBusyId(id);
    setError("");
    try {
      await api(`/outings/${id}/participants`, {
        method: "POST",
        body: JSON.stringify({
          timezoneOffsetMinutes: timezoneOffsetFor(
            String(outing.event_date).slice(0, 10),
            String(outing.start_time).slice(0, 5)
          )
        })
      });
      await loadOutings();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  }

  async function leaveOuting(id) {
    setBusyId(id);
    setError("");
    try {
      await api(`/outings/${id}/participants/me`, { method: "DELETE" });
      await loadOutings();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteOuting(outing) {
    if (!window.confirm(`Annuler « ${outing.title} » ? Les inscriptions seront supprimées.`)) return;
    setBusyId(outing.id);
    setError("");
    try {
      await api(`/outings/${outing.id}`, { method: "DELETE" });
      await loadOutings();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="loading-screen"><span className="loading-mark" /><span>Chargement…</span></div>;
  if (!user) return <AuthScreen onLogin={handleLogin} initialError={error} />;

  const nextOuting = outings[0];
  const joinedCount = outings.filter((outing) => outing.user_is_joined).length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Brand dark />
          <nav className="main-nav"><a className="nav-active" href="#sorties">Les sorties</a></nav>
          <div className="user-menu"><div className="user-avatar">{user.fullName.trim().slice(0, 1).toUpperCase()}</div><span className="user-name">{user.fullName}</span><button className="logout-button" onClick={handleLogout} aria-label="Se déconnecter"><LogOut size={17} /></button></div>
        </div>
      </header>
      <main className="page-content">
        <section className="welcome-strip">
          <div><span className="eyebrow"><span className="eyebrow-dot" /> ESPACE ADHÉRENTS</span><h1>Agenda <em>outdoor</em></h1><p>Trouvez une activité et gérez vos inscriptions.</p></div>
          <button className="button button-lime" onClick={() => setModal({ outing: null })}><Plus size={18} /> Proposer une sortie</button>
        </section>
        <div className="dashboard-row">
          <div className="stats-intro"><span className="eyebrow">EN UN COUP D’ŒIL</span><h2>Votre activité</h2></div>
          <div className="mini-stat"><span className="mini-icon green"><CalendarDays size={17} /></span><span><strong>{outings.length}</strong><small>sortie{outings.length !== 1 ? "s" : ""} à venir</small></span></div>
          <div className="mini-stat"><span className="mini-icon violet"><Users size={17} /></span><span><strong>{joinedCount}</strong><small>où vous participez</small></span></div>
          {nextOuting && <div className="next-callout"><span className="next-kicker"><span /> À VENIR</span><strong>{nextOuting.title}</strong><span>{formatDate(nextOuting.event_date, nextOuting.start_time)}</span><ArrowRight size={16} /></div>}
        </div>
        <section className="listing-section" id="sorties">
          <div className="section-heading"><div><span className="eyebrow">SORTIES À VENIR</span><h2>Les sorties <span className="heading-count">{outings.length.toString().padStart(2, "0")}</span></h2></div><div className="search-wrap"><Search size={17} /><input aria-label="Rechercher une sortie" placeholder="Rechercher une sortie…" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
          <div className="filter-row"><div className="filter-tabs" role="tablist" aria-label="Filtrer par activité">{filters.map((item) => <button key={item.id} role="tab" aria-selected={filter === item.id} className={filter === item.id ? "filter-active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div><span className="sort-label"><SlidersHorizontal size={15} /> Les plus proches d’abord</span></div>
          {error && <div className="global-error" role="alert">{error}<button onClick={() => setError("")} aria-label="Fermer"><X size={15} /></button></div>}
          {visibleOutings.length ? <div className="outing-grid">{visibleOutings.map((outing) => <OutingCard key={outing.id} outing={outing} currentUserId={user.id} busy={busyId === outing.id} onJoin={() => joinOuting(outing.id)} onLeave={() => leaveOuting(outing.id)} onEdit={() => setModal({ outing })} onDelete={() => deleteOuting(outing)} />)}</div> : (
            <div className="empty-state"><div className="empty-icon"><Mountain size={26} /></div><h3>{search || filter !== "all" ? "Aucun résultat" : "Aucune sortie à venir"}</h3><p>{search || filter !== "all" ? "Modifiez votre recherche ou choisissez un autre filtre." : "Proposez une sortie pour la rendre visible aux adhérents."}</p>{!search && filter === "all" && <button className="button button-dark" onClick={() => setModal({ outing: null })}><Plus size={16} /> Proposer une sortie</button>}</div>
          )}
        </section>
        <footer className="page-footer"><Brand dark /><span>Sorties outdoor entre adhérents</span></footer>
      </main>
      {modal && <OutingForm outing={modal.outing} onClose={() => setModal(null)} onSave={saveOuting} />}
    </div>
  );
}

export default App;
