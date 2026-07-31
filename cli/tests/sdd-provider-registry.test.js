import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { hasProvider, getProvider, providerIds } from "../src/sdd-providers/index.js";
import { resolveSddProvider } from "../src/core/domain/sdd-provider-resolver.js";

function tempCwd() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aief-sdd-resolver-"));
}

function withRestrictedPath(fn) {
  const original = process.env.PATH;
  process.env.PATH = path.dirname(process.execPath);
  try {
    return fn();
  } finally {
    process.env.PATH = original;
  }
}

test("registry: mirrors requirement-providers/index.js's shape — hasProvider/getProvider/providerIds", () => {
  assert.equal(hasProvider("local"), true);
  assert.equal(hasProvider("openspec"), true);
  assert.equal(hasProvider("bogus"), false);
  assert.deepEqual(providerIds().sort(), ["local", "openspec"]);
  assert.equal(getProvider("local").PROVIDER_ID, "local");
});

test("resolveSddProvider: no sdd section -> falls through to OpenSpec detection, then local default", () => {
  withRestrictedPath(() => {
    const cwd = tempCwd();
    const result = resolveSddProvider({ manifest: null }, cwd);
    assert.equal(result.provider.PROVIDER_ID, "local");
    assert.equal(result.source, "default");
  });
});

test("resolveSddProvider: unambiguous OpenSpec structure is detected before falling back to local", () => {
  withRestrictedPath(() => {
    const cwd = tempCwd();
    fs.mkdirSync(path.join(cwd, "openspec"));
    const result = resolveSddProvider({ manifest: null }, cwd);
    assert.equal(result.provider.PROVIDER_ID, "openspec");
    assert.equal(result.source, "detected");
  });
});

test("resolveSddProvider: an explicit manifest.sdd.provider always wins, even when OpenSpec is also detected", () => {
  withRestrictedPath(() => {
    const cwd = tempCwd();
    fs.mkdirSync(path.join(cwd, "openspec"));
    const change = { manifest: { sdd: { provider: "local" } } };
    const result = resolveSddProvider(change, cwd);
    assert.equal(result.provider.PROVIDER_ID, "local");
    assert.equal(result.source, "manifest");
  });
});

test("resolveSddProvider: an unknown declared provider is an explicit error, never silently mapped to a known one", () => {
  const cwd = tempCwd();
  const change = { manifest: { sdd: { provider: "totally-unknown" } } };
  const result = resolveSddProvider(change, cwd);
  assert.ok(result.error);
  assert.match(result.error, /unknown SDD provider/);
  assert.equal(result.provider, undefined);
});

test("resolveSddProvider: a declared-but-unavailable provider does not fall back silently to local", () => {
  withRestrictedPath(() => {
    const cwd = tempCwd(); // no openspec/ structure, no CLI on restricted PATH
    const change = { manifest: { sdd: { provider: "openspec" } } };
    const result = resolveSddProvider(change, cwd);
    assert.ok(result.error);
    assert.match(result.error, /configured provider "openspec" is unavailable/);
    assert.equal(result.provider, undefined, "must not silently resolve to local despite the explicit declaration");
  });
});

test("resolveSddProvider: knowledge/sdd-provider.json (project-config) wins over OpenSpec detection", () => {
  withRestrictedPath(() => {
    const cwd = tempCwd();
    fs.mkdirSync(path.join(cwd, "openspec"));
    fs.mkdirSync(path.join(cwd, "knowledge"));
    fs.writeFileSync(path.join(cwd, "knowledge", "sdd-provider.json"), JSON.stringify({ provider: "local" }), "utf8");
    const result = resolveSddProvider({ manifest: null }, cwd);
    assert.equal(result.provider.PROVIDER_ID, "local");
    assert.equal(result.source, "project-config");
  });
});

test("resolveSddProvider: an explicit manifest.sdd.provider still wins over knowledge/sdd-provider.json", () => {
  withRestrictedPath(() => {
    const cwd = tempCwd();
    fs.mkdirSync(path.join(cwd, "knowledge"));
    fs.writeFileSync(path.join(cwd, "knowledge", "sdd-provider.json"), JSON.stringify({ provider: "openspec" }), "utf8");
    const change = { manifest: { sdd: { provider: "local" } } };
    const result = resolveSddProvider(change, cwd);
    assert.equal(result.provider.PROVIDER_ID, "local");
    assert.equal(result.source, "manifest");
  });
});

test("resolveSddProvider: an unknown provider in knowledge/sdd-provider.json is an explicit error, never a silent fallback", () => {
  const cwd = tempCwd();
  fs.mkdirSync(path.join(cwd, "knowledge"));
  fs.writeFileSync(path.join(cwd, "knowledge", "sdd-provider.json"), JSON.stringify({ provider: "bogus" }), "utf8");
  const result = resolveSddProvider({ manifest: null }, cwd);
  assert.ok(result.error);
  assert.match(result.error, /unknown SDD provider/);
  assert.equal(result.provider, undefined);
});

test("resolveSddProvider: malformed knowledge/sdd-provider.json is reported, never thrown", () => {
  const cwd = tempCwd();
  fs.mkdirSync(path.join(cwd, "knowledge"));
  fs.writeFileSync(path.join(cwd, "knowledge", "sdd-provider.json"), "{not json", "utf8");
  const result = resolveSddProvider({ manifest: null }, cwd);
  assert.ok(result.error);
  assert.match(result.error, /not valid JSON/);
});

test("resolveSddProvider: is deterministic — same change/cwd, same result, every call", () => {
  withRestrictedPath(() => {
    const cwd = tempCwd();
    const change = { manifest: null };
    const first = resolveSddProvider(change, cwd);
    const second = resolveSddProvider(change, cwd);
    assert.equal(first.provider.PROVIDER_ID, second.provider.PROVIDER_ID);
    assert.equal(first.source, second.source);
  });
});
