<div align="center">

<img src="https://kaged.dev/hero.svg" alt="kaged" width="100%" />

# 影 @kaged/plugin-types

**shadow ops for your `[contract]`**

Pure TypeScript interface types for [kaged](https://kaged.dev) system plugins — `SystemPlugin`, `SystemPluginContext`, `DaemonHooks`, `PluginLogger`, and friends. Zero dependencies, zero runtime code.

[![npm](https://img.shields.io/npm/v/@kaged/plugin-types?color=FFB000&label=npm&labelColor=0A0A0B)](https://www.npmjs.com/package/@kaged/plugin-types)
[![license](https://img.shields.io/badge/license-AGPL--3.0-FF2E63?labelColor=0A0A0B)](#license)
[![runtime](https://img.shields.io/badge/runtime-bun-00E0FF?labelColor=0A0A0B)](https://bun.com)

</div>

---

## what it is

The type contract every kaged system plugin implements against. Published standalone so plugin authors can `import type` without depending on the daemon. No runtime code — pure interfaces and type aliases, shipped as TypeScript source (`main: src/index.ts`).

```
> 影 @kaged/plugin-types
> SystemPlugin ......... plugin lifecycle contract (setup, teardown)
> SystemPluginContext ... config, logger, hook registration
> DaemonHooks .......... auth, daemon, config lifecycle callbacks
> PluginLogger ......... structured logging interface
> system nominal.
```

## install

```bash
bun add -d @kaged/plugin-types
```

Type-only — add as a `devDependency`. Imports are `import type` and erased at runtime.

## what's in the box

| Export | What it is |
|---|---|
| `SystemPlugin` | The contract a plugin's default export must satisfy — `name`, `version`, `description`, `setup()`, `teardown()` |
| `SystemPluginContext` | API surface passed to `setup()` — config, logger, hook registration (`on`/`off`) |
| `DaemonHooks` | Callback map for lifecycle hooks (`auth.launchUrlReady`, `auth.cookieIssued`, `daemon.ready`, `daemon.shutdown`, `config.updated`) |
| `DaemonReadyInfo` | Payload for `daemon.ready` — port, baseUrl, mode |
| `CookieIssuedInfo` | Payload for `auth.cookieIssued` — userId, sessionId |
| `HookName` | Union of `keyof DaemonHooks` |
| `PluginLogger` | Structured logger interface (`info`, `warn`, `error`, `debug`) |
| `SystemPluginState` | Runtime state union: `"disabled" \| "loading" \| "active" \| "stopped" \| "failed"` |

```ts
import type { SystemPlugin, SystemPluginContext } from "@kaged/plugin-types";

const plugin: SystemPlugin = {
  name: "my-plugin",
  version: "0.1.0",
  description: "Does the thing",
  setup(ctx: SystemPluginContext) {
    ctx.on("daemon.ready", (info) => {
      ctx.log.info("ready", { port: info.port });
    });
  },
};

export default plugin;
```

## development

```bash
bun install
bun run typecheck
bun run format      # biome
```

## release

Bump `version` in `package.json`, tag `v<version>`, push the tag. CI verifies the tag matches, runs the suite, and publishes to npm with provenance.

---

## license

AGPL-3.0 © the kaged project

<div align="center">

`[kaged]` · [kaged.dev](https://kaged.dev) · *sanctioned edge, sacred code*

</div>
