import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  Bike,
  CalendarDays,
  Check,
  Compass,
  Footprints,
  Leaf,
  Link2,
  LogOut,
  Mountain,
  Plus,
  Route,
  Search,
  SlidersHorizontal,
  Sparkles,
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
  distanceKm: "",
  date: "",
  time: "",
  averageSpeed: "",
  maxParticipants: ""
};

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
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
  const parsed = new Date(`${date}T${time}`);
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
        <div className="sun-disc" />
        <div className="art-hill art-hill-back" />
        <div className="art-hill art-hill-front" />
        <div className="art-copy">
          <span className="eyebrow light"><Sparkles size={14} /> dehors, ensemble</span>
          <h1>Le meilleur<br />chemin est<br /><em>celui qu’on partage.</em></h1>
          <p>Des sorties à votre rythme, avec des gens qui aiment prendre l’air.</p>
        </div>
        <div className="art-caption"><span>PRENDRE L’AIR</span><span>PARTAGER LE CHEMIN</span></div>
      </div>
      <section className="auth-panel">
        <div className="mobile-brand"><Brand /></div>
        <div className="auth-form-wrap">
          <span className="eyebrow"><span className="eyebrow-dot" /> LA COMMUNAUTÉ OUTDOOR</span>
          <h2>{mode === "login" ? "Content de vous revoir." : "Bienvenue dehors."}</h2>
          <p className="auth-subtitle">{mode === "login" ? "Connectez-vous pour retrouver les prochaines sorties." : "Créez votre compte pour rejoindre les sorties."}</p>
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
          <p className="auth-footnote"><Leaf size={14} /> Une communauté, des sorties, de l’air frais.</p>
        </div>
      </section>
    </main>
  );
}

function Brand({ dark = false }) {
  return (
    <a className={`brand ${dark ? "brand-dark" : ""}`} href="/" aria-label="IHME, accueil">
      <span className="brand-mark"><span /><span /><span /></span>
      <span className="brand-word">ihme<span>.</span></span>
    </a>
  );
}

