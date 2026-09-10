import test from "node:test";
import assert from "node:assert/strict";

import { detectDuplicateChangeIds } from "../src/core/domain/change-id-collisions.js";

test("detectDuplicateChangeIds: no collisions among unique numeric prefixes", () => {
  const result = detectDuplicateChangeIds(["0001-a", "0002-b", "0003-c"]);
  assert.deepEqual(result, []);
});

test("detectDuplicateChangeIds: two Changes sharing a numeric prefix are grouped together", () => {
  const result = detectDuplicateChangeIds(["0122-ci-apt-chrome-mirror-flakiness", "0122-multi-agent-runtime-open-questions", "0123-unrelated"]);
  assert.deepEqual(result, [{ id: "0122", basenames: ["0122-ci-apt-chrome-mirror-flakiness", "0122-multi-agent-runtime-open-questions"] }]);
});

test("detectDuplicateChangeIds: three-way collision is reported as one group of three", () => {
  const result = detectDuplicateChangeIds(["0005-a", "0005-b", "0005-c"]);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, "0005");
  assert.deepEqual(result[0].basenames, ["0005-a", "0005-b", "0005-c"]);
});

test("detectDuplicateChangeIds: multiple independent collisions are reported as separate groups, sorted by id", () => {
  const result = detectDuplicateChangeIds(["0009-b", "0002-a", "0009-a", "0002-b"]);
  assert.deepEqual(result, [
    { id: "0002", basenames: ["0002-a", "0002-b"] },
    { id: "0009", basenames: ["0009-a", "0009-b"] }
  ]);
});

test("detectDuplicateChangeIds: a basename with no leading numeric id is ignored, never crashes", () => {
  const result = detectDuplicateChangeIds(["not-numbered", "also-not-numbered"]);
  assert.deepEqual(result, []);
});

test("detectDuplicateChangeIds: deterministic and order-independent — same input in any order yields the same output", () => {
  const a = detectDuplicateChangeIds(["0122-x", "0009-a", "0122-y", "0009-b"]);
  const b = detectDuplicateChangeIds(["0009-b", "0122-y", "0009-a", "0122-x"]);
  assert.deepEqual(a, b);
});

test("detectDuplicateChangeIds: an empty list yields no collisions", () => {
  assert.deepEqual(detectDuplicateChangeIds([]), []);
});
