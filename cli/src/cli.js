import { help, commandRemoved, useProfile, release, printVersion } from "./commands/misc.js";
import { newChange } from "./commands/new-change.js";
import { enrich } from "./commands/enrich.js";
import { propose } from "./commands/propose.js";
import { analyze } from "./commands/analyze.js";
import { bootstrap } from "./commands/bootstrap.js";
import { verify } from "./commands/verify.js";
import { close } from "./commands/close.js";
import { status } from "./commands/status.js";
import { doctor } from "./commands/doctor.js";
import { prompt } from "./commands/prompt.js";

// The full command dispatch. Every handler now lives in its own
// cli/src/commands/<command>.js — this is the pure dispatch the original
// architectural audit asked for, reached in nine mechanical, independently
// verified slices (cli.js: 1978 -> 1978 lines of handlers extracted to
// commands/shared.js, commands/misc.js, commands/new-change.js,
// commands/enrich.js, commands/propose.js, commands/analyze.js,
// commands/bootstrap.js, commands/verify.js, commands/close.js,
// commands/status.js, commands/doctor.js, commands/prompt.js).
export function main(args) { const [command, ...rest] = args; switch (command) { case "help": case "--help": case "-h": case undefined: help(rest[0]); break; case "--version": case "-v": printVersion(); break; case "explain": help(rest[0]); break; case "doctor": doctor(rest); break; case "status": status(rest); break; case "bootstrap": bootstrap(rest); break; case "adopt": commandRemoved("adopt"); break; case "analyze": analyze(rest); break; case "init": commandRemoved("init"); break; case "new-change": newChange(rest); break; case "enrich": enrich(rest); break; case "propose": propose(rest); break; case "prompt": prompt(rest); break; case "close": close(rest); break; case "use-profile": useProfile(rest[0]); break; case "verify": verify(rest); break; case "release": release(rest[0]); break; default: console.error(`Unknown command: ${command}`); help(); process.exitCode = 1; }}