function OutingForm({ outing, onClose, onSave }) {
  const [form, setForm] = useState(outing ? {
    title: outing.title,
    activity: outing.activity,
    routeDescription: outing.route_description,
    routeUrl: outing.route_url || "",
    distanceKm: outing.distance_km,
    date: String(outing.event_date).slice(0, 10),
    time: String(outing.start_time).slice(0, 5),
    averageSpeed: outing.average_speed,
    maxParticipants: outing.max_participants
  } : emptyForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const selectedActivity = activities[form.activity];

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave({
        ...form,
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
          <div><span className="eyebrow"><span className="eyebrow-dot" /> LA PROCHAINE AVENTURE</span><h2 id="outing-form-title">{outing ? "Modifier la sortie" : "Proposer une sortie"}</h2></div>
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
          <label className="field-wide">Itinéraire
            <textarea required minLength="3" maxLength="5000" rows="3" placeholder="Décrivez le parcours et le point de rendez-vous…" value={form.routeDescription} onChange={(event) => setForm({ ...form, routeDescription: event.target.value })} />
          </label>
          <label className="field-wide">Lien vers une carte <span className="optional">facultatif</span>
            <input type="url" placeholder="https://" value={form.routeUrl} onChange={(event) => setForm({ ...form, routeUrl: event.target.value })} />
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

  return (
    <article className="outing-card">
      <div className={`card-art ${activity.tint}`}>
        <span className="activity-pill"><ActivityIcon size={14} /> {activity.label}</span>
        <span className="art-coordinates">{outing.activity === "cycling" ? "À VÉLO" : outing.activity === "trail" ? "SUR LES SENTIERS" : "PRENDRE L’AIR"}</span>
        <div className="card-landscape"><span className="landscape-sun" /><span className="landscape-mountain one" /><span className="landscape-mountain two" /><span className="landscape-mountain three" /></div>
        <div className="card-date"><CalendarDays size={14} /><span>{formatDate(outing.event_date, outing.start_time)}</span></div>
      </div>
      <div className="card-content">
        <div className="card-title-row"><h3>{outing.title}</h3>{isOrganizer && <button className="more-button" onClick={onEdit} aria-label="Modifier la sortie"><SlidersHorizontal size={17} /></button>}</div>
        <div className="outing-organizer"><span className="avatar">{outing.organizer_name.trim().slice(0, 1).toUpperCase()}</span><span>Proposée par <strong>{isOrganizer ? "vous" : outing.organizer_name}</strong></span></div>
        <p className="route-summary">{outing.route_description}</p>
        {outing.route_url && <a className="route-link" href={outing.route_url} target="_blank" rel="noreferrer"><Link2 size={14} /> Voir l’itinéraire <ArrowRight size={13} /></a>}
        <div className="card-stats">
          <div><Route size={16} /><span><strong>{Number(outing.distance_km).toLocaleString("fr-FR")} km</strong><small>distance</small></span></div>
          <div><ArrowDownUp size={16} /><span><strong>{Number(outing.average_speed).toLocaleString("fr-FR")} {activity.speed}</strong><small>allure moyenne</small></span></div>
          <div><Users size={16} /><span><strong>{outing.participant_count}/{outing.max_participants}</strong><small>participants</small></span></div>
        </div>
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
    await loadOutings();
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

  if (loading) return <div className="loading-screen"><span className="loading-mark"><Leaf size={22} /></span><span>On prépare le terrain…</span></div>;
  if (!user) return <AuthScreen onLogin={handleLogin} initialError={error} />;

  const nextOuting = outings[0];
  const joinedCount = outings.filter((outing) => outing.user_is_joined).length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Brand dark />
          <nav className="main-nav"><a className="nav-active" href="#sorties">Les sorties</a><a href="#concept">L’esprit IHME</a></nav>
          <div className="user-menu"><div className="user-avatar">{user.fullName.trim().slice(0, 1).toUpperCase()}</div><span className="user-name">{user.fullName}</span><button className="logout-button" onClick={handleLogout} aria-label="Se déconnecter"><LogOut size={17} /></button></div>
        </div>
      </header>
      <main className="page-content">
        <section className="welcome-strip">
          <div><span className="eyebrow"><span className="eyebrow-dot" /> SORTIES OUTDOOR • ENTRE ADHÉRENTS</span><h1>Un peu plus <em>dehors.</em></h1><p>De belles sorties, de belles rencontres. Choisissez votre prochaine échappée.</p></div>
          <button className="button button-lime" onClick={() => setModal({ outing: null })}><Plus size={18} /> Proposer une sortie</button>
          <div className="welcome-sun" /><div className="welcome-ridge ridge-one" /><div className="welcome-ridge ridge-two" />
        </section>
        <div className="dashboard-row">
          <div className="stats-intro"><span className="eyebrow"><Compass size={14} /> LE CARNET DE SORTIES</span><h2>La prochaine aventure<br />commence <em>ici.</em></h2></div>
          <div className="mini-stat"><span className="mini-icon green"><CalendarDays size={17} /></span><span><strong>{outings.length}</strong><small>sortie{outings.length !== 1 ? "s" : ""} à venir</small></span></div>
          <div className="mini-stat"><span className="mini-icon violet"><Users size={17} /></span><span><strong>{joinedCount}</strong><small>où vous participez</small></span></div>
          {nextOuting && <div className="next-callout"><span className="next-kicker"><span /> À VENIR</span><strong>{nextOuting.title}</strong><span>{formatDate(nextOuting.event_date, nextOuting.start_time)}</span><ArrowRight size={16} /></div>}
        </div>
        <section className="listing-section" id="sorties">
          <div className="section-heading"><div><span className="eyebrow">FAITES VOTRE CHOIX</span><h2>Les sorties <span className="heading-count">{outings.length.toString().padStart(2, "0")}</span></h2></div><div className="search-wrap"><Search size={17} /><input aria-label="Rechercher une sortie" placeholder="Rechercher une sortie…" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
          <div className="filter-row"><div className="filter-tabs" role="tablist" aria-label="Filtrer par activité">{filters.map((item) => <button key={item.id} role="tab" aria-selected={filter === item.id} className={filter === item.id ? "filter-active" : ""} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div><span className="sort-label"><SlidersHorizontal size={15} /> Les plus proches d’abord</span></div>
          {error && <div className="global-error" role="alert">{error}<button onClick={() => setError("")} aria-label="Fermer"><X size={15} /></button></div>}
          {visibleOutings.length ? <div className="outing-grid">{visibleOutings.map((outing) => <OutingCard key={outing.id} outing={outing} currentUserId={user.id} busy={busyId === outing.id} onJoin={() => joinOuting(outing.id)} onLeave={() => leaveOuting(outing.id)} onEdit={() => setModal({ outing })} onDelete={() => deleteOuting(outing)} />)}</div> : (
            <div className="empty-state"><div className="empty-icon"><Mountain size={26} /></div><h3>{search || filter !== "all" ? "Aucune sortie par ici." : "La première sortie n’attend que vous."}</h3><p>{search || filter !== "all" ? "Essayez un autre filtre ou une autre recherche." : "Proposez une aventure et invitez la communauté à vous rejoindre."}</p>{!search && filter === "all" && <button className="button button-dark" onClick={() => setModal({ outing: null })}><Plus size={16} /> Proposer la première sortie</button>}</div>
          )}
        </section>
        <section className="closing-note" id="concept"><span className="closing-mark"><Leaf size={17} /></span><span><strong>Le bon rythme, c’est le vôtre.</strong> On se retrouve dehors ?</span><span className="closing-note-right">FAIT AVEC CURIOSITÉ <span>✳</span></span></section>
        <footer className="page-footer"><Brand dark /><span>Projet IHME · Sorties outdoor entre adhérents</span><span className="page-footer-tag">FAIT POUR PRENDRE L’AIR</span></footer>
      </main>
      {modal && <OutingForm outing={modal.outing} onClose={() => setModal(null)} onSave={saveOuting} />}
    </div>
  );
}

export default App;
