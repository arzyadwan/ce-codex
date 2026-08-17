import assert from "node:assert/strict";
import test from "node:test";
import { parseMediaUpload } from "./media-policy.js";

test("menerima gambar web modern hingga 10 MB", () => {
  assert.equal(parseMediaUpload({ fileName: "hero.webp", contentType: "image/webp", size: 1024 }).extension, "webp");
});
test("menolak tipe file executable", () => {
  assert.throws(() => parseMediaUpload({ fileName: "payload.exe", contentType: "application/octet-stream", size: 1024 }));
});
test("menolak gambar lebih dari 10 MB", () => {
  assert.throws(() => parseMediaUpload({ fileName: "besar.png", contentType: "image/png", size: 10 * 1024 * 1024 + 1 }));
});
