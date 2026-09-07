// Standalone entry point for the Bot Arena connector. Deliberately thin.
//
// Everything with a decision in it lives in service.ts, because this file is one
// of TWO entry points and they must not drift: plugin.ts hosts the same connector
// inside borg's demo server, where the demo server owns the Borg instance and the
// schedulers. A composition root shared by both is the only way a change made for
// one cannot silently change the other. This file therefore only parses one flag,
// wires signals to stop(), and reports failures.
//
// Usage:
//   npm start            start the connector, opening its own Borg
//   npm run dry-run      poll and report only
//
// A dry run opens no Borg, runs no turn and posts nothing: it is the safe way to
// confirm the credentials, the thread allowlist and what traffic would be picked
// up, before anything touches Akuki's memory.

import { pathToFileURL } from "node:url";

import { startArenaService } from "./service.js";

const SIGNALS = ["SIGINT", "SIGTERM"] as const;
const SHUTDOWN_TIMEOUT_MS = 30_000;

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const service = await startArenaService({ dryRun });

  let stopping = false;
  for (const signal of SIGNALS) {
    process.on(signal, () => {
      if (stopping) {
        return;
      }
      stopping = true;
      process.stderr.write(`[akuki-arena] info stopping on ${signal}\n`);
      // A stop waits for a turn in progress on purpose; the timeout only stops a
      // hung shutdown from keeping the unit in "deactivating" forever.
      const timeout = setTimeout(() => {
        process.stderr.write("[akuki-arena] error shutdown timed out; exiting anyway\n");
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);
      timeout.unref();

      service.stop().then(
        () => {
          process.exit(0);
        },
        (error: unknown) => {
          process.stderr.write(`[akuki-arena] error shutdown failed ${String(error)}\n`);
          process.exit(1);
        },
      );
    });
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    process.stderr.write(`[akuki-arena] fatal ${String(error)}\n`);
    process.exitCode = 1;
  });
}
