import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bike,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
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

function hasParticipant(outing, userId) {
  return (outing.participants || []).some((participant) => Number(participant.id) === Number(userId));
}

function OutingDetails({ outing, currentUserId, onClose, onProfile }) {
  const activity = activities[outing.activity] || activities.hiking;
  const ActivityIcon = activity.icon;
  const hasUploadedGpx = outing.gpx_is_uploaded;
  const gpxHref = hasUploadedGpx ? `${appBasePath}api/outings/${outing.id}/gpx` : outing.gpx_url;

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="outing-modal details-modal" role="dialog" aria-modal="true" aria-labelledby="outing-details-title">
        <div className={`details-art card-art ${activity.tint}`}>
          <span className="activity-pill"><ActivityIcon size={14} /> {activity.label}</span>
          <button className="icon-button details-close" onClick={onClose} aria-label="Fermer"><X size={20} /></button>
          <span className="card-date"><CalendarDays size={14} /> {formatDate(outing.event_date, outing.start_time)}</span>
        </div>
        <div className="details-content">
          <span className="eyebrow"><span className="eyebrow-dot" /> DÉTAILS DE LA SORTIE</span>
          <h2 id="outing-details-title">{outing.title}</h2>
          <p className="details-organizer">
            Organisée par{" "}
            <button className="text-link" onClick={() => onProfile(outing.organizer_id)}>
              {Number(outing.organizer_id) === Number(currentUserId) ? "vous" : outing.organizer_name}
            </button>
          </p>
          <div className="details-stats">
            <div><Route size={17} /><span><strong>{Number(outing.distance_km).toLocaleString("fr-FR")} km</strong><small>Distance</small></span></div>
            <div><ArrowDownUp size={17} /><span><strong>{Number(outing.average_speed).toLocaleString("fr-FR")} {activity.speed}</strong><small>{activity.speed === "min/km" ? "Allure moyenne" : "Vitesse moyenne"}</small></span></div>
            <div><Users size={17} /><span><strong>{outing.participant_count}/{outing.max_participants}</strong><small>Participants</small></span></div>
            {outing.elevation_gain_m != null && <div><ArrowUp size={17} /><span><strong>+{outing.elevation_gain_m} m</strong><small>Dénivelé positif</small></span></div>}
            {outing.elevation_loss_m != null && <div><ArrowDown size={17} /><span><strong>−{outing.elevation_loss_m} m</strong><small>Dénivelé négatif</small></span></div>}
          </div>
          {outing.meeting_place && <div className="details-block"><h3><MapPin size={16} /> Rendez-vous</h3><p>{outing.meeting_place}</p>{outing.meeting_maps_url && <a className="route-link" href={outing.meeting_maps_url} target="_blank" rel="noreferrer">Ouvrir dans Google Maps <ArrowRight size={13} /></a>}</div>}
          {outing.route_description && <div className="details-block"><h3><Route size={16} /> Parcours et informations</h3><p>{outing.route_description}</p></div>}
          {(outing.route_url || gpxHref) && <div className="details-block"><h3>Tracé</h3><div className="details-links">{outing.route_url && <a className="route-link" href={outing.route_url} target="_blank" rel="noreferrer"><Link2 size={14} /> Carte du parcours <ArrowRight size={13} /></a>}{gpxHref && <a className="route-link" href={gpxHref} target={hasUploadedGpx ? undefined : "_blank"} rel={hasUploadedGpx ? undefined : "noreferrer"}><Download size={14} /> Télécharger le tracé GPX <ArrowRight size={13} /></a>}</div></div>}
          <div className="details-block">
            <h3><Users size={16} /> Participants ({outing.participant_count})</h3>
            <div className="participant-list">
              {(outing.participants || []).map((participant) => (
                <button key={participant.id} className="participant-chip" onClick={() => onProfile(participant.id)}>
                  <span className="avatar">{participant.fullName.trim().slice(0, 1).toUpperCase()}</span>{participant.fullName}
                  {Number(participant.id) === Number(outing.organizer_id) && <small>Organisateur</small>}
                </button>
              ))}
            </div>
          </div>
          <div className="form-actions"><button className="button button-quiet" onClick={onClose}>Fermer</button></div>
        </div>
      </section>
    </div>
  );
}

