export class EditorialPolicyError extends Error {}

export function assertCanApprove(input: { approverId: string; approverRole: "author" | "editor" | "admin"; articleAuthorId: string; status: string }) {
  if (input.approverRole !== "editor" && input.approverRole !== "admin") throw new EditorialPolicyError("Hanya editor atau admin yang dapat menyetujui artikel.");
  if (input.approverId === input.articleAuthorId) throw new EditorialPolicyError("Pemberi persetujuan harus berbeda dari penulis artikel.");
  if (input.status !== "in_review") throw new EditorialPolicyError("Artikel hanya dapat disetujui ketika berstatus in_review.");
}
