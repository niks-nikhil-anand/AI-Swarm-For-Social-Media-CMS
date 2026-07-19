export { analyticsAgentPrompt } from "./analytics-agent";
export { approvalManagerPrompt } from "./approval-manager";
export { contentQualityAgentPrompt } from "./content-quality-agent";
export { contentRepurposingAgentPrompt } from "./content-repurposing-agent";
export { engagementAgentPrompt } from "./engagement-agent";
export { factCheckingAgentPrompt } from "./fact-checking-agent";
export { learningAgentPrompt } from "./learning-agent";
export { linkedInWriterPrompt } from "./linkedin-writer";
export { schedulerPublisherPrompt } from "./scheduler-publisher";
export { seoKeywordAgentPrompt } from "./seo-keyword-agent";
export { socialListeningAgentPrompt } from "./social-listening-agent";
export { topicSelectionAgentPrompt } from "./topic-selection-agent";
export { trendResearchAgentPrompt } from "./trend-research-agent";
export { visualContentAgentPrompt } from "./visual-content-agent";
export { xTwitterWriterPrompt } from "./x-twitter-writer";

import { analyticsAgentPrompt } from "./analytics-agent";
import { approvalManagerPrompt } from "./approval-manager";
import { contentQualityAgentPrompt } from "./content-quality-agent";
import { contentRepurposingAgentPrompt } from "./content-repurposing-agent";
import { engagementAgentPrompt } from "./engagement-agent";
import { factCheckingAgentPrompt } from "./fact-checking-agent";
import { learningAgentPrompt } from "./learning-agent";
import { linkedInWriterPrompt } from "./linkedin-writer";
import { schedulerPublisherPrompt } from "./scheduler-publisher";
import { seoKeywordAgentPrompt } from "./seo-keyword-agent";
import { socialListeningAgentPrompt } from "./social-listening-agent";
import { topicSelectionAgentPrompt } from "./topic-selection-agent";
import { trendResearchAgentPrompt } from "./trend-research-agent";
import { visualContentAgentPrompt } from "./visual-content-agent";
import { xTwitterWriterPrompt } from "./x-twitter-writer";

export const agentPrompts = {
  "analytics-agent": analyticsAgentPrompt,
  "approval-manager": approvalManagerPrompt,
  "content-quality-agent": contentQualityAgentPrompt,
  "content-repurposing-agent": contentRepurposingAgentPrompt,
  "engagement-agent": engagementAgentPrompt,
  "fact-checking-agent": factCheckingAgentPrompt,
  "learning-agent": learningAgentPrompt,
  "linkedin-writer": linkedInWriterPrompt,
  "scheduler-publisher": schedulerPublisherPrompt,
  "seo-keyword-agent": seoKeywordAgentPrompt,
  "social-listening-agent": socialListeningAgentPrompt,
  "topic-selection-agent": topicSelectionAgentPrompt,
  "trend-research-agent": trendResearchAgentPrompt,
  "visual-content-agent": visualContentAgentPrompt,
  "x-twitter-writer": xTwitterWriterPrompt,
} as const;

export type AgentPromptKey = keyof typeof agentPrompts;

export function getAgentPrompt(key: AgentPromptKey): string {
  return agentPrompts[key];
}
