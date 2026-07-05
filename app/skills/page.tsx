"use client";
/* ============================================================
   SWARM — Skills (upload & manage agent skills), standalone route
   ============================================================ */
import { useState, useEffect, useCallback, useRef, useSyncExternalStore, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Icon, Btn, IconBtn, Badge, Card, Empty } from "../../components/swarm/ui";
import { Sidebar, TopBar } from "../../components/swarm/Shell";
import { DEFAULT_SKILLS, SKILL_CATEGORIES, SKILL_CATEGORY_ICON, type Skill, type SkillCategory } from "../../components/swarm/data";

const SIDEBAR_ROUTES: Record<string, string> = { settings: "/settings", dashboard: "/dashboard", history: "/projects", skills: "/skills" };

/* ---- appearance tweaks, persisted to localStorage (mirrors SwarmApp) ---- */
interface Tweaks { theme: string; accent: string; density: string; motion: number }
const TWEAK_DEFAULTS: Tweaks = { theme: "dark", accent: "blue", density: "comfortable", motion: 60 };
function readTweaks(defaults: Tweaks): Tweaks {
  try {
    const raw = localStorage.getItem("swarm-tweaks");
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch { return defaults; }
}
// useSyncExternalStore returns `getServerSnapshot` for both the server render
// and the initial client hydration pass, then resolves to the real
// client-only value synchronously before paint — this is what avoids the
// hydration mismatch without a setState-in-effect.
const tweaksListeners = new Set<() => void>();
let tweaksCache: Tweaks | null = null;
function subscribeTweaks(cb: () => void) {
  tweaksListeners.add(cb);
  return () => { tweaksListeners.delete(cb); };
}
function getTweaksSnapshot(defaults: Tweaks): Tweaks {
  if (!tweaksCache) tweaksCache = readTweaks(defaults);
  return tweaksCache;
}
function useTweaks(defaults: Tweaks): [Tweaks, (k: keyof Tweaks, v: string | number) => void] {
  const t = useSyncExternalStore(subscribeTweaks, () => getTweaksSnapshot(defaults), () => defaults);
  const setTweak = useCallback((k: keyof Tweaks, v: string | number) => {
    const next = { ...getTweaksSnapshot(defaults), [k]: v };
    try { localStorage.setItem("swarm-tweaks", JSON.stringify(next)); } catch { /* ignore */ }
    tweaksCache = next;
    tweaksListeners.forEach((l) => l());
  }, [defaults]);
  return [t, setTweak];
}

const mInput: CSSProperties = { height: 40, width: "100%", padding: "0 12px", borderRadius: "var(--r-sm)", background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", fontFamily: "var(--font)", fontSize: 14, outline: "none", boxSizing: "border-box" };

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CategoryPick({ value, onChange }: { value: SkillCategory; onChange: (c: SkillCategory) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {SKILL_CATEGORIES.map((c) => {
        const active = c === value;
        return (
          <button key={c} onClick={() => onChange(c)} style={{
            display: "flex", alignItems: "center", gap: 7, padding: "7px 11px", borderRadius: "var(--r-sm)", cursor: "pointer", fontFamily: "var(--font)",
            background: active ? "var(--accent-soft)" : "var(--elevated)", border: `1px solid ${active ? "var(--accent-line)" : "var(--border)"}`,
            color: active ? "var(--accent-2)" : "var(--text-2)", fontSize: 12.5, fontWeight: 600,
          }}>
            <Icon name={SKILL_CATEGORY_ICON[c]} size={13} />{c}
          </button>
        );
      })}
    </div>
  );
}

function UploadSkillModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: Skill) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<SkillCategory>("Research");
  const [version, setVersion] = useState("1.0.0");

  function pickFile(f: File | null) {
    setFile(f);
    if (f && !name.trim()) setName(f.name.replace(/\.[^./]+$/, "").replace(/[-_]+/g, " "));
  }

  function submit() {
    onAdd({
      id: "skill-" + Date.now(),
      name: name.trim(),
      description: description.trim() || "No description provided.",
      category, version: version.trim() || "1.0.0",
      fileName: file?.name || "untitled-skill.json",
      fileSize: file?.size ?? 0,
      uploadedAt: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    });
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "var(--scrim)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} className="glass-strong rise" style={{ width: 520, maxWidth: "92vw", maxHeight: "88vh", overflow: "auto", borderRadius: "var(--r-xl)", padding: 24, boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="cloud-upload" size={17} /></div>
            <h3 className="h3">Upload skill</h3>
          </div>
          <IconBtn name="x" size={30} title="Close" onClick={onClose} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <input ref={fileRef} type="file" hidden onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />
            <div onClick={() => fileRef.current?.click()} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "16px 14px", borderRadius: "var(--r-sm)", cursor: "pointer",
              border: "1px dashed var(--border-strong)", background: "var(--surface)",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", background: "var(--elevated)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}>
                <Icon name="upload" size={17} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{file ? file.name : "Click to choose a skill file"}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{file ? fmtSize(file.size) : "JSON, YAML, Python or JS · any size"}</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Name</div>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. Regulatory Filing Parser" style={mInput} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Description</div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What does this skill let an agent do?" style={{ ...mInput, height: "auto", padding: "10px 12px", resize: "vertical", lineHeight: 1.5 }} />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Category</div>
              <CategoryPick value={category} onChange={setCategory} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Version</div>
            <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" style={{ ...mInput, width: 140 }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 22 }}>
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" icon="cloud-upload" disabled={!name.trim()} onClick={submit}>Upload skill</Btn>
        </div>
      </div>
    </div>
  );
}

