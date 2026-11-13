// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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

  beforeEach(() => {
    outings = makeOutings();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async (url, options = {}) => {
      const path = new URL(url, "http://localhost").pathname;
      if (path.endsWith("/api/auth/me")) {
        return jsonResponse({ error: "Connectez-vous pour continuer." }, 401);
      }
      if (path.endsWith("/api/auth/login") && options.method === "POST") {
        return jsonResponse({ user: currentUser });
      }
      if (path.endsWith("/api/outings") && !options.method) {
        return jsonResponse({ outings });
      }
      if (path.endsWith("/api/outings/10/participants") && options.method === "POST") {
        outings = makeOutings(true);
        return jsonResponse({ message: "Inscription confirmée." }, 201);
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

  it("permet de rejoindre une sortie disponible et désactive celle qui est complète", async () => {
    const user = await logIn();

    expect(screen.getByRole("button", { name: "Complet" }).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: /Rejoindre/ }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Inscrit·e/ })).toBeTruthy();
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/outings/10/participants"),
      expect.objectContaining({ method: "POST" })
    );
    expect(screen.getByRole("button", { name: "Complet" }).disabled).toBe(true);
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
});
