import { Bike, Footprints, Mountain } from "lucide-react";

export const activities = {
  hiking: { label: "Randonnée", icon: Footprints, speed: "km/h", tint: "moss" },
  running: { label: "Course", icon: Footprints, speed: "min/km", tint: "violet" },
  trail: { label: "Trail", icon: Mountain, speed: "min/km", tint: "lime" },
  cycling: { label: "Vélo", icon: Bike, speed: "km/h", tint: "pine" }
};

export const filters = [
  { id: "all", label: "Toutes les sorties" },
  { id: "hiking", label: "Randonnée" },
  { id: "running", label: "Course" },
  { id: "trail", label: "Trail" },
  { id: "cycling", label: "Vélo" }
];

export const emptyForm = {
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

export const appBasePath = import.meta.env.BASE_URL;
