"use client";

import { useState } from "react";
import { X, Phone, ShieldCheck, User, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function AuthModal({ isOpen, onClose }) {
  const { sendOtp, verifyOtp } = useApp();
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [sentCode, setSentCode] = useState("");

  if (!isOpen) return null;

  const reset = () => {
    setStep("phone");
    setPhone("");
    setName("");
    setOtp("");
    setError("");
    setSentCode("");
  };
  const close = () => { reset(); onClose(); };

  const handleSendOtp = (event) => {
    event.preventDefault();
    if (phone.trim().length < 8) return setError("Enter a valid phone number.");
    setSentCode(sendOtp(phone.trim()));
    setError("");
    setStep("otp");
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    const result = await verifyOtp(phone.trim(), otp.trim(), name.trim());
    if (result.success) close(); else setError(result.message || "Unable to continue.");
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 animate-fade-in">
    <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-soft animate-slide-up">
      <button onClick={close} className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Close"><X size={18} /></button>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-white"><ShieldCheck size={22} /></div>
        <div><h2 className="font-display text-lg font-bold text-ink-900">{step === "phone" ? "Welcome to Sells Point" : "Verify your number"}</h2><p className="text-sm text-ink-500">{step === "phone" ? "Sign in with your phone number to buy & sell" : `Enter the code sent to ${phone}`}</p></div>
      </div>
      {step === "phone" ? <form onSubmit={handleSendOtp} className="space-y-4">
        <div><label className="mb-1.5 block text-sm font-medium text-ink-700">Phone number</label><div className="relative"><Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" /><input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" className="input-field pl-10" autoFocus /></div></div>
        <div><label className="mb-1.5 block text-sm font-medium text-ink-700">Name <span className="text-ink-400">(for new accounts)</span></label><div className="relative"><User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" /><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" className="input-field pl-10" /></div></div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="btn-primary w-full">Send OTP <ArrowRight size={16} /></button>
      </form> : <form onSubmit={handleVerify} className="space-y-4">
        <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">Demo mode: use code <span className="font-bold">{sentCode}</span></div>
        <div><label className="mb-1.5 block text-sm font-medium text-ink-700">Enter 6-digit OTP</label><input required type="text" inputMode="numeric" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="••••••" maxLength={6} className="input-field tracking-[0.5em] text-center text-lg" autoFocus /></div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="btn-primary w-full">Verify & Continue <ArrowRight size={16} /></button>
        <button type="button" onClick={() => { setStep("phone"); setError(""); }} className="btn-ghost w-full">Change phone number</button>
      </form>}
    </div>
  </div>;
}
