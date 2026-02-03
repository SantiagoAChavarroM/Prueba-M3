// CRUD of events + registration to events validating capacity.
import { http } from "./http.js";

export async function getEvents() {
  return http.get(`/events?_sort=date&_order=asc`);
}

export async function getEventById(id) {
  try {
    return await http.get(`/events/${id}`);
  } catch {

    throw new Error("Event not found.");
  }
}

export async function createEvent(payload) {
  const now = new Date().toISOString();
  return http.post("/events", {
    ...payload,
    registeredCount: 0,
    createdAt: now,
    updatedAt: now
  });
}

export async function updateEvent(id, payload) {
  const now = new Date().toISOString();
  return http.patch(`/events/${id}`, { ...payload, updatedAt: now });
}

export async function deleteEvent(id) {
  return http.del(`/events/${id}`);
}

export async function registerToEvent(eventId, userId) {
  const event = await getEventById(eventId);

  if (event.registeredCount >= event.capacity) {
    throw new Error("Event is full.");
  }

  const existing = await http.get(`/registrations?eventId=${eventId}&userId=${userId}`);
  if (existing.length > 0) {
    throw new Error("You are already registered for this event.");
  }

  await http.post("/registrations", {
    eventId,
    userId,
    createdAt: new Date().toISOString()
  });

  await updateEvent(eventId, { registeredCount: event.registeredCount + 1 });
  return true;
}
