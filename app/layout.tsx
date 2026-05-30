import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swarm — AI orchestration",
  description:
    "Set a goal. Approve a team of specialist agents. Watch the swarm research live and hand you a finished deliverable.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" data-accent="blue" data-density="comfortable">
      <body>
        <div id="swarm-root">{children}</div>
      </body>
    </html>
  );
}