function SkillRow({ s, first, onDelete }: { s: Skill; first: boolean; onDelete: () => void }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "minmax(0,2.2fr) 1fr 0.7fr 1.3fr 1fr 0.9fr", alignItems: "center",
      padding: "12px 20px", borderTop: first ? "none" : "1px solid var(--border-soft)", gap: 8,
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--elevated)", border: "1px solid var(--border)", color: "var(--accent)" }}>
          <Icon name={SKILL_CATEGORY_ICON[s.category]} size={14} />
        </span>
        <span style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
          <div className="faint" style={{ fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.description}</div>
        </span>
      </span>
      <span><Badge tone="accent" icon={SKILL_CATEGORY_ICON[s.category]}>{s.category}</Badge></span>
      <span className="mono" style={{ fontSize: 12.5, color: "var(--text-2)" }}>v{s.version}</span>
      <span style={{ minWidth: 0 }}>
        <div className="mono" style={{ fontSize: 12.5, color: "var(--text-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.fileName}</div>
        <div className="faint" style={{ fontSize: 11 }}>{fmtSize(s.fileSize)}</div>
      </span>
      <span className="faint" style={{ fontSize: 12.5 }}>{s.uploadedAt}</span>
      <span style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
        <IconBtn name="download" size={28} title="Download" />
        <IconBtn name="trash" size={28} title="Remove skill" onClick={onDelete} />
      </span>
    </div>
  );
}

export default function SkillsPage() {
  const router = useRouter();
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", t.theme);
    r.setAttribute("data-accent", t.accent);
    r.setAttribute("data-density", t.density);
    r.style.setProperty("--mo", String((t.motion ?? 60) / 100));
  }, [t.theme, t.accent, t.density, t.motion]);

  const [skills, setSkills] = useState<Skill[]>(DEFAULT_SKILLS);
  const [modal, setModal] = useState(false);
  const backHome = () => router.push("/");

  return (
    <div style={{ height: "100vh", display: "flex", background: "var(--bg)", color: "var(--text)" } as CSSProperties}>
      <Sidebar view="skills" activeSession={null}
        onNew={backHome} onGo={({ view }) => router.push(SIDEBAR_ROUTES[view] || "/")} onOpenSession={backHome} />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <TopBar stages={null} stage="skills" reached={["skills"]} onJump={() => {}} status={null} title="Skills" theme={t.theme} onTheme={() => setTweak("theme", t.theme === "dark" ? "light" : "dark")} />
        <div style={{ overflow: "auto", height: "100%", padding: "32px 24px" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
              <div>
                <h1 className="h1">Skills</h1>
                <p className="muted" style={{ fontSize: 14.5, marginTop: 4 }}>Upload capabilities your agents can call on · {skills.length} installed</p>
              </div>
              <Btn kind="primary" icon="cloud-upload" onClick={() => setModal(true)}>Upload skill</Btn>
            </div>

            {skills.length === 0 ? (
              <Card style={{ padding: 0 }}>
                <Empty icon="tools" title="No skills yet" body="Upload a skill file to make a new capability available to your agents." action={<Btn kind="primary" icon="cloud-upload" onClick={() => setModal(true)}>Upload skill</Btn>} />
              </Card>
            ) : (
              <Card style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,2.2fr) 1fr 0.7fr 1.3fr 1fr 0.9fr", padding: "10px 20px", borderBottom: "1px solid var(--border-soft)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--faint)", gap: 8 }}>
                  <span>Skill</span><span>Category</span><span>Version</span><span>File</span><span>Uploaded</span><span style={{ textAlign: "right" }}>Actions</span>
                </div>
                {skills.map((s, i) => (
                  <SkillRow key={s.id} s={s} first={i === 0} onDelete={() => setSkills((prev) => prev.filter((x) => x.id !== s.id))} />
                ))}
              </Card>
            )}
          </div>
        </div>
      </main>
      {modal && <UploadSkillModal onClose={() => setModal(false)} onAdd={(s) => { setSkills((prev) => [s, ...prev]); setModal(false); }} />}
    </div>
  );
}
