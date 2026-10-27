import test from "node:test";
import assert from "node:assert/strict";
import { validateOuting } from "../src/validation.js";

const validOuting = {
  title: "Sortie de test",
  activity: "hiking",
  routeDescription: "",
  meetingPlace: "Parking des Baumettes",
  meetingMapsUrl: "https://maps.google.com/?q=Baumettes",
  distanceKm: 12,
  date: "2099-06-15",
  time: "09:00",
  timezoneOffsetMinutes: 0,
  averageSpeed: 4,
  maxParticipants: 12
};

test("accepts an outing with optional information omitted", () => {
  const result = validateOuting(validOuting);

  assert.equal(result.error, undefined);
  assert.equal(result.value.routeDescription, "");
  assert.equal(result.value.gpxUrl, null);
  assert.equal(result.value.gpxContent, null);
  assert.equal(result.value.elevationGainM, null);
  assert.equal(result.value.elevationLossM, null);
});

test("requires a Google Maps meeting point link", () => {
  assert.match(validateOuting({ ...validOuting, meetingMapsUrl: "" }).error, /Google Maps/);
  assert.match(validateOuting({
    ...validOuting,
    meetingMapsUrl: "https://example.com/meeting"
  }).error, /Google Maps/);
});

test("accepts either a GPX link or a GPX file, but not both", () => {
  const content = '<?xml version="1.0"?><gpx><trk></trk></gpx>';

  assert.equal(validateOuting({ ...validOuting, gpxContent: content }).value.gpxContent, content);
  assert.equal(
    validateOuting({ ...validOuting, gpxUrl: "https://example.com/route.gpx" }).value.gpxUrl,
    "https://example.com/route.gpx"
  );
  assert.match(validateOuting({
    ...validOuting,
    gpxUrl: "https://example.com/route.gpx",
    gpxContent: content
  }).error, /pas les deux/);
  assert.match(validateOuting({ ...validOuting, gpxContent: "<html></html>" }).error, /GPX valide/);
});

test("accepts non-negative integer elevation values and rejects invalid ones", () => {
  const result = validateOuting({
    ...validOuting,
    elevationGainM: 650,
    elevationLossM: 640
  });

  assert.equal(result.value.elevationGainM, 650);
  assert.equal(result.value.elevationLossM, 640);
  assert.match(validateOuting({ ...validOuting, elevationGainM: -1 }).error, /positif/);
  assert.match(validateOuting({ ...validOuting, elevationLossM: 4.5 }).error, /négatif/);
});