function OutingCard({ outing, currentUserId, onJoin, onLeave, onEdit, onDelete, onOpen, onProfile, busy }) {
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
        <div className="card-title-row"><h3><button className="outing-title-link" onClick={onOpen}>{outing.title}</button></h3>{isOrganizer && <button className="more-button" onClick={onEdit} aria-label="Modifier la sortie"><SlidersHorizontal size={17} /></button>}</div>
        <div className="outing-organizer"><span className="avatar">{organizerName.trim().slice(0, 1).toUpperCase()}</span><span>Proposée par <button className="text-link" onClick={() => onProfile(outing.organizer_id)}>{isOrganizer ? "vous" : organizerName}</button></span></div>
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
          <div><ArrowDownUp size={16} /><span><strong>{Number(outing.average_speed).toLocaleString("fr-FR")} {activity.speed}</strong><small>{activity.speed === "min/km" ? "allure moyenne" : "vitesse moyenne"}</small></span></div>
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
          <button className="details-button" onClick={onOpen}>Détails</button>
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

function ProfileView({ profileId, currentUser, outings, onOpenOuting }) {
  const [section, setSection] = useState("participated");
  const profile = Number(profileId) === Number(currentUser.id)
    ? { id: currentUser.id, fullName: currentUser.fullName }
    : outings.reduce((found, outing) => {
      if (found) return found;
      if (Number(outing.organizer_id) === Number(profileId)) {
        return { id: outing.organizer_id, fullName: outing.organizer_name };
      }
      return (outing.participants || []).find((participant) => Number(participant.id) === Number(profileId)) || null;
    }, null);

  if (!profile) {
    return <div className="empty-state"><h3>Profil indisponible</h3><p>Ce profil n’est pas encore associé à une sortie.</p></div>;
  }

  const organized = outings.filter((outing) => Number(outing.organizer_id) === Number(profile.id));
  const participated = outings.filter((outing) => hasParticipant(outing, profile.id));
  const registered = participated.filter((outing) => Number(outing.organizer_id) !== Number(profile.id) && isOutingUpcoming(outing));
  const sections = [
    { id: "participated", label: "Sorties participées", outings: participated },
    { id: "registered", label: "Inscriptions à venir", outings: registered },
    { id: "organized", label: "Sorties organisées", outings: organized }
  ];
  const selected = sections.find((item) => item.id === section);

  return (
    <section className="profile-page">
      <div className="profile-hero">
        <span className="profile-avatar">{profile.fullName.trim().slice(0, 1).toUpperCase()}</span>
        <div><span className="eyebrow">PROFIL ADHÉRENT</span><h1>{profile.fullName}</h1><p>{organized.length} sortie{organized.length !== 1 ? "s" : ""} organisée{organized.length !== 1 ? "s" : ""} · {participated.length} sortie{participated.length !== 1 ? "s" : ""} participée{participated.length !== 1 ? "s" : ""}</p></div>
      </div>
      <div className="profile-tabs" role="tablist" aria-label="Sorties du profil">
        {sections.map((item) => <button key={item.id} role="tab" aria-selected={section === item.id} className={section === item.id ? "filter-active" : ""} onClick={() => setSection(item.id)}>{item.label}<span>{item.outings.length}</span></button>)}
      </div>
      {selected.outings.length ? (
        <div className="profile-outings">
          {selected.outings.map((outing) => {
            const activity = activities[outing.activity] || activities.hiking;
            const ActivityIcon = activity.icon;
            return (
              <button key={outing.id} className="profile-outing" onClick={() => onOpenOuting(outing)}>
                <span className={`mini-icon ${activity.tint}`}><ActivityIcon size={17} /></span>
                <span className="profile-outing-info"><strong>{outing.title}</strong><small>{activity.label} · {formatDate(outing.event_date, outing.start_time)}</small></span>
                <span className="profile-outing-distance">{Number(outing.distance_km).toLocaleString("fr-FR")} km</span><ArrowRight size={17} />
              </button>
            );
          })}
        </div>
      ) : <div className="empty-state"><h3>Aucune sortie dans cette rubrique</h3><p>Les sorties correspondantes apparaîtront ici.</p></div>}
    </section>
  );
}

function CalendarView({ currentUser, outings, onOpenOuting }) {
  const [scope, setScope] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const monthLabel = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(month);
  const matchingOutings = outings.filter((outing) => {
    const date = String(outing.event_date).slice(0, 10);
    return (scope === "all" || hasParticipant(outing, currentUser.id))
      && (activityFilter === "all" || outing.activity === activityFilter)
      && (!fromDate || date >= fromDate)
      && (!toDate || date <= toDate);
  });
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cellCount = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: cellCount }, (_, index) => {
    const day = index - startOffset + 1;
    if (day < 1 || day > daysInMonth) return null;
    return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  });
  const monthOutings = matchingOutings.filter((outing) => {
    const date = String(outing.event_date).slice(0, 10);
    return date.startsWith(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`);
  });
  const visibleOutings = monthOutings.filter((outing) => !selectedDate || String(outing.event_date).slice(0, 10) === selectedDate);
  const dateCounts = monthOutings.reduce((counts, outing) => {
    const date = String(outing.event_date).slice(0, 10);
    counts[date] = (counts[date] || 0) + 1;
    return counts;
  }, {});

  return (
    <section className="calendar-page">
      <div className="section-heading calendar-heading"><div><span className="eyebrow">PLANIFIER VOS SORTIES</span><h2>Agenda</h2></div></div>
      <div className="calendar-toolbar">
        <div className="calendar-scopes" role="tablist" aria-label="Sorties de l’agenda">
          <button role="tab" aria-selected={scope === "all"} className={scope === "all" ? "filter-active" : ""} onClick={() => setScope("all")}>Toutes les sorties</button>
          <button role="tab" aria-selected={scope === "mine"} className={scope === "mine" ? "filter-active" : ""} onClick={() => setScope("mine")}>Mes participations</button>
        </div>
        <div className="calendar-filters">
          <label>Du <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
          <label>Au <input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} /></label>
          <label>Activité <select value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)}>{filters.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        </div>
      </div>
      <div className="calendar-layout">
        <div className="calendar-month">
          <div className="calendar-month-head"><button className="icon-button" aria-label="Mois précédent" onClick={() => { setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)); setSelectedDate(""); }}><ChevronLeft size={18} /></button><h3>{monthLabel}</h3><button className="icon-button" aria-label="Mois suivant" onClick={() => { setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)); setSelectedDate(""); }}><ChevronRight size={18} /></button></div>
          <div className="calendar-grid calendar-weekdays">{["L", "M", "M", "J", "V", "S", "D"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
          <div className="calendar-grid">{cells.map((date, index) => date ? <button key={date} className={`calendar-day ${dateCounts[date] ? "has-events" : ""} ${selectedDate === date ? "selected" : ""}`} onClick={() => setSelectedDate(selectedDate === date ? "" : date)} aria-label={`${date}${dateCounts[date] ? `, ${dateCounts[date]} sortie(s)` : ""}`}><span>{Number(date.slice(-2))}</span>{dateCounts[date] > 0 && <i>{dateCounts[date]}</i>}</button> : <span className="calendar-empty-day" key={`empty-${index}`} />)}</div>
          <button className="calendar-reset" onClick={() => { setSelectedDate(""); setFromDate(""); setToDate(""); setActivityFilter("all"); }}>Effacer les filtres</button>
        </div>
        <div className="calendar-events">
          <div className="calendar-events-head"><div><span className="eyebrow">{selectedDate ? "SORTIES DU JOUR" : "CE MOIS-CI"}</span><h3>{selectedDate ? new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${selectedDate}T12:00:00`)) : monthLabel}</h3></div><span>{visibleOutings.length} sortie{visibleOutings.length !== 1 ? "s" : ""}</span></div>
          {visibleOutings.length ? <div className="calendar-event-list">{visibleOutings.map((outing) => {
            const activity = activities[outing.activity] || activities.hiking;
            const ActivityIcon = activity.icon;
            return <button key={outing.id} className="calendar-event" onClick={() => onOpenOuting(outing)}><span className={`mini-icon ${activity.tint}`}><ActivityIcon size={17} /></span><span className="calendar-event-copy"><strong>{outing.title}</strong><small>{formatDate(outing.event_date, outing.start_time)} · {outing.organizer_name}</small></span><ArrowRight size={16} /></button>;
          })}</div> : <p className="calendar-empty">Aucune sortie sur cette période. Changez de mois ou ajustez les filtres.</p>}
        </div>
      </div>
    </section>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [outings, setOutings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [detailOuting, setDetailOuting] = useState(null);
  const [page, setPage] = useState("outings");
  const [profileId, setProfileId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function loadOutings() {
    const result = await api("/outings");
    setOutings(result.outings);
  }

  useEffect(() => {
    let active = true;
    api("/auth/me")
      .then((result) => {
        if (!active) return;
        setUser(result.user);
        return api("/outings").then((data) => {
          if (active) setOutings(data.outings);
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

  const upcomingOutings = useMemo(() => outings.filter(isOutingUpcoming), [outings]);
  const visibleOutings = useMemo(() => {
    const searchTerm = search.trim().toLocaleLowerCase("fr-FR");
    return upcomingOutings
      .filter((outing) => filter === "all" || outing.activity === filter)
      .filter((outing) => `${outing.title} ${activities[outing.activity]?.label || ""} ${outing.route_description || ""} ${outing.organizer_name || ""} ${outing.meeting_place || ""}`
        .toLocaleLowerCase("fr-FR")
        .includes(searchTerm));
  }, [upcomingOutings, filter, search]);

  function showProfile(id) {
    setProfileId(id);
    setPage("profile");
    setDetailOuting(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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

  const nextOuting = upcomingOutings[0];
  const joinedCount = upcomingOutings.filter((outing) => outing.user_is_joined).length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Brand dark />
          <nav className="main-nav" aria-label="Navigation principale">
            <button className={page === "outings" ? "nav-active" : ""} onClick={() => setPage("outings")}>Les sorties</button>
            <button className={page === "calendar" ? "nav-active" : ""} onClick={() => setPage("calendar")}>Agenda</button>
          </nav>
          <div className="user-menu"><button className="profile-nav" onClick={() => showProfile(user.id)} aria-label={`Voir le profil de ${user.fullName}`}><span className="user-avatar">{user.fullName.trim().slice(0, 1).toUpperCase()}</span><span className="user-name">{user.fullName}</span></button><button className="logout-button" onClick={handleLogout} aria-label="Se déconnecter"><LogOut size={17} /></button></div>
        </div>
      </header>
      <main className="page-content">
        {page === "outings" && <section className="welcome-strip">
          <div className="welcome-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> L’AVENTURE COMMENCE ICI</span>
            <h1>Dehors,<br /><em>on est mieux.</em></h1>
            <p>Trouvez votre prochaine sortie.</p>
            <button className="button button-lime" onClick={() => setModal({ outing: null })}><Plus size={18} /> Proposer une sortie</button>
          </div>
          <div className="hero-map" aria-hidden="true">
            <svg className="topographic-map" viewBox="0 0 640 390" preserveAspectRatio="xMidYMid slice">
              <path d="M-30 65C59 15 96 114 185 72S309-8 386 42s145 60 286-3M-37 89c96-50 128 58 221 15S314 18 384 62s154 66 302 4M-31 117c94-43 133 63 223 24s129-76 195-30 147 70 308 13M-24 147c101-44 143 57 231 29s128-78 196-34 154 71 306 25M-16 180c108-46 142 47 239 34s123-77 190-37 155 79 302 39M-12 215c102-47 152 39 248 36s124-70 189-35 157 83 293 54M-20 253c106-53 154 24 253 36s121-61 190-31 151 81 289 65M-26 294c115-55 163 12 264 34s120-49 190-25 150 82 286 81M-20 337c121-57 173-1 277 27s120-39 192-18 143 81 277 94" />
              <path d="M43 391c33-62 32-122 91-164s103-48 109-111S305 26 359 1M105 403c36-67 38-129 100-171s99-45 104-109S353 67 411 0M172 411c37-64 44-119 106-153s100-39 108-98S428 89 477 10M245 410c37-57 52-103 108-130s94-30 111-80S501 102 548 25M324 406c37-49 56-83 107-103s91-22 115-61 25-92 68-126" />
              <path className="map-route" d="M90 321c56-18 51-84 114-89s90 41 142 14 29-78 91-97 83 8 134-35" />
              <circle className="map-stop" cx="90" cy="321" r="8" />
              <circle className="map-stop" cx="204" cy="232" r="7" />
              <circle className="map-stop" cx="437" cy="149" r="7" />
              <circle className="map-destination" cx="571" cy="114" r="11" />
            </svg>
            <div className="map-label map-label-top"><span className="map-live-dot" /> PARCOURS À DÉCOUVRIR</div>
          </div>
        </section>}
        {page === "outings" && <div className="dashboard-row">
          <div className="stats-intro"><span className="eyebrow">EN UN COUP D’ŒIL</span><h2>Votre activité</h2></div>
          <div className="mini-stat"><span className="mini-icon green"><CalendarDays size={17} /></span><span><strong>{upcomingOutings.length}</strong><small>sortie{upcomingOutings.length !== 1 ? "s" : ""} à venir</small></span></div>
          <div className="mini-stat"><span className="mini-icon violet"><Users size={17} /></span><span><strong>{joinedCount}</strong><small>où vous participez</small></span></div>
          {nextOuting && <div className="next-callout"><span className="next-kicker"><span /> À VENIR</span><strong>{nextOuting.title}</strong><span>{formatDate(nextOuting.event_date, nextOuting.start_time)}</span><ArrowRight size={16} /></div>}
        </div>}
        {page === "outings" && <section className="listing-section" id="sorties">
          <div className="section-heading"><div><span className="eyebrow">SORTIES À VENIR</span><h2>Les sorties <span className="heading-count" aria-label={`${visibleOutings.length} résultat${visibleOutings.length > 1 ? "s" : ""}`}>{visibleOutings.length.toString().padStart(2, "0")}</span></h2></div><div className="search-wrap"><Search size={17} /><input aria-label="Rechercher par activité, nom, description ou lieu" placeholder="Rechercher une sortie…" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
          <div className="filter-row"><div className="filter-tabs" role="tablist" aria-label="Filtrer par activité">{filters.map((item) => <button key={item.id} role="tab" aria-selected={filter === item.id} className={filter === item.id ? "filter-active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div><span className="sort-label"><SlidersHorizontal size={15} /> Les plus proches d’abord</span></div>
          <p className="result-summary" role="status">
            {visibleOutings.length} sortie{visibleOutings.length !== 1 ? "s" : ""} affichée{visibleOutings.length !== 1 ? "s" : ""}
            {filter !== "all" && ` · Activité : ${filters.find((item) => item.id === filter)?.label}`}
            {search.trim() && ` · Recherche : « ${search.trim()} »`}
          </p>
          {visibleOutings.length ? <div className="outing-grid">{visibleOutings.map((outing) => <OutingCard key={outing.id} outing={outing} currentUserId={user.id} busy={busyId === outing.id} onJoin={() => joinOuting(outing.id)} onLeave={() => leaveOuting(outing.id)} onEdit={() => setModal({ outing })} onDelete={() => deleteOuting(outing)} onOpen={() => setDetailOuting(outing)} onProfile={showProfile} />)}</div> : (
            <div className="empty-state"><div className="empty-icon"><Mountain size={26} /></div><h3>{search || filter !== "all" ? "Aucun résultat" : "Aucune sortie à venir"}</h3><p>{search || filter !== "all" ? "Modifiez votre recherche ou choisissez un autre filtre." : "Proposez une sortie pour la rendre visible aux adhérents."}</p>{!search && filter === "all" && <button className="button button-dark" onClick={() => setModal({ outing: null })}><Plus size={16} /> Proposer une sortie</button>}</div>
          )}
        </section>}
        {page === "calendar" && <CalendarView currentUser={user} outings={outings} onOpenOuting={setDetailOuting} />}
        {page === "profile" && <ProfileView profileId={profileId ?? user.id} currentUser={user} outings={outings} onOpenOuting={setDetailOuting} />}
        {error && <div className="global-error" role="alert">{error}<button onClick={() => setError("")} aria-label="Fermer"><X size={15} /></button></div>}
        <footer className="page-footer"><Brand dark /><span>Sorties outdoor entre adhérents</span></footer>
      </main>
      {modal && <OutingForm outing={modal.outing} onClose={() => setModal(null)} onSave={saveOuting} />}
      {detailOuting && <OutingDetails outing={detailOuting} currentUserId={user.id} onClose={() => setDetailOuting(null)} onProfile={showProfile} />}
    </div>
  );
}

export default App;
