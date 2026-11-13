import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCheck,
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
import { api } from "./api.js";
import { activities, appBasePath, emptyForm, filters } from "./appData.js";
import { formatDate, isOutingUpcoming, timezoneOffsetFor } from "./appUtils.js";
import AuthScreen from "./components/AuthScreen.jsx";
import Brand from "./components/Brand.jsx";
import { CalendarView, ProfileView } from "./components/MemberViews.jsx";
import { OutingCard, OutingDetails } from "./components/OutingCards.jsx";

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

function App() {
  const [user, setUser] = useState(null);
  const [outings, setOutings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
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
    return result.outings;
  }

  async function loadNotifications() {
    const result = await api("/notifications");
    setNotifications(result.notifications);
    setUnreadNotificationCount(result.unreadCount);
  }

  useEffect(() => {
    let active = true;
    api("/auth/me")
      .then((result) => {
        if (!active) return;
        setUser(result.user);
        return Promise.all([api("/outings"), api("/notifications")]).then(([data, inbox]) => {
          if (!active) return;
          setOutings(data.outings);
          setNotifications(inbox.notifications);
          setUnreadNotificationCount(inbox.unreadCount);
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

  useEffect(() => {
    if (!user) return undefined;
    const refresh = () => {
      loadNotifications().catch((requestError) => setError(requestError.message));
    };
    const intervalId = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
    };
  }, [user]);

  const upcomingOutings = useMemo(() => outings.filter(isOutingUpcoming), [outings]);
  const currentDetailOuting = detailOuting
    ? outings.find((outing) => Number(outing.id) === Number(detailOuting.id)) || detailOuting
    : null;
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
      await Promise.all([loadOutings(), loadNotifications()]);
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
      setNotifications([]);
      setUnreadNotificationCount(0);
      setNotificationsOpen(false);
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
      await Promise.all([loadOutings(), loadNotifications()]);
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
      await Promise.all([loadOutings(), loadNotifications()]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  }

  async function markNotificationRead(notification) {
    setNotificationsOpen(false);
    setError("");
    try {
      await api(`/notifications/${notification.id}/read`, { method: "PATCH" });
      const [freshOutings] = await Promise.all([loadOutings(), loadNotifications()]);
      setDetailOuting(freshOutings.find((outing) => Number(outing.id) === Number(notification.outing_id)) || null);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function markAllNotificationsRead() {
    setError("");
    try {
      await api("/notifications/read-all", { method: "PATCH" });
      await loadNotifications();
    } catch (requestError) {
      setError(requestError.message);
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
          <div className="user-menu">
            <div className="notification-menu">
              <button
                className="notification-toggle"
                aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} non lue${unreadNotificationCount > 1 ? "s" : ""}` : ""}`}
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell size={18} />
                {unreadNotificationCount > 0 && <span className="notification-badge">{unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}</span>}
              </button>
              {notificationsOpen && <section className="notification-panel" aria-label="Centre de notifications">
                <div className="notification-panel-head">
                  <h2>Notifications</h2>
                  {unreadNotificationCount > 0 && <button onClick={markAllNotificationsRead}><CheckCheck size={14} /> Tout lire</button>}
                </div>
                {notifications.length ? <ul>
                  {notifications.map((notification) => (
                    <li key={notification.id}>
                      <button
                        className={`notification-item ${notification.read_at ? "" : "notification-unread"}`}
                        onClick={() => markNotificationRead(notification)}
                      >
                        <span className="notification-dot" />
                        <span>
                          <strong>{notification.message}</strong>
                          <small>{notification.outing_title} · {formatDate(notification.event_date, notification.start_time)}</small>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul> : <p className="notification-empty">Aucune notification pour le moment.</p>}
              </section>}
            </div>
            <button className="profile-nav" onClick={() => showProfile(user.id)} aria-label={`Voir le profil de ${user.fullName}`}><span className="user-avatar">{user.fullName.trim().slice(0, 1).toUpperCase()}</span><span className="user-name">{user.fullName}</span></button>
            <button className="logout-button" onClick={handleLogout} aria-label="Se déconnecter"><LogOut size={17} /></button>
          </div>
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
      {currentDetailOuting && <OutingDetails
        outing={currentDetailOuting}
        currentUserId={user.id}
        busy={busyId === currentDetailOuting.id}
        onJoin={() => joinOuting(currentDetailOuting.id)}
        onLeave={() => leaveOuting(currentDetailOuting.id)}
        onClose={() => setDetailOuting(null)}
        onProfile={showProfile}
      />}
    </div>
  );
}

export default App;
