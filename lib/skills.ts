import type { SkillCategory } from "../generated/prisma/enums";

// The UI's SkillCategory type uses the display label "Data Analysis" (with a
// space); Prisma enum members can't contain spaces, so the DB value is
// "DataAnalysis". Every other category string is identical in both.
export const UI_TO_DB_CATEGORY: Record<string, SkillCategory> = {
  Research: "Research",
  Writing: "Writing",
  "Data Analysis": "DataAnalysis",
  Automation: "Automation",
  Custom: "Custom",
};

export const DB_TO_UI_CATEGORY: Record<string, string> = {
  Research: "Research",
  Writing: "Writing",
  DataAnalysis: "Data Analysis",
  Automation: "Automation",
  Custom: "Custom",
};
