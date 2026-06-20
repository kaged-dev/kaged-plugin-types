import { describe, expect, test } from "bun:test";
import type {
	CookieIssuedInfo,
	DaemonHooks,
	DaemonReadyInfo,
	HookName,
	PluginLogger,
	SystemPlugin,
	SystemPluginContext,
	SystemPluginState,
} from "../src/index.ts";

describe("plugin-types", () => {
	test("SystemPlugin satisfies the contract", () => {
		const plugin: SystemPlugin = {
			name: "test",
			version: "0.0.0",
			description: "test plugin",
			setup(_ctx: SystemPluginContext) {},
			teardown() {},
		};
		expect(plugin.name).toBe("test");
		expect(plugin.version).toBe("0.0.0");
	});

	test("SystemPluginState covers all variants", () => {
		const states: SystemPluginState[] = ["disabled", "loading", "active", "stopped", "failed"];
		expect(states).toHaveLength(5);
	});

	test("HookName union covers all hooks", () => {
		const hooks: HookName[] = [
			"auth.launchUrlReady",
			"auth.cookieIssued",
			"daemon.ready",
			"daemon.shutdown",
			"config.updated",
		];
		expect(hooks).toHaveLength(5);
	});

	test("DaemonReadyInfo shape", () => {
		const info: DaemonReadyInfo = { port: 13000, baseUrl: "http://localhost:13000", mode: "dev" };
		expect(info.port).toBe(13000);
	});

	test("CookieIssuedInfo shape", () => {
		const info: CookieIssuedInfo = { userId: "u1", sessionId: "s1" };
		expect(info.userId).toBe("u1");
	});

	test("PluginLogger shape", () => {
		const log: PluginLogger = {
			info() {},
			warn() {},
			error() {},
			debug() {},
		};
		expect(typeof log.info).toBe("function");
	});

	test("DaemonHooks callback signatures are callable", () => {
		const hooks: DaemonHooks = {
			"auth.launchUrlReady": (_url: string) => {},
			"auth.cookieIssued": (_info: CookieIssuedInfo) => {},
			"daemon.ready": (_info: DaemonReadyInfo) => {},
			"daemon.shutdown": () => {},
			"config.updated": (_cfg: Record<string, unknown>) => {},
			"notification.channel.register": (_registrar) => {},
		};
		expect(Object.keys(hooks)).toHaveLength(6);
	});
});
