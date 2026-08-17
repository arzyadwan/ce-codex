"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const { error: authError } = await createClient().auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
      if (authError) throw authError;
      router.replace("/dashboard"); router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tidak dapat masuk. Coba lagi.");
    } finally { setPending(false); }
  }

  return <form className="auth-form" onSubmit={submit} noValidate>
    <label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required placeholder="nama@cryptoexist.id" />
    <label htmlFor="password">Kata sandi</label><input id="password" name="password" type="password" autoComplete="current-password" required />
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button-primary" disabled={pending} type="submit">{pending ? "Memverifikasi…" : "Masuk ke dashboard"}</button>
    <p className="form-help">Lupa akses? Hubungi administrator Crypto Exist.</p>
  </form>;
}
