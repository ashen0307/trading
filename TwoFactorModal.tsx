import { useState, useCallback } from "react";

interface TwoFactorModalProps {
  open: boolean;
  onClose: () => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let s = "";
  for (let i = 0; i < 32; i++) {
    if (i > 0 && i % 4 === 0) s += " ";
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const part1 = Math.random().toString(36).slice(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).slice(2, 6).toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

export const TwoFactorModal = ({ open, onClose, enabled, onToggle }: TwoFactorModalProps) => {
  const [step, setStep] = useState<"intro" | "setup" | "verify" | "backup" | "done" | "disable">(
    enabled ? "intro" : "intro"
  );
  const [secret] = useState(() => generateSecret());
  const [backupCodes] = useState(() => generateBackupCodes());
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disableError, setDisableError] = useState(false);

  const handleVerify = useCallback(() => {
    // In demo, accept any 6-digit code
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      setCodeError(false);
      setStep("backup");
    } else {
      setCodeError(true);
    }
  }, [code]);

  const handleEnable = useCallback(() => {
    onToggle(true);
    setStep("done");
  }, [onToggle]);

  const handleDisable = useCallback(() => {
    if (disableCode.length === 6 && /^\d{6}$/.test(disableCode)) {
      onToggle(false);
      setDisableError(false);
      setStep("intro");
      setDisableCode("");
    } else {
      setDisableError(true);
    }
  }, [disableCode, onToggle]);

