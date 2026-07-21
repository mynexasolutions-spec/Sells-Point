"use client";

import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import AdminPanel from "@/components/AdminPanel";

function AdminLogin({ onAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error || "Invalid email or password.");
        return;
      }
      onAuthenticated(payload.user);
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="flex min-h-screen items-center justify-center bg-ink-950 p-5">
    <section className="w-full max-w-sm rounded-2xl border border-white/10 bg-white p-7 shadow-2xl" aria-labelledby="admin-login-title">
      <div className="mb-7 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white"><ShieldCheck size={22} /></div>
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Sells Point</p><h1 id="admin-login-title" className="font-display text-xl font-bold text-ink-950">Admin access</h1></div>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div><label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-ink-700">Email address</label><div className="relative"><Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" /><input id="admin-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input-field pl-10" autoComplete="username" autoFocus /></div></div>
        <div><label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-ink-700">Password</label><div className="relative"><LockKeyhole size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" /><input id="admin-password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="input-field pl-10" autoComplete="current-password" /></div></div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? "Signing in…" : "Sign in"} <ArrowRight size={16} /></button>
      </form>
    </section>
  </main>;
}

export default function AdminPage() {
  const { activateAdminSession } = useApp();
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);

  const authenticate = (profile) => {
    activateAdminSession(profile);
    setAdminAuthenticated(true);
  };

  useEffect(() => {
    fetch("/api/auth/admin-session")
      .then(async (response) => response.ok ? response.json() : null)
      .then((payload) => { if (payload?.user) authenticate(payload.user); })
      .catch(() => {});
  }, []);

  return adminAuthenticated ? <AdminPanel /> : <AdminLogin onAuthenticated={authenticate} />;
}
