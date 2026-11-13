// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";

const currentUser = { id: 1, fullName: "Camille Martin", email: "camille@example.fr" };

function makeOutings(userJoined = false) {
  return [
    {
      id: 10,
      organizer_id: 2,
      title: "Randonnée au Garlaban",
      activity: "hiking",
      route_description: "Boucle panoramique",
      meeting_place: "Parking des Baumettes",
      meeting_maps_url: "https://maps.google.com/?q=Baumettes",
      distance_km: "12.00",
      event_date: "2099-06-15",
      start_time: "09:00:00",
      average_speed: "4.50",
      max_participants: 3,
      organizer_name: "Léa Fournier",
      participant_count: userJoined ? 2 : 1,
      waitlist_count: 0,
      user_is_waitlisted: false,
      waitlist_position: null,
      user_is_joined: userJoined,
      participants: userJoined
        ? [{ id: 1, fullName: currentUser.fullName }, { id: 2, fullName: "Léa Fournier" }]
        : [{ id: 2, fullName: "Léa Fournier" }]
    },
    {
      id: 11,
      organizer_id: 3,
      title: "Vélo sur la Côte Bleue",
      activity: "cycling",
      route_description: "",
      meeting_place: "Vieux-Port",
      meeting_maps_url: "https://maps.google.com/?q=Vieux-Port",
      distance_km: "35.00",
      event_date: "2099-06-16",
      start_time: "08:00:00",
      average_speed: "20.00",
      max_participants: 2,
      organizer_name: "Hugo Bernard",
      participant_count: 2,
      waitlist_count: 0,
      user_is_waitlisted: false,
      waitlist_position: null,
      user_is_joined: false,
      participants: [{ id: 3, fullName: "Hugo Bernard" }, { id: 4, fullName: "Sami Diallo" }]
    }
  ];
}

function jsonResponse(body, status = 200) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body
  };
}

