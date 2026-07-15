import { describe, expect, it } from "vitest";
import {
  applySessionFlowEvent,
  EMPTY_SESSION_FLOW,
  runFullSessionFlow,
  sessionFlowChecks,
} from "./session-flow-simulator";

describe("personal training session flow", () => {
  it("runs purchase, attendance, cancellation and no-show without losing balance", () => {
    const state = runFullSessionFlow();
    expect(sessionFlowChecks(state)).toEqual({
      purchaseAddedOnce: true,
      completedConsumed: true,
      timelyCancellationReleased: true,
      lateCancellationConsumed: true,
      duplicateIgnored: true,
      finalBalanceCorrect: true,
    });
    expect(state).toMatchObject({ purchased: 8, balance: 6, reserved: 0, consumed: 2 });
  });

  it("does not consume a session when the client cancels on time", () => {
    const purchased = applySessionFlowEvent(EMPTY_SESSION_FLOW, { id: "purchase", type: "purchase", sessions: 1 });
    const booked = applySessionFlowEvent(purchased, { id: "book", type: "book", bookingId: "booking" });
    const cancelled = applySessionFlowEvent(booked, { id: "cancel", type: "cancel_on_time", bookingId: "booking" });
    expect(cancelled).toMatchObject({ balance: 1, reserved: 0, consumed: 0 });
  });

  it("rejects a reservation when no available credit remains", () => {
    const purchased = applySessionFlowEvent(EMPTY_SESSION_FLOW, { id: "purchase", type: "purchase", sessions: 1 });
    const booked = applySessionFlowEvent(purchased, { id: "book-one", type: "book", bookingId: "one" });
    const rejected = applySessionFlowEvent(booked, { id: "book-two", type: "book", bookingId: "two" });
    expect(rejected.reserved).toBe(1);
    expect(rejected.timeline.at(-1)).toMatchObject({ type: "rejected", reason: "insufficient_balance" });
  });

  it("ignores a repeated provider event id", () => {
    const once = applySessionFlowEvent(EMPTY_SESSION_FLOW, { id: "same-event", type: "purchase", sessions: 8 });
    const twice = applySessionFlowEvent(once, { id: "same-event", type: "purchase", sessions: 8 });
    expect(twice.balance).toBe(8);
    expect(twice.duplicateEventsDetected).toBe(1);
  });
});
