export type SessionFlowBookingStatus = "reserved" | "completed" | "cancelled" | "late_cancel";

export type SessionFlowEvent =
  | { id: string; type: "purchase"; sessions: number }
  | { id: string; type: "book"; bookingId: string }
  | { id: string; type: "complete"; bookingId: string }
  | { id: string; type: "cancel_on_time"; bookingId: string }
  | { id: string; type: "late_cancel"; bookingId: string };

export type SessionFlowTimelineItem = {
  id: string;
  type: SessionFlowEvent["type"] | "duplicate_ignored" | "rejected";
  balance: number;
  reserved: number;
  bookingId?: string;
  reason?: "duplicate" | "purchase_required" | "insufficient_balance" | "booking_not_reserved";
};

export type SessionFlowState = {
  purchased: number;
  balance: number;
  reserved: number;
  consumed: number;
  duplicateEventsDetected: number;
  processedEventIds: string[];
  bookings: Record<string, SessionFlowBookingStatus>;
  timeline: SessionFlowTimelineItem[];
};

export const EMPTY_SESSION_FLOW: SessionFlowState = {
  purchased: 0,
  balance: 0,
  reserved: 0,
  consumed: 0,
  duplicateEventsDetected: 0,
  processedEventIds: [],
  bookings: {},
  timeline: [],
};

function appendTimeline(
  state: SessionFlowState,
  event: SessionFlowEvent,
  type: SessionFlowTimelineItem["type"] = event.type,
  reason?: SessionFlowTimelineItem["reason"],
): SessionFlowState {
  return {
    ...state,
    timeline: [...state.timeline, {
      id: `${event.id}:${state.timeline.length}`,
      type,
      balance: state.balance,
      reserved: state.reserved,
      bookingId: "bookingId" in event ? event.bookingId : undefined,
      reason,
    }],
  };
}

export function applySessionFlowEvent(state: SessionFlowState, event: SessionFlowEvent): SessionFlowState {
  if (state.processedEventIds.includes(event.id)) {
    return appendTimeline({
      ...state,
      duplicateEventsDetected: state.duplicateEventsDetected + 1,
    }, event, "duplicate_ignored", "duplicate");
  }

  const acceptedState = { ...state, processedEventIds: [...state.processedEventIds, event.id] };

  if (event.type === "purchase") {
    if (!Number.isInteger(event.sessions) || event.sessions <= 0) {
      return appendTimeline(acceptedState, event, "rejected", "purchase_required");
    }
    return appendTimeline({
      ...acceptedState,
      purchased: acceptedState.purchased + event.sessions,
      balance: acceptedState.balance + event.sessions,
    }, event);
  }

  if (event.type === "book") {
    if (acceptedState.purchased === 0) {
      return appendTimeline(acceptedState, event, "rejected", "purchase_required");
    }
    if (acceptedState.balance - acceptedState.reserved <= 0) {
      return appendTimeline(acceptedState, event, "rejected", "insufficient_balance");
    }
    return appendTimeline({
      ...acceptedState,
      reserved: acceptedState.reserved + 1,
      bookings: { ...acceptedState.bookings, [event.bookingId]: "reserved" },
    }, event);
  }

  if (acceptedState.bookings[event.bookingId] !== "reserved") {
    return appendTimeline(acceptedState, event, "rejected", "booking_not_reserved");
  }

  if (event.type === "cancel_on_time") {
    return appendTimeline({
      ...acceptedState,
      reserved: acceptedState.reserved - 1,
      bookings: { ...acceptedState.bookings, [event.bookingId]: "cancelled" },
    }, event);
  }

  const status: SessionFlowBookingStatus = event.type === "complete" ? "completed" : "late_cancel";
  return appendTimeline({
    ...acceptedState,
    balance: acceptedState.balance - 1,
    reserved: acceptedState.reserved - 1,
    consumed: acceptedState.consumed + 1,
    bookings: { ...acceptedState.bookings, [event.bookingId]: status },
  }, event);
}

export const FULL_SESSION_FLOW_EVENTS: SessionFlowEvent[] = [
  { id: "purchase-pack-8", type: "purchase", sessions: 8 },
  { id: "book-completed", type: "book", bookingId: "session-completed" },
  { id: "complete-session", type: "complete", bookingId: "session-completed" },
  { id: "complete-session", type: "complete", bookingId: "session-completed" },
  { id: "book-cancelled", type: "book", bookingId: "session-cancelled" },
  { id: "cancel-on-time", type: "cancel_on_time", bookingId: "session-cancelled" },
  { id: "book-no-show", type: "book", bookingId: "session-no-show" },
  { id: "late-cancel", type: "late_cancel", bookingId: "session-no-show" },
];

export function runFullSessionFlow(): SessionFlowState {
  return FULL_SESSION_FLOW_EVENTS.reduce(applySessionFlowEvent, EMPTY_SESSION_FLOW);
}

export function sessionFlowChecks(state: SessionFlowState) {
  return {
    purchaseAddedOnce: state.purchased === 8,
    completedConsumed: state.bookings["session-completed"] === "completed" && state.consumed >= 1,
    timelyCancellationReleased: state.bookings["session-cancelled"] === "cancelled",
    lateCancellationConsumed: state.bookings["session-no-show"] === "late_cancel" && state.consumed === 2,
    duplicateIgnored: state.duplicateEventsDetected >= 1,
    finalBalanceCorrect: state.balance === 6 && state.reserved === 0,
  };
}
