/**
 * @kaged/plugin-types — Notification channel contract.
 *
 * The daemon's notification router (per docs/specs/notifications.md, ADR-0047)
 * dispatches normalised `NotificationEvent`s to registered `NotificationChannel`s.
 * System plugins register channels via the `notification.channel.register` hook
 * (added to `DaemonHooks` in v0.0.2).
 *
 * This file defines the channel contract that plugins (ntfy, pushover, etc.)
 * implement and the daemon invokes. Zero runtime code — pure types.
 */

// ── Event payload ──────────────────────────────────────────────────────

/** Event class — the router's discrimination key. */
export type NotificationClass = "attention.required" | "run.completed";

/** Attention sub-kind — what kind of attention is needed. */
export type AttentionKind = "checkpoint" | "ask" | "approval_gate";

/** Run completion outcome — terminal state of a run. */
export type RunOutcome = "success" | "failed" | "cancelled";

/**
 * NotificationEvent — the normalised payload emitted on the `events` WS
 * channel with type `attention.required` or `run.completed`, and the shape
 * plugin channels receive in `send()`.
 *
 * Per docs/specs/notifications.md § Payload.
 */
export interface NotificationEvent {
	/** Stable event id (ULID). Used for idempotent consumption. */
	readonly id: string;
	readonly class: NotificationClass;
	readonly session_id: string;
	readonly project_id: string;
	readonly run_id: string;
	/** Short human label, e.g. "Session \"music-site\" is asking a question". */
	readonly summary: string;
	/** Absolute path the client navigates to. */
	readonly deep_link: string;
	/** Millisecond epoch. */
	readonly emitted_at: number;
	/** Present iff class === "attention.required". */
	readonly attention_kind?: AttentionKind;
	/** Present iff class === "run.completed". */
	readonly run_outcome?: RunOutcome;
}

// ── Delivery outcome ───────────────────────────────────────────────────

/**
 * What a channel returns from `send()`. Channels MUST NOT throw on delivery
 * failure — they catch internally and return a `failed` outcome so the router
 * can audit the result and continue dispatching to other channels in parallel.
 */
export type DeliveryOutcome =
	| { readonly status: "delivered"; readonly external_id?: string }
	| { readonly status: "failed"; readonly reason: string; readonly retryable: boolean };

// ── Channel contract ───────────────────────────────────────────────────

/**
 * Per-dispatch context handed to `send()`. Carries the resolved per-channel
 * config (after set-not-merge across system → project → session layers) so
 * the channel can pick up overrides like a different `topic` per project
 * without needing its own plugin instance.
 */
export interface ChannelContext {
	readonly operatorId: string;
	/** Resolved routing config (after set-not-merge) for this channel + event class. */
	readonly config: Record<string, unknown>;
}

/**
 * Uniform channel contract every notification channel implements —
 * built-in (`in-app`, `web-push`) and plugin (`ntfy`, `pushover`, etc.).
 *
 * The daemon's `NotificationRouter` calls `send()` in parallel across all
 * eligible channels for an event. `send()` is awaited; a channel that throws
 * synchronously is treated as `{ status: "failed", reason: "threw", retryable: false }`.
 */
export interface NotificationChannel {
	/** Stable channel id. Lowercase, kebab-case. Examples: "in-app", "web-push", "ntfy", "pushover". */
	readonly id: string;

	/**
	 * Human-readable label, shown in the UI's notification settings panel.
	 * Travels via `GET /api/v1/notifications/channels`; does NOT travel in the
	 * event payload.
	 */
	readonly label: string;

	/**
	 * Delivers a notification. MUST NOT throw on delivery failure — log and
	 * return a `DeliveryOutcome` so the router can audit the result. The router
	 * awaits all channels in parallel and does not let one slow channel block
	 * another.
	 *
	 * Implementation MAY apply its own backoff/retry internally; the router
	 * treats the call as a single dispatch.
	 */
	send(notification: NotificationEvent, context: ChannelContext): Promise<DeliveryOutcome>;
}

/**
 * Adapter the daemon passes to the `notification.channel.register` hook.
 * Plugins call `register(channel)` to make their channel eligible for
 * dispatch; `unregister(channelId)` removes it (useful for hot-reload).
 *
 * Registration is idempotent on `channel.id` — later registration with the
 * same id replaces the earlier.
 */
export interface NotificationChannelRegistrar {
	register(channel: NotificationChannel): void;
	unregister(channelId: string): void;
}

// ── Per-session bell ───────────────────────────────────────────────────

/**
 * Per-session bell override values. Set via
 * `PUT /api/v1/projects/:slug/sessions/:sid/notification-bell`.
 *
 * Per docs/specs/notifications.md § Per-session bell values:
 * - `"default"`: inherit project routing.
 * - `"all"`: explicit default.
 * - `"attention-only"`: suppress `run.completed`.
 * - `"silent"`: suppress tier-3 dispatch only (in-app still renders when live).
 */
export type SessionBellValue = "default" | "all" | "attention-only" | "silent";

// ── Channel descriptor (read-only surface) ─────────────────────────────

/** Channel descriptor returned by `GET /api/v1/notifications/channels`. */
export interface NotificationChannelDescriptor {
	readonly id: string;
	readonly label: string;
	readonly kind: "builtin" | "plugin";
	/** Plugin name when kind === "plugin"; absent for builtins. */
	readonly plugin?: string;
}