  const handleCopyBackup = useCallback(() => {
    navigator.clipboard.writeText(backupCodes.join("\n")).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [backupCodes]);

  const handleClose = () => {
    setStep(enabled ? "intro" : "intro");
    setCode("");
    setCodeError(false);
    setDisableCode("");
    setDisableError(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-700/80 bg-[#0c1018] shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-white">🔐 Two-Factor Authentication</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {enabled ? "2FA is currently enabled" : "Add extra security to your account"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {/* ─── INTRO ─── */}
          {step === "intro" && (
            <div className="space-y-4">
              {/* Current Status */}
              <div className={`rounded-xl border p-4 text-center ${enabled ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"}`}>
                <div className="text-3xl mb-2">{enabled ? "🛡️" : "⚠️"}</div>
                <div className={`text-sm font-bold ${enabled ? "text-emerald-400" : "text-amber-400"}`}>
                  {enabled ? "2FA is Active" : "2FA is Not Enabled"}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {enabled
                    ? "Your account has an extra layer of protection"
                    : "Your account is less secure without 2FA"}
                </p>
              </div>

              {/* Benefits */}
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4">
                <h3 className="text-xs font-bold text-white mb-3">Why use 2FA?</h3>
                <div className="space-y-2.5">
                  {[
                    { icon: "🔒", title: "Prevent unauthorized access", desc: "Even if your password is compromised" },
                    { icon: "💰", title: "Protect your funds", desc: "Required for withdrawals over $100" },
                    { icon: "🛡️", title: "Industry standard", desc: "Used by banks and crypto exchanges" },
                  ].map((b) => (
                    <div key={b.title} className="flex items-start gap-3">
                      <span className="text-lg">{b.icon}</span>
                      <div>
                        <div className="text-[11px] font-bold text-slate-300">{b.title}</div>
                        <div className="text-[10px] text-slate-600">{b.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supported Apps */}
              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4">
                <h3 className="text-xs font-bold text-white mb-2">Supported Authenticator Apps</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "Google", icon: "🔵" },
                    { name: "Authy", icon: "🔴" },
                    { name: "Microsoft", icon: "🟢" },
                  ].map((app) => (
                    <div key={app.name} className="rounded-lg bg-slate-900/60 p-2 text-center">
                      <div className="text-lg mb-0.5">{app.icon}</div>
                      <div className="text-[10px] text-slate-500">{app.name}</div>
                    </div>
                  ))}
                </div>
              </div>

              {enabled ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 rounded-lg bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setStep("disable")}
                    className="flex-1 rounded-lg bg-rose-500/15 px-4 py-2.5 text-xs font-bold text-rose-400 ring-1 ring-rose-500/25 hover:bg-rose-500/25 transition cursor-pointer"
                  >
                    Disable 2FA
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setStep("setup")}
                  className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition cursor-pointer"
                >
                  🔐 Enable Two-Factor Authentication
                </button>
              )}
            </div>
          )}

          {/* ─── SETUP ─── */}
          {step === "setup" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">1</div>
                <span className="text-xs font-bold text-white">Scan QR Code</span>
              </div>

              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4 text-center">
                <p className="text-[11px] text-slate-400 mb-3">
                  Scan this QR code with your authenticator app
                </p>
                {/* Simulated QR Code */}
                <div className="mx-auto mb-3 h-40 w-40 rounded-xl bg-white p-3 flex items-center justify-center">
                  <div className="grid grid-cols-11 gap-px w-full h-full">
                    {Array.from({ length: 121 }).map((_, i) => {
                      const row = Math.floor(i / 11);
                      const col = i % 11;
                      const isCorner =
                        (row < 3 && col < 3) ||
                        (row < 3 && col > 7) ||
                        (row > 7 && col < 3);
                      const isFilled = isCorner || Math.random() > 0.45;
                      return (
                        <div
                          key={i}
                          className={`${isFilled ? "bg-slate-900" : "bg-white"}`}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mb-1">Or enter this key manually:</div>
              </div>

              {/* Manual Key */}
              <div className="rounded-lg bg-slate-900 border border-slate-700 p-3">
                <div className="text-[10px] text-slate-500 mb-1.5">Secret Key</div>
                <div className="font-mono text-sm text-emerald-400 font-bold tracking-wider break-all">
                  {secret}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(secret.replace(/\s/g, "")).catch(() => {});
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="mt-2 rounded-lg bg-emerald-500/15 px-3 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/25 transition cursor-pointer"
                >
                  {copied ? "Copied! ✓" : "📋 Copy Key"}
                </button>
              </div>

              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-[10px] text-amber-300">
                ⚠️ Save this secret key in a secure location. You'll need it if you lose access to your authenticator app.
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep("intro")}
                  className="flex-1 rounded-lg bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep("verify")}
                  className="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-400 transition cursor-pointer"
                >
                  Next: Verify →
                </button>
              </div>
            </div>
          )}

          {/* ─── VERIFY ─── */}
          {step === "verify" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">2</div>
                <span className="text-xs font-bold text-white">Enter Verification Code</span>
              </div>

              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-6 text-center">
                <div className="text-3xl mb-3">📱</div>
                <p className="text-[11px] text-slate-400 mb-4">
                  Enter the 6-digit code from your authenticator app
                </p>

                {/* Code Input */}
                <div className="flex justify-center gap-2 mb-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`flex h-12 w-10 items-center justify-center rounded-lg border-2 text-lg font-bold font-mono transition ${
                        code[i]
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                          : "border-slate-700 bg-slate-900 text-slate-600"
                      } ${codeError ? "border-rose-500/50 bg-rose-500/5" : ""}`}
                    >
                      {code[i] || "·"}
                    </div>
                  ))}
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(v);
                    setCodeError(false);
                  }}
                  className="w-40 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center font-mono text-lg text-white outline-none focus:border-emerald-500/50 transition tracking-[0.5em]"
                  placeholder="000000"
                  autoFocus
                />

                {codeError && (
                  <p className="mt-2 text-[11px] text-rose-400 font-medium">
                    ❌ Invalid code. Enter a 6-digit number.
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/15 px-3 py-2 text-[10px] text-emerald-300">
                💡 <span className="font-bold">Demo mode:</span> Enter any 6 digits (e.g., 123456) to proceed.
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep("setup")}
                  className="flex-1 rounded-lg bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  onClick={handleVerify}
                  disabled={code.length < 6}
                  className="flex-1 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-400 transition disabled:opacity-40 cursor-pointer"
                >
                  Verify Code
                </button>
              </div>
            </div>
          )}

          {/* ─── BACKUP CODES ─── */}
          {step === "backup" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">3</div>
                <span className="text-xs font-bold text-white">Save Backup Codes</span>
              </div>

              <div className="rounded-lg bg-rose-500/8 border border-rose-500/15 px-3 py-2.5 text-[11px] text-rose-300">
                <p className="font-bold">⚠️ Important: Save these backup codes!</p>
                <p className="text-[10px] text-rose-400/70 mt-0.5">
                  Each code can only be used once. Store them in a safe place.
                </p>
              </div>

              <div className="rounded-xl bg-slate-900 border border-slate-700 p-4">
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg bg-slate-800/60 px-3 py-2"
                    >
                      <span className="text-[9px] text-slate-600 font-mono w-4">{i + 1}.</span>
                      <span className="font-mono text-xs text-white font-bold tracking-wider">
                        {c}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleCopyBackup}
                    className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-[11px] font-medium text-slate-300 hover:bg-slate-600 transition cursor-pointer"
                  >
                    {copied ? "Copied! ✓" : "📋 Copy All Codes"}
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([backupCodes.join("\n")], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "binarypro-2fa-backup-codes.txt";
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-[11px] font-medium text-slate-300 hover:bg-slate-600 transition cursor-pointer"
                  >
                    💾 Download .txt
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/15 px-3 py-2.5 text-[11px] text-emerald-300">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 accent-emerald-500" defaultChecked={false} />
                  <span>I have saved my backup codes in a secure location</span>
                </label>
              </div>

              <button
                onClick={handleEnable}
                className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition cursor-pointer"
              >
                ✅ Enable 2FA & Finish
              </button>
            </div>
          )}

          {/* ─── DONE ─── */}
          {step === "done" && (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/40">
                <span className="text-4xl">🛡️</span>
              </div>
              <h3 className="text-lg font-bold text-white">2FA Enabled Successfully!</h3>
              <p className="text-sm text-slate-400">
                Your account is now protected with two-factor authentication.
              </p>
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/15 p-3">
                  <div className="text-[10px] uppercase text-emerald-500/60">Status</div>
                  <div className="mt-1 text-sm font-bold text-emerald-400">Active ✓</div>
                </div>
                <div className="rounded-lg bg-slate-800/60 border border-slate-700/40 p-3">
                  <div className="text-[10px] uppercase text-slate-600">Backup Codes</div>
                  <div className="mt-1 text-sm font-bold text-white">{backupCodes.length} saved</div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full bg-emerald-500 px-8 py-2.5 text-sm font-bold text-white hover:bg-emerald-400 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {/* ─── DISABLE ─── */}
          {step === "disable" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-center">
                <div className="text-3xl mb-2">⚠️</div>
                <h3 className="text-sm font-bold text-rose-400">Disable Two-Factor Authentication?</h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  This will remove the extra security layer from your account.
                </p>
              </div>

              <div className="rounded-xl bg-slate-800/40 border border-slate-700/40 p-4 text-center">
                <p className="text-[11px] text-slate-400 mb-3">
                  Enter your current 2FA code to confirm
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={disableCode}
                  onChange={(e) => {
                    setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setDisableError(false);
                  }}
                  className="w-40 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-center font-mono text-lg text-white outline-none focus:border-rose-500/50 transition tracking-[0.5em]"
                  placeholder="000000"
                />
                {disableError && (
                  <p className="mt-2 text-[11px] text-rose-400">Enter a valid 6-digit code</p>
                )}
              </div>

              <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/15 px-3 py-2 text-[10px] text-emerald-300">
                💡 <span className="font-bold">Demo:</span> Enter any 6 digits to disable.
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep("intro")}
                  className="flex-1 rounded-lg bg-slate-800 px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                >
                  ← Cancel
                </button>
                <button
                  onClick={handleDisable}
                  disabled={disableCode.length < 6}
                  className="flex-1 rounded-lg bg-rose-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-rose-400 transition disabled:opacity-40 cursor-pointer"
                >
                  Disable 2FA
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
