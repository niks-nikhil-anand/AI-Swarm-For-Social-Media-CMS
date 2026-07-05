import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUserId } from "../../../../lib/auth";
import { DB_TO_UI_CATEGORY } from "../../../../lib/skills";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const skills = await prisma.skill.findMany({
    where: { userId: { not: userId } },
    orderBy: { uploadedAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(
    skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      category: DB_TO_UI_CATEGORY[skill.category] || skill.category,
      version: skill.version,
      fileName: skill.fileName,
      fileSize: skill.fileSize,
      uploadedAt: skill.uploadedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      uploadedBy: skill.user.name || skill.user.email,
    }))
  );
}
