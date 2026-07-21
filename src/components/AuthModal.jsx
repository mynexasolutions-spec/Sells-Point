"use client";

import { useState } from "react";
import { X, Mail, LockKeyhole, ShieldCheck, User, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function AuthModal({ isOpen, onClose }) {
  const { signUpWithEmail, signInWithEmail } = useApp();
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setMode("signin"); setName(""); setEmail(""); setPassword(""); setConfirmPassword(""); setError("");
  };
  const close = () => { reset(); onClose(); };
  const switchMode = () => { setMode((value) => value === "signin" ? "signup" : "signin"); setError(""); };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (mode === "signup" && password !== confirmPassword) return setError("Passwords do not match.");
    setSubmitting(true);
    const result = mode === "signup"
      ? await signUpWithEmail(name, normalizedEmail, password)
      : await signInWithEmail(normalizedEmail, password);
    setSubmitting(false);
    if (result.success) close(); else setError(result.message || "Unable to continue.");
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 animate-fade-in">
    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-soft animate-slide-up">
      <button onClick={close} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Close"><X size={18} /></button>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white"><ShieldCheck size={22} /></div>
        <div><h2 className="font-display text-lg font-bold text-ink-900">{mode === "signup" ? "Create your account" : "Welcome back"}</h2><p className="text-sm text-ink-500">{mode === "signup" ? "Sign up to start buying and selling" : "Sign in to enter the marketplace"}</p></div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && <div><label className="mb-1.5 block text-sm font-medium text-ink-700">Name</label><div className="relative"><User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" /><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" className="input-field pl-10" autoFocus /></div></div>}
        <div><label className="mb-1.5 block text-sm font-medium text-ink-700">Email address</label><div className="relative"><Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="input-field pl-10" autoFocus={mode === "signin"} /></div></div>
        <div><label className="mb-1.5 block text-sm font-medium text-ink-700">Password</label><div className="relative"><LockKeyhole size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" /><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="input-field pl-10" /></div></div>
        {mode === "signup" && <div><label className="mb-1.5 block text-sm font-medium text-ink-700">Confirm password</label><div className="relative"><LockKeyhole size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" /><input required type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat your password" className="input-field pl-10" /></div></div>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"} <ArrowRight size={16} /></button>
      </form>
      <button type="button" onClick={switchMode} className="btn-ghost mt-3 w-full">{mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}</button>
      <p className="mt-4 text-center text-xs text-ink-400">Regular accounts are saved only in this browser.</p>
    </div>
  </div>;
}
