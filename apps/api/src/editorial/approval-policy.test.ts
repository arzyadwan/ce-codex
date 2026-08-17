import assert from "node:assert/strict";
import test from "node:test";
import { assertCanApprove, EditorialPolicyError } from "./approval-policy.js";

const base = { articleId: "c53548ca-941c-4472-bac5-b96fc2518294", approverId: "c24e515a-55de-42a5-8208-b2dc768e620a", articleAuthorId: "eb56c020-f9f1-4c0c-a4a1-bf0b4ce6578b", status: "in_review" } as const;
test("editor atau admin dapat memberi satu persetujuan", () => {
  assert.doesNotThrow(() => assertCanApprove({ ...base, approverRole: "editor" }));
  assert.doesNotThrow(() => assertCanApprove({ ...base, approverRole: "admin" }));
});
test("role author tidak dapat memberikan persetujuan", () => {
  assert.throws(() => assertCanApprove({ ...base, approverRole: "author" }), EditorialPolicyError);
});
test("penulis tidak dapat menyetujui artikelnya sendiri", () => {
  assert.throws(() => assertCanApprove({ ...base, approverRole: "editor", approverId: base.articleAuthorId }), EditorialPolicyError);
});
test("artikel di luar review tidak dapat disetujui", () => {
  assert.throws(() => assertCanApprove({ ...base, approverRole: "editor", status: "draft" }), EditorialPolicyError);
});
