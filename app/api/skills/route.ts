import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUserId } from "../../../lib/auth";
import { UI_TO_DB_CATEGORY, DB_TO_UI_CATEGORY } from "../../../lib/skills";

function toApiSkill(skill: { id: string; name: string; description: string; category: string; version: string; fileName: string; fileSize: number; uploadedAt: Date }) {
  return {
    id: skill.id,
    name: skill.name,
    description: skill.description,
    category: DB_TO_UI_CATEGORY[skill.category] || skill.category,
    version: skill.version,
    fileName: skill.fileName,
    fileSize: skill.fileSize,
    uploadedAt: skill.uploadedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
  };
}

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const skills = await prisma.skill.findMany({ where: { userId }, orderBy: { uploadedAt: "desc" } });
  return NextResponse.json(skills.map(toApiSkill));
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const category = UI_TO_DB_CATEGORY[body?.category] || null;
  const version = typeof body?.version === "string" ? body.version.trim() : "1.0.0";
  const fileName = typeof body?.fileName === "string" ? body.fileName : "untitled-skill.json";
  const fileSize = typeof body?.fileSize === "number" ? body.fileSize : 0;

  if (!name || !category) {
    return NextResponse.json({ error: "Name and category are required." }, { status: 400 });
  }

  const skill = await prisma.skill.create({
    data: { userId, name, description: description || "No description provided.", category, version, fileName, fileSize },
  });
  return NextResponse.json(toApiSkill(skill), { status: 201 });
}
