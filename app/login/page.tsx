"use client";
/* ============================================================
   SWARM — Login (JWT) with animated swarm backdrop, standalone route
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!email.trim() || !pw) { setError("Enter your email and password."); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
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
    height: 44, width: "100%", padding: "0 14px", borderRadius: "var(--r-sm)",
    background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)",
    fontFamily: "var(--font)", fontSize: 14, outline: "none",
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <SwarmBackdrop />
      <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: 720, height: 720, borderRadius: "50%", background: "radial-gradient(circle, var(--accent-soft), transparent 62%)", filter: "blur(20px)", pointerEvents: "none" }} />

      <div className="rise" style={{ position: "relative", width: 392, maxWidth: "92vw" }}>
        <div className="glass-strong" style={{ borderRadius: "var(--r-xl)", padding: 32, boxShadow: "var(--shadow-lg)" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 26 }}>
            <div style={{ width: 56, height: 56, borderRadius: "var(--r-lg)", background: "var(--elevated)", border: "1px solid var(--glass-border)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px -6px var(--accent-glow)" }}>
              <SwarmMark size={32} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>Welcome to Swarm</div>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>Set a goal. Approve a team. Watch it work.</p>
            </div>
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label className="eyebrow" style={{ display: "block", marginBottom: 6, textTransform: "none", letterSpacing: 0, fontSize: 12.5, fontWeight: 600, color: "var(--text-2)" }}>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} style={field} type="email" />
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label className="eyebrow" style={{ textTransform: "none", letterSpacing: 0, fontSize: 12.5, fontWeight: 600, color: "var(--text-2)" }}>Password</label>
                <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: 12 }}>Forgot?</a>
              </div>
              <PasswordField value={pw} onChange={setPw} field={field} />
            </div>

            {error && (
              <div style={{ fontSize: 12.5, color: "var(--st-error)", background: "var(--st-error-soft)", border: "1px solid color-mix(in oklab, var(--st-error) 36%, transparent)", borderRadius: "var(--r-sm)", padding: "8px 12px" }}>
                {error}
              </div>
            )}

            <Btn kind="primary" size="lg" full type="submit" disabled={loading} iconRight={loading ? undefined : "arrow-right"} style={{ marginTop: 6 }}>
              {loading ? <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: 999, animation: "swarm-spin 0.7s linear infinite" }} /> Authenticating…</span> : "Sign in"}
            </Btn>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 11, color: "var(--faint)" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          <Btn kind="secondary" size="lg" full icon="key" onClick={() => submit()}>Continue with SSO</Btn>

          <p className="faint" style={{ textAlign: "center", fontSize: 12, marginTop: 20 }}>
            New to Swarm? <Link href="/register" style={{ color: "var(--accent-2)", fontWeight: 600 }}>Create an account</Link>
          </p>
          <p className="faint" style={{ textAlign: "center", fontSize: 11.5, marginTop: 10, lineHeight: 1.5 }}>
            Secured with JWT · sessions expire after 24h.<br />By continuing you agree to the acceptable-use policy.
          </p>
        </div>
      </div>
    </div>
  );
}
