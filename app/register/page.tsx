"use client";
/* ============================================================
   SWARM — Register (JWT) with animated swarm backdrop, standalone route
   ============================================================ */
import { useState, useEffect, useRef, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SwarmMark, Btn, Icon } from "../../components/swarm/ui";

function SwarmBackdrop({ density = 46 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0, w = 0, h = 0, dpr = 1;
    const pts: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    function accentRGB(): [number, number, number] {
      const v = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#3B82F6";
      const el = document.createElement("div"); el.style.color = v; document.body.appendChild(el);
      const c = getComputedStyle(el).color; document.body.removeChild(el);
      const m = c.match(/\d+/g); return m ? [Number(m[0]), Number(m[1]), Number(m[2])] : [59, 130, 246];
    }
    let rgb = accentRGB();
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas!.clientWidth; h = canvas!.clientHeight;
      canvas!.width = w * dpr; canvas!.height = h * dpr; ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    for (let i = 0; i < density; i++) {
      pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22, r: Math.random() * 1.6 + 0.8 });
    }
    function frame() {
      ctx!.clearRect(0, 0, w, h);
      const [R, G, B] = rgb;
      for (const p of pts) {
        if (!reduce) { p.x += p.vx; p.y += p.vy; }
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const dx = a.x - b.x, dy = a.y - b.y; const d = Math.hypot(dx, dy);
          if (d < 130) {
            ctx!.strokeStyle = `rgba(${R},${G},${B},${(1 - d / 130) * 0.16})`;
            ctx!.lineWidth = 1; ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.lineTo(b.x, b.y); ctx!.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx!.fillStyle = `rgba(${R},${G},${B},0.7)`;
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, 7); ctx!.fill();
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    }
    frame();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const t = setInterval(() => { rgb = accentRGB(); }, 1200);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); clearInterval(t); };
  }, [density]);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

function PasswordField({ value, onChange, placeholder, field }: {
  value: string; onChange: (v: string) => void; placeholder?: string; field: CSSProperties;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...field, paddingRight: 40 }} type={show ? "text" : "password"} />
      <button type="button" onClick={() => setShow((s) => !s)} title={show ? "Hide password" : "Show password"} aria-label={show ? "Hide password" : "Show password"} style={{
        position: "absolute", right: 4, top: 0, height: "100%", width: 34, display: "flex", alignItems: "center", justifyContent: "center",
        background: "none", border: "none", cursor: "pointer", color: show ? "var(--accent-2)" : "var(--faint)", padding: 0,
      }}>
        <Icon name="eye" size={16} />
      </button>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name.trim() || !email.trim() || !pw) { setError("Fill in every field to continue."); return; }
    if (pw.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (pw !== confirmPw) { setError("Passwords don't match."); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password: pw }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Something went wrong. Try again.");
        setLoading(false);
        return;
      }
      router.push("/");
    } catch {
      setError("Couldn't reach the server. Try again.");
      setLoading(false);
    }
  }
  const field: CSSProperties = {
    height: 46, width: "100%", padding: "0 14px", borderRadius: 10,
    background: "color-mix(in oklab, var(--surface) 86%, #fff 4%)", border: "1px solid var(--border-strong)", color: "var(--text)",
    fontFamily: "var(--font)", fontSize: 14, outline: "none",
  };
  return (
    <div className="login-shell">
      <SwarmBackdrop />

      <main className="login-frame rise">
        <aside className="login-brand-panel">
          <div className="login-brand-top">
            <div className="login-brand-mark">
              <SwarmMark size={30} />
            </div>
            <div>
              <div className="login-brand-name">Social Swarm</div>
              <div className="login-brand-sub">AI publishing operations</div>
            </div>
          </div>

          <div className="login-brand-copy">
            <div className="login-kicker">Start your workspace</div>
            <h1>Self Learning Social Swarm</h1>
            <p>Set up a controlled publishing system for research, approvals, schedules, analytics, and continuous content learning.</p>
          </div>

          <div className="login-signal-stack" aria-hidden="true">
            {[
              ["Default cadence", "3 posts/day", "done"],
              ["Approval gate", "always on", "blocked"],
              ["Learning loop", "enabled", "working"],
            ].map(([label, value, tone]) => (
              <div className="login-signal" key={label}>
                <span className={`login-signal-dot login-signal-${tone}`} />
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="login-brand-footer">
            <span>LinkedIn</span>
            <span>X</span>
            <span>Postiz</span>
          </div>
        </aside>

        <section className="login-card-panel">
          <div className="login-card register-card">
            <div className="login-card-header">
              <div className="login-card-icon">
                <Icon name="user" size={18} />
              </div>
              <div>
                <div className="login-card-title">Create account</div>
                <p>Build your Social Swarm workspace.</p>
              </div>
            </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label className="login-label">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} autoFocus autoComplete="name" placeholder="Nikhil Sharma" style={field} type="text" />
            </div>
            <div>
              <label className="login-label">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@company.com" style={field} type="email" />
            </div>
            <div>
              <label className="login-label">Password</label>
              <PasswordField value={pw} onChange={setPw} placeholder="At least 8 characters" field={field} />
            </div>
            <div>
              <label className="login-label">Confirm password</label>
              <PasswordField value={confirmPw} onChange={setConfirmPw} placeholder="Repeat password" field={field} />
            </div>

            {error && (
              <div style={{ fontSize: 12.5, color: "var(--st-error)", background: "var(--st-error-soft)", border: "1px solid color-mix(in oklab, var(--st-error) 36%, transparent)", borderRadius: "var(--r-sm)", padding: "8px 12px" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: 999, animation: "swarm-spin 0.7s linear infinite" }} />
                  Creating account...
                </span>
              ) : (
                <>
                  Create account
                  <Icon name="arrow-right" size={15} />
                </>
              )}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 11, color: "var(--faint)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <Btn kind="secondary" size="lg" full icon="key" onClick={() => submit()}>Continue with SSO</Btn>

          <p className="faint" style={{ textAlign: "center", fontSize: 12, marginTop: 20 }}>
            Already have an account? <Link href="/login" style={{ color: "var(--accent-2)", fontWeight: 600 }}>Sign in</Link>
          </p>
          <p className="faint" style={{ textAlign: "center", fontSize: 11.5, marginTop: 10, lineHeight: 1.5 }}>
            Secured with JWT · sessions expire after 24h.<br />By continuing you agree to the acceptable-use policy.
          </p>
          </div>
        </section>
      </main>
    </div>
  );
}
