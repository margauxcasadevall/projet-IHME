import {
  ArrowDownUp,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  Check,
  Clock3,
  Download,
  Link2,
  MapPin,
  Route,
  SlidersHorizontal,
  Users,
  X
} from "lucide-react";
import { activities, appBasePath } from "../appData.js";
import { formatDate, isOutingUpcoming } from "../appUtils.js";

export function OutingDetails({
  outing,
  currentUserId,
  onClose,
  onProfile,
  onJoin,
  onLeave,
  busy
}) {
  const activity = activities[outing.activity] || activities.hiking;
  const ActivityIcon = activity.icon;
  const isOrganizer = Number(outing.organizer_id) === Number(currentUserId);
  const isFull = Number(outing.participant_count) >= Number(outing.max_participants);
  const isUpcoming = isOutingUpcoming(outing);
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
          {Number(outing.waitlist_count) > 0 && (
            <div className="details-block">
              <h3><Clock3 size={16} /> Liste d’attente ({outing.waitlist_count})</h3>
              {outing.user_is_waitlisted && <p>Vous êtes en position {outing.waitlist_position}.</p>}
            </div>
          )}
          <div className="form-actions">
            {!isOrganizer && isUpcoming && (outing.user_is_joined ? (
              <button className="button button-joined" disabled={busy} onClick={onLeave}><Check size={15} /> Inscrit·e</button>
            ) : outing.user_is_waitlisted ? (
              <button className="button button-waitlisted" disabled={busy} onClick={onLeave}><Clock3 size={15} /> En attente · {outing.waitlist_position}</button>
            ) : (
              <button className="button button-card" disabled={busy} onClick={onJoin}>
                {isFull ? "Rejoindre la liste d’attente" : "Rejoindre"} <ArrowRight size={15} />
              </button>
            ))}
            <button className="button button-quiet" onClick={onClose}>Fermer</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function OutingCard({ outing, currentUserId, onJoin, onLeave, onEdit, onDelete, onOpen, onProfile, busy }) {
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
            <span className="spot-dot" />{full
              ? `Complet${Number(outing.waitlist_count) ? ` · ${outing.waitlist_count} en attente` : ""}`
              : `${remaining} place${remaining > 1 ? "s" : ""} disponible${remaining > 1 ? "s" : ""}`}
          </span>
          <button className="details-button" onClick={onOpen}>Détails</button>
          {isOrganizer ? (
            <button className="button button-delete" disabled={busy} onClick={onDelete}>Annuler la sortie</button>
          ) : outing.user_is_joined ? (
            <button className="button button-joined" disabled={busy} onClick={onLeave}><Check size={15} /> Inscrit·e</button>
          ) : outing.user_is_waitlisted ? (
            <button className="button button-waitlisted" disabled={busy} onClick={onLeave}><Clock3 size={15} /> En attente · {outing.waitlist_position}</button>
          ) : (
            <button className="button button-card" disabled={busy} onClick={onJoin}>{full ? "Rejoindre la liste d’attente" : "Rejoindre"} <ArrowRight size={15} /></button>
          )}
        </div>
      </div>
    </article>
  );
}
