import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveEffectiveLimits } from "../src/lib/limits";

const BASIC_PLAN = {
  name: "Basic",
  maxStudents: 100,
  maxTeachers: 10,
  maxStaff: 5,
  maxStorageGB: 5,
};

test("resolveEffectiveLimits: plan values are used when no custom override", () => {
  const limits = resolveEffectiveLimits(BASIC_PLAN, {});
  assert.equal(limits.maxStudents, 100);
  assert.equal(limits.maxTeachers, 10);
  assert.equal(limits.maxStaff, 5);
  assert.equal(limits.maxStorageGB, 5);
  assert.equal(limits.planName, "Basic");
});

test("resolveEffectiveLimits: zero or negative means unlimited", () => {
  const limits = resolveEffectiveLimits(
    { ...BASIC_PLAN, maxStudents: 0, maxTeachers: -1 },
    {}
  );
  assert.equal(limits.maxStudents, null);
  assert.equal(limits.maxTeachers, null);
});

test("resolveEffectiveLimits: custom overrides win over plan values", () => {
  const limits = resolveEffectiveLimits(BASIC_PLAN, { maxStudents: 250, maxTeachers: 20 });
  assert.equal(limits.maxStudents, 250);
  assert.equal(limits.maxTeachers, 20);
});

test("resolveEffectiveLimits: custom override of zero disables the limit", () => {
  const limits = resolveEffectiveLimits(BASIC_PLAN, { maxStudents: 0 });
  assert.equal(limits.maxStudents, null);
});

test("resolveEffectiveLimits: non-numeric custom overrides are ignored", () => {
  const limits = resolveEffectiveLimits(BASIC_PLAN, { maxStudents: "many", maxTeachers: null });
  assert.equal(limits.maxStudents, 100);
  assert.equal(limits.maxTeachers, 10);
});

test("resolveEffectiveLimits: custom fractional values are floored", () => {
  const limits = resolveEffectiveLimits(BASIC_PLAN, { maxStudents: 10.9 });
  assert.equal(limits.maxStudents, 10);
});

test("resolveEffectiveLimits: missing plan yields unlimited everything", () => {
  const limits = resolveEffectiveLimits(null, {});
  assert.equal(limits.maxStudents, null);
  assert.equal(limits.maxTeachers, null);
  assert.equal(limits.maxStaff, null);
  assert.equal(limits.maxStorageGB, null);
  assert.equal(limits.planName, null);
});
