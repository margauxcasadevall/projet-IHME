import { useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { activities, filters } from "../appData.js";
import { formatDate, hasParticipant, isOutingUpcoming } from "../appUtils.js";

export function ProfileView({ profileId, currentUser, outings, onOpenOuting }) {
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
  const participated = outings.filter((outing) => (
    hasParticipant(outing, profile.id) && !isOutingUpcoming(outing)
  ));
  const registered = outings.filter((outing) => (
    (hasParticipant(outing, profile.id)
      || (Number(profile.id) === Number(currentUser.id) && outing.user_is_waitlisted))
    && Number(outing.organizer_id) !== Number(profile.id)
    && isOutingUpcoming(outing)
  ));
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
                <span className="profile-outing-info"><strong>{outing.title}</strong><small>{activity.label} · {formatDate(outing.event_date, outing.start_time)}{Number(profile.id) === Number(currentUser.id) && outing.user_is_waitlisted ? ` · En attente (${outing.waitlist_position})` : ""}</small></span>
                <span className="profile-outing-distance">{Number(outing.distance_km).toLocaleString("fr-FR")} km</span><ArrowRight size={17} />
              </button>
            );
          })}
        </div>
      ) : <div className="empty-state"><h3>Aucune sortie dans cette rubrique</h3><p>Les sorties correspondantes apparaîtront ici.</p></div>}
    </section>
  );
}

export function CalendarView({ currentUser, outings, onOpenOuting }) {
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
    return (scope === "all" || hasParticipant(outing, currentUser.id) || outing.user_is_waitlisted)
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
            return <button key={outing.id} className="calendar-event" onClick={() => onOpenOuting(outing)}><span className={`mini-icon ${activity.tint}`}><ActivityIcon size={17} /></span><span className="calendar-event-copy"><strong>{outing.title}</strong><small>{formatDate(outing.event_date, outing.start_time)} · {outing.organizer_name}{outing.user_is_waitlisted ? ` · En attente (${outing.waitlist_position})` : ""}</small></span><ArrowRight size={16} /></button>;
          })}</div> : <p className="calendar-empty">Aucune sortie sur cette période. Changez de mois ou ajustez les filtres.</p>}
        </div>
      </div>
    </section>
  );
}
