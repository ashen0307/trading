import { useState } from "react";

export type KYCStatus = "NOT_STARTED" | "IN_PROGRESS" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";

interface KYCModalProps {
  open: boolean;
  onClose: () => void;
  kycStatus: KYCStatus;
  onStatusChange: (status: KYCStatus) => void;
}

const COUNTRIES = [
  "United States", "United Kingdom", "Germany", "France", "Canada",
  "Australia", "Japan", "Singapore", "UAE", "Switzerland", "Netherlands",
  "Sweden", "Norway", "Brazil", "India", "South Korea", "Other",
];

export const KYCModal = ({ open, onClose, kycStatus, onStatusChange }: KYCModalProps) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "", dob: "", country: "", phone: "", email: "",
    docType: "passport", docFront: false, docBack: false,
    street: "", city: "", state: "", zip: "", addressProof: false,
  });

  if (!open) return null;

  if (kycStatus === "VERIFIED") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-[#0c1018] p-8 text-center shadow-2xl animate-slide-up">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/40">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-xl font-bold text-white">Identity Verified</h2>
          <p className="mt-2 text-sm text-slate-400">Full access to all trading features and withdrawals.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-lg bg-slate-800/60 p-3"><div className="text-[10px] uppercase text-slate-500">Status</div><div className="mt-1 text-sm font-bold text-emerald-400">Verified ✓</div></div>
            <div className="rounded-lg bg-slate-800/60 p-3"><div className="text-[10px] uppercase text-slate-500">Level</div><div className="mt-1 text-sm font-bold text-white">Full Access</div></div>
          </div>
          <button onClick={onClose} className="mt-6 rounded-full bg-emerald-500 px-8 py-2.5 text-sm font-bold text-white hover:bg-emerald-400 transition cursor-pointer">Done</button>
        </div>
      </div>
    );
  }

  if (kycStatus === "PENDING_REVIEW") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-slate-700/80 bg-[#0c1018] p-8 text-center shadow-2xl animate-slide-up">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/20 ring-2 ring-amber-500/40">
            <span className="text-4xl animate-spin" style={{ animationDuration: "3s" }}>⏳</span>
          </div>
          <h2 className="text-xl font-bold text-white">Under Review</h2>
          <p className="mt-2 text-sm text-slate-400">Documents are being verified. This takes a few moments in demo mode.</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs text-amber-400 font-medium">Processing...</span>
          </div>
          <button onClick={onClose} className="mt-6 rounded-full bg-slate-700 px-8 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-600 transition cursor-pointer">Close</button>
        </div>
      </div>
    );
  }

  const updateField = (key: string, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));
  const canStep1 = form.fullName.length > 2 && form.dob && form.country && form.email.includes("@");
  const canStep2 = form.docFront && form.docBack;
  const canStep3 = form.street && form.city && form.zip;

  const inputClass = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none placeholder-slate-600 focus:border-emerald-500/50 transition";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/80 bg-[#0c1018] shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between border-b border-slate-800/60 px-6 py-4">
          <div><h2 className="text-base font-bold text-white">🔒 KYC Verification</h2><p className="text-[11px] text-slate-500">Verify your identity</p></div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer">✕</button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-2 mb-1">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${step > s ? "bg-emerald-500 text-white" : step === s ? "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40" : "bg-slate-800 text-slate-600"}`}>{step > s ? "✓" : s}</div>
                {s < 3 && <div className={`h-0.5 flex-1 rounded-full transition ${step > s ? "bg-emerald-500" : "bg-slate-800"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 px-1"><span>Personal</span><span>Documents</span><span>Address</span></div>
        </div>

        <div className="px-6 py-5 min-h-[300px]">
          {step === 1 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white mb-3">Personal Information</h3>
              <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">Full Legal Name</label><input className={inputClass} placeholder="John Smith" value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">Date of Birth</label><input type="date" className={inputClass} value={form.dob} onChange={(e) => updateField("dob", e.target.value)} /></div>
                <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">Country</label><select className={inputClass} value={form.country} onChange={(e) => updateField("country", e.target.value)}><option value="">Select...</option>{COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">Phone</label><input className={inputClass} placeholder="+1 234 567 8900" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} /></div>
                <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">Email</label><input type="email" className={inputClass} placeholder="john@email.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} /></div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white mb-3">Identity Document</h3>
              <div className="grid grid-cols-3 gap-2">
                {[{ key: "passport", label: "Passport", icon: "🛂" }, { key: "national_id", label: "National ID", icon: "🪪" }, { key: "drivers_license", label: "License", icon: "🚗" }].map((doc) => (
                  <button key={doc.key} onClick={() => updateField("docType", doc.key)} className={`rounded-lg border p-3 text-center transition cursor-pointer ${form.docType === doc.key ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"}`}>
                    <div className="text-2xl mb-1">{doc.icon}</div><div className="text-[10px] font-bold">{doc.label}</div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[{ key: "docFront", label: "Front Side", done: form.docFront }, { key: "docBack", label: "Back Side", done: form.docBack }].map((side) => (
                  <div key={side.key}>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">{side.label}</label>
                    <button onClick={() => updateField(side.key, !side.done)} className={`w-full rounded-lg border-2 border-dashed p-6 text-center transition cursor-pointer ${side.done ? "border-emerald-500/50 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50 hover:border-slate-600"}`}>
                      {side.done ? <div className="text-emerald-400"><div className="text-2xl mb-1">✓</div><div className="text-[10px] font-bold">Uploaded</div></div> : <div className="text-slate-500"><div className="text-2xl mb-1">📄</div><div className="text-[10px]">Click to upload</div></div>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white mb-3">Address Verification</h3>
              <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">Street Address</label><input className={inputClass} placeholder="123 Main St" value={form.street} onChange={(e) => updateField("street", e.target.value)} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">City</label><input className={inputClass} placeholder="New York" value={form.city} onChange={(e) => updateField("city", e.target.value)} /></div>
                <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">State</label><input className={inputClass} placeholder="NY" value={form.state} onChange={(e) => updateField("state", e.target.value)} /></div>
                <div><label className="block text-[11px] font-semibold text-slate-400 mb-1">ZIP</label><input className={inputClass} placeholder="10001" value={form.zip} onChange={(e) => updateField("zip", e.target.value)} /></div>
              </div>
              <button onClick={() => updateField("addressProof", !form.addressProof)} className={`w-full rounded-lg border-2 border-dashed p-4 text-center transition cursor-pointer ${form.addressProof ? "border-emerald-500/50 bg-emerald-500/10" : "border-slate-700 bg-slate-800/50"}`}>
                {form.addressProof ? <span className="text-emerald-400 font-bold text-xs">✓ Proof of address uploaded</span> : <span className="text-slate-500 text-xs">📎 Upload utility bill or bank statement</span>}
              </button>
              <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 space-y-1 text-[11px]">
                <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1.5">Summary</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-slate-500">Name</span><span className="text-white font-medium">{form.fullName || "–"}</span>
                  <span className="text-slate-500">Country</span><span className="text-white font-medium">{form.country || "–"}</span>
                  <span className="text-slate-500">Document</span><span className="text-white font-medium capitalize">{form.docType.replace("_", " ")}</span>
                  <span className="text-slate-500">Uploaded</span><span className={form.docFront && form.docBack ? "text-emerald-400 font-bold" : "text-rose-400"}>{form.docFront && form.docBack ? "Yes ✓" : "Incomplete"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-800/60 px-6 py-4">
          <button onClick={() => { if (step > 1) setStep(step - 1); else onClose(); }} className="rounded-full bg-slate-800 px-5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer">{step === 1 ? "Cancel" : "← Back"}</button>
          {step < 3 ? (
            <button onClick={() => { setStep(step + 1); if (kycStatus === "NOT_STARTED") onStatusChange("IN_PROGRESS"); }} disabled={step === 1 ? !canStep1 : !canStep2} className="rounded-full bg-emerald-500 px-6 py-2 text-xs font-bold text-white shadow-lg hover:bg-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Continue →</button>
          ) : (
            <button onClick={() => onStatusChange("PENDING_REVIEW")} disabled={!canStep3} className="rounded-full bg-emerald-500 px-6 py-2 text-xs font-bold text-white shadow-lg hover:bg-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Submit Verification</button>
          )}
        </div>
      </div>
    </div>
  );
};