describe("parcours des sorties", () => {
  let outings;
  let userIsWaitlisted;
  let notifications;

  beforeEach(() => {
    outings = makeOutings();
    userIsWaitlisted = false;
    notifications = [];
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (url, options = {}) => {
      const path = new URL(url, "http://localhost").pathname;
      if (path.endsWith("/api/auth/me")) {
        return jsonResponse({ error: "Connectez-vous pour continuer." }, 401);
      }
      if (path.endsWith("/api/auth/login") && options.method === "POST") {
        return jsonResponse({ user: currentUser });
      }
      if (path.endsWith("/api/notifications") && !options.method) {
        return jsonResponse({
          notifications,
          unreadCount: notifications.filter((notification) => !notification.read_at).length
        });
      }
      if (path.endsWith("/api/notifications/100/read") && options.method === "PATCH") {
        notifications = notifications.map((notification) => (
          notification.id === 100 ? { ...notification, read_at: "2026-11-13T10:00:00Z" } : notification
        ));
        return jsonResponse({ message: "Notification marquée comme lue." });
      }
      if (path.endsWith("/api/outings") && !options.method) {
        outings[1].waitlist_count = userIsWaitlisted ? 1 : 0;
        outings[1].user_is_waitlisted = userIsWaitlisted;
        outings[1].waitlist_position = userIsWaitlisted ? 1 : null;
        return jsonResponse({ outings });
      }
      if (path.endsWith("/api/outings/10/participants") && options.method === "POST") {
        outings = makeOutings(true);
        return jsonResponse({ message: "Inscription confirmée." }, 201);
      }
      if (path.endsWith("/api/outings/11/participants") && options.method === "POST") {
        userIsWaitlisted = true;
        return jsonResponse({ message: "Inscription sur liste d’attente confirmée." }, 202);
      }
      if (path.endsWith("/api/outings/11/participants/me") && options.method === "DELETE") {
        userIsWaitlisted = false;
        return jsonResponse(null, 204);
      }
      return jsonResponse({ error: "Route de test inattendue." }, 404);
    }));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function logIn(user = userEvent.setup()) {
    render(<App />);
    await user.type(await screen.findByLabelText("Adresse e-mail"), currentUser.email);
    await user.type(screen.getByLabelText("Mot de passe"), "motdepasse");
    await user.click(screen.getByRole("button", { name: /Se connecter/ }));
    await screen.findByRole("heading", { name: /Les sorties/ });
    await screen.findByRole("button", { name: "Randonnée au Garlaban" });
    return user;
  }

  it("affiche les sorties, filtre par activité et par recherche", async () => {
    const user = await logIn();

    expect(screen.getByRole("button", { name: "Randonnée au Garlaban" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Vélo sur la Côte Bleue" })).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "Randonnée" }));
    expect(screen.getByRole("button", { name: "Randonnée au Garlaban" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Vélo sur la Côte Bleue" })).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Toutes les sorties" }));
    await user.type(screen.getByRole("textbox", {
      name: "Rechercher par activité, nom, description ou lieu"
    }), "Côte Bleue");
    expect(screen.getByRole("button", { name: "Vélo sur la Côte Bleue" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Randonnée au Garlaban" })).toBeNull();
  });

  it("permet de rejoindre une sortie disponible", async () => {
    const user = await logIn();

    await user.click(screen.getByRole("button", { name: "Rejoindre" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Inscrit·e/ })).toBeTruthy();
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/outings/10/participants"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("permet de rejoindre une sortie disponible depuis sa fiche détaillée", async () => {
    const user = await logIn();

    await user.click(screen.getByRole("button", { name: "Randonnée au Garlaban" }));
    const details = screen.getByRole("dialog", { name: "Randonnée au Garlaban" });
    await user.click(within(details).getByRole("button", { name: "Rejoindre" }));

    expect(await within(details).findByRole("button", { name: /Inscrit·e/ })).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/outings/10/participants"),
      expect.objectContaining({ method: "POST" })
    );
  });

  it("permet de rejoindre puis de quitter la liste d’attente d’une sortie complète", async () => {
    const user = await logIn();

    await user.click(screen.getByRole("button", { name: "Rejoindre la liste d’attente" }));
    expect(await screen.findByRole("button", { name: "En attente · 1" })).toBeTruthy();
    expect(screen.getByText("Complet · 1 en attente")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "En attente · 1" }));
    expect(await screen.findByRole("button", { name: "Rejoindre la liste d’attente" })).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/outings/11/participants/me"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("sépare les sorties passées des inscriptions à venir dans le profil", async () => {
    outings = makeOutings(true);
    outings.push(
      {
        ...outings[0],
        id: 12,
        title: "Sortie passée",
        event_date: "2000-06-15",
        start_time: "09:00:00",
        participant_count: 2,
        participants: [{ id: 1, fullName: currentUser.fullName }, { id: 2, fullName: "Léa Fournier" }]
      },
      {
        ...outings[0],
        id: 13,
        organizer_id: currentUser.id,
        title: "Sortie organisée par Camille",
        event_date: "2099-06-17",
        participant_count: 1,
        user_is_joined: true,
        participants: [{ id: currentUser.id, fullName: currentUser.fullName }]
      }
    );
    const user = await logIn();

    await user.click(screen.getByRole("button", { name: "Voir le profil de Camille Martin" }));
    expect(screen.getByRole("button", { name: /Sortie passée/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Randonnée au Garlaban/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Sortie organisée par Camille/ })).toBeNull();

    await user.click(screen.getByRole("tab", { name: /Inscriptions à venir/ }));
    expect(screen.getByRole("button", { name: /Randonnée au Garlaban/ })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Sortie passée/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Sortie organisée par Camille/ })).toBeNull();
  });

  it("affiche les sorties en liste d’attente dans les inscriptions à venir du profil", async () => {
    userIsWaitlisted = true;
    const user = await logIn();

    await user.click(screen.getByRole("button", { name: "Voir le profil de Camille Martin" }));
    await user.click(screen.getByRole("tab", { name: /Inscriptions à venir/ }));

    expect(screen.getByRole("button", { name: /Vélo sur la Côte Bleue/ })).toBeTruthy();
    expect(screen.getByText(/En attente \(1\)/)).toBeTruthy();
  });

  it("affiche les notifications non lues et ouvre la sortie associée", async () => {
    notifications = [{
      id: 100,
      outing_id: 10,
      message: "Une place s’est libérée : vous êtes inscrit·e à « Randonnée au Garlaban ».",
      created_at: "2026-11-13T10:00:00Z",
      read_at: null,
      outing_title: "Randonnée au Garlaban",
      event_date: "2099-06-15",
      start_time: "09:00"
    }];
    const user = await logIn();

    await user.click(screen.getByRole("button", { name: "Notifications, 1 non lue" }));
    const inbox = screen.getByRole("region", { name: "Centre de notifications" });
    await user.click(within(inbox).getByRole("button", { name: /Une place s’est libérée/ }));

    expect(await screen.findByRole("dialog", { name: "Randonnée au Garlaban" })).toBeTruthy();
    expect(await screen.findByRole("button", { name: "Notifications" })).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/notifications/100/read"),
      expect.objectContaining({ method: "PATCH" })
    );
  });
});
