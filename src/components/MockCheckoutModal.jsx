"use client";

import { useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useApp } from "@/context/AppContext";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export default function MockCheckoutModal({ open, onClose, items = [], source = "buy" }) {
  const { currentUser } = useApp();
  const [paymentMethod, setPaymentMethod] = useState("mock_card");
  const [form, setForm] = useState({ name: currentUser?.name || "", phone: currentUser?.phone || "", address: currentUser?.location || "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const total = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity || 1), 0);
  if (!open) return null;

  const pay = async () => {
    setError("");
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) return setError("Please add your delivery details.");
    const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actorId: currentUser?.id, items: items.map((item) => ({ listingId: item.id, quantity: item.quantity || 1, selectedSpecifications: item.selectedSpecifications || {} })), shipping: form, clearCart: source === "cart" }) });
    const result = await response.json();
    if (!response.ok || !result.ok) return setError(result.error?.message || "Unable to create mock order.");
    const payment = await fetch("/api/orders/payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actorId: currentUser.id, orderId: result.data.order.id, method: paymentMethod, succeed: true }) });
    const receipt = await payment.json();
    if (!payment.ok || !receipt.ok) return setError(receipt.error?.message || "Mock payment failed.");
    setSuccess(receipt.data.reference);
  };

  return <div className="fixed inset-0 z-[70] grid place-items-end bg-ink-950/45 p-0 sm:place-items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Mock checkout">
    <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
      <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-brand-700">SellsPoint mock checkout</p><h2 className="font-display text-2xl font-bold">Secure your item</h2></div><button onClick={onClose} className="rounded-full p-2 hover:bg-ink-50" aria-label="Close"><X /></button></div>
      {success ? <div className="py-8 text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-brand-600" /><h3 className="mt-4 font-display text-xl font-bold">Mock payment confirmed</h3><p className="mt-2 text-sm text-ink-500">Order reference: {success}</p><button onClick={onClose} className="btn-primary mt-6">Done</button></div> : <div className="space-y-4">
        <div className="rounded-2xl bg-brand-50 p-4"><div className="flex justify-between font-semibold"><span>Total</span><span>{money(total)}</span></div><p className="mt-1 text-sm text-brand-800">Choose a demo payment method below.</p></div>
        <div className="grid grid-cols-2 gap-2">{[["mock_card","Card"],["mock_upi","UPI"],["mock_cod","Cash on delivery"],["mock_netbanking","Net banking"]].map(([value,label]) => <button type="button" key={value} onClick={() => setPaymentMethod(value)} className={`rounded-xl border px-2 py-2 text-sm font-bold ${paymentMethod === value ? "border-brand-600 bg-brand-50 text-brand-800" : "border-ink-200"}`}>{label}</button>)}</div>
        <input className="input-field" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="input-field" placeholder="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <textarea className="input-field resize-none" rows="2" placeholder="Delivery address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
        {error && <p className="text-sm text-red-600">{error}</p>}<button onClick={pay} className="btn-primary w-full">Confirm mock payment · {money(total)}</button><p className="text-center text-xs text-ink-400">No real payment, delivery, or warranty is provided in this demo.</p>
      </div>}
    </div>
  </div>;
}
