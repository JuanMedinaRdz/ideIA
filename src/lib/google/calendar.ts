// Google Calendar API v3 — REST puro. Solo usamos 3 verbos del endpoint
// /calendars/primary/events.
// Docs: https://developers.google.com/calendar/api/v3/reference/events

const BASE = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

interface CalendarEventInput {
  summary: string;
  description?: string;
  /** ISO 8601 con TZ. */
  startISO: string;
  /** ISO 8601 con TZ. */
  endISO: string;
}

export interface CalendarEventOutput {
  id: string;
  htmlLink: string;
  status: string;
}

/**
 * Construye el body para create/update. Calendar API quiere `start` y `end`
 * como objetos con `dateTime` (para eventos con hora) o `date` (todo el día).
 * Siempre usamos dateTime + timeZone = "America/Mexico_City".
 */
function buildEventBody(input: CalendarEventInput) {
  return {
    summary: input.summary,
    description: input.description ?? undefined,
    start: { dateTime: input.startISO, timeZone: "America/Mexico_City" },
    end: { dateTime: input.endISO, timeZone: "America/Mexico_City" },
    // source.title sale en la vista de evento como "Created via ideIA".
    source: { title: "ideIA", url: "https://ide-ia-chi.vercel.app" },
  };
}

async function callApi<T>(
  accessToken: string,
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar ${method} ${path} failed: ${res.status} ${text}`);
  }
  // DELETE responde 204 sin body.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function createCalendarEvent(
  accessToken: string,
  input: CalendarEventInput,
): Promise<CalendarEventOutput> {
  return callApi<CalendarEventOutput>(accessToken, "POST", "", buildEventBody(input));
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  input: CalendarEventInput,
): Promise<CalendarEventOutput> {
  return callApi<CalendarEventOutput>(accessToken, "PATCH", `/${eventId}`, buildEventBody(input));
}

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string,
): Promise<void> {
  await callApi<void>(accessToken, "DELETE", `/${eventId}`);
}
