import Link from "next/link";

const techStack = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "PostgreSQL",
  "Prisma 7",
  "Temporal",
  "SearXNG",
  "Postiz",
  "OpenRouter",
  "Docker",
];

const capabilities = [
  "Research current topics from configured sources and search providers.",
  "Generate LinkedIn and X/Twitter content variants from verified ideas.",
  "Require human approval before scheduling or publishing.",
  "Track publishing, analytics, system health, and learning signals.",
];

export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, var(--bg), #070a10)",
      color: "var(--text)",
      padding: "24px",
    }}>
      <div style={{ width: "min(1120px, 100%)", margin: "0 auto", display: "flex", flexDirection: "column", gap: 42 }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "var(--text)", fontWeight: 800, fontSize: 16 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, var(--accent), #7a5cff)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>S</span>
            Social Swarm
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/register" style={{ padding: "9px 14px", borderRadius: 9, border: "1px solid var(--border-strong)", color: "var(--text)", fontWeight: 700 }}>
              Create account
            </Link>
            <Link href="/login" style={{ padding: "9px 16px", borderRadius: 9, background: "var(--accent)", color: "var(--on-accent)", fontWeight: 800 }}>
              Login
            </Link>
          </nav>
        </header>

        <section style={{ maxWidth: 760, paddingTop: 34 }}>
          <div className="eyebrow" style={{ color: "var(--accent-2)", marginBottom: 14 }}>Social Swarm</div>
          <h1 style={{ fontSize: "clamp(38px, 6vw, 72px)", lineHeight: 1.02, fontWeight: 800, letterSpacing: 0 }}>
            Self-learning social media research and publishing system.
          </h1>
          <p style={{ marginTop: 22, fontSize: 18, lineHeight: 1.7, color: "var(--muted)", maxWidth: 680 }}>
            Social Swarm is a controlled AI content pipeline for researching trends, creating platform-native posts,
            routing every draft through approval, scheduling publication, and learning from performance analytics.
          </p>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {capabilities.map((item) => (
            <div key={item} style={{ padding: 18, borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: "var(--accent)", marginBottom: 12 }} />
              <p style={{ color: "var(--text-2)", lineHeight: 1.55 }}>{item}</p>
            </div>
          ))}
        </section>

        <section style={{ padding: 24, borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)" }}>
          <h2 style={{ fontSize: 22, fontWeight: 750, marginBottom: 14 }}>Tech Used</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {techStack.map((tech) => (
              <span key={tech} style={{
                height: 32,
                display: "inline-flex",
                alignItems: "center",
                padding: "0 12px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "var(--chip)",
                color: "var(--muted)",
                fontSize: 13,
                fontFamily: "var(--mono)",
              }}>
                {tech}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
