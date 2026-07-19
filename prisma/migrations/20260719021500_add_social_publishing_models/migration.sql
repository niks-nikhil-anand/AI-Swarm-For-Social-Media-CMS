-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('LinkedIn', 'X');

-- CreateEnum
CREATE TYPE "ContentDraftStatus" AS ENUM ('Draft', 'InReview', 'NeedsApproval', 'Approved', 'ChangesRequested', 'Rejected', 'Scheduled', 'Published', 'Failed');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('Pending', 'Approved', 'ChangesRequested', 'Rejected', 'Expired');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('Queued', 'Scheduled', 'Publishing', 'Published', 'Failed', 'Cancelled');

-- CreateEnum
CREATE TYPE "SignalSourceType" AS ENUM ('SearXNG', 'X', 'LinkedIn', 'Reddit', 'YouTube', 'News', 'Competitor', 'Website');

-- CreateEnum
CREATE TYPE "FactCheckStatus" AS ENUM ('Verified', 'NeedsReview', 'Unsupported', 'Outdated', 'ConflictingSources');

-- CreateTable
CREATE TABLE "ContentCampaign" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objective" TEXT,
    "audience" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "postsPerDay" INTEGER NOT NULL DEFAULT 3,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "ContentCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentDraft" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "trendSignalId" TEXT,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "objective" TEXT,
    "audience" TEXT,
    "contentPillar" TEXT,
    "primaryKeyword" TEXT,
    "secondaryKeywords" TEXT[],
    "suggestedCta" TEXT,
    "targetPlatforms" "SocialPlatform"[],
    "status" "ContentDraftStatus" NOT NULL DEFAULT 'Draft',
    "qualityScore" INTEGER,
    "factStatus" "FactCheckStatus",
    "supportingUrls" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVariant" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "hook" TEXT,
    "body" TEXT NOT NULL,
    "threadItems" TEXT[],
    "hashtags" TEXT[],
    "visualBrief" TEXT,
    "sourceReferences" TEXT[],
    "modelUsed" TEXT,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "characterCount" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" INTEGER,
    "factStatus" "FactCheckStatus",
    "contentHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "decidedById" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'Pending',
    "message" TEXT,
    "decisionNote" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "displayName" TEXT NOT NULL,
    "handle" TEXT,
    "postizAccountId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishingSchedule" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "approvalId" TEXT,
    "accountId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'Queued',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "postizPostId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublishingSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishedPost" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "postizPostId" TEXT,
    "platformPostId" TEXT,
    "url" VARCHAR(2048),
    "contentHash" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublishedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSource" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "type" "SignalSourceType" NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT,
    "url" VARCHAR(2048),
    "handle" TEXT,
    "keywords" TEXT[],
    "allowedDomains" TEXT[],
    "blockedDomains" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendSignal" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "type" "SignalSourceType" NOT NULL,
    "topic" TEXT NOT NULL,
    "title" TEXT,
    "url" VARCHAR(2048),
    "snippet" TEXT,
    "sourceName" TEXT,
    "sourceCount" INTEGER NOT NULL DEFAULT 1,
    "trendDirection" TEXT,
    "targetAudience" TEXT,
    "suggestedAngles" TEXT[],
    "supportingUrls" TEXT[],
    "primaryKeyword" TEXT,
    "opportunityScore" INTEGER,
    "freshnessScore" INTEGER,
    "businessRelevance" INTEGER,
    "audienceRelevance" INTEGER,
    "engagementPotential" INTEGER,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactCheckResult" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "status" "FactCheckStatus" NOT NULL,
    "sourceUrl" VARCHAR(2048),
    "sourceTitle" TEXT,
    "confidence" INTEGER,
    "notes" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FactCheckResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentQualityScore" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "clarity" INTEGER NOT NULL,
    "brandAlignment" INTEGER NOT NULL,
    "platformFit" INTEGER NOT NULL,
    "factualConfidence" INTEGER NOT NULL,
    "engagementPotential" INTEGER NOT NULL,
    "ctaQuality" INTEGER,
    "hashtagQuality" INTEGER,
    "overallScore" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentQualityScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentMetric" (
    "id" TEXT NOT NULL,
    "publishedPostId" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "windowHours" INTEGER NOT NULL,
    "impressions" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "reposts" INTEGER,
    "saves" INTEGER,
    "profileVisits" INTEGER,
    "linkClicks" INTEGER,
    "leads" INTEGER,
    "followersGained" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "conversionRate" DOUBLE PRECISION,
    "raw" JSONB,

    CONSTRAINT "ContentMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemHealthCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "service" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "latencyMs" INTEGER,
    "message" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemHealthCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentCampaign_userId_idx" ON "ContentCampaign"("userId");

-- CreateIndex
CREATE INDEX "ContentCampaign_archivedAt_idx" ON "ContentCampaign"("archivedAt");

-- CreateIndex
CREATE INDEX "ContentDraft_campaignId_idx" ON "ContentDraft"("campaignId");

-- CreateIndex
CREATE INDEX "ContentDraft_trendSignalId_idx" ON "ContentDraft"("trendSignalId");

-- CreateIndex
CREATE INDEX "ContentDraft_status_idx" ON "ContentDraft"("status");

-- CreateIndex
CREATE INDEX "ContentDraft_createdAt_idx" ON "ContentDraft"("createdAt");

-- CreateIndex
CREATE INDEX "ContentVariant_draftId_idx" ON "ContentVariant"("draftId");

-- CreateIndex
CREATE INDEX "ContentVariant_platform_idx" ON "ContentVariant"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "ContentVariant_platform_contentHash_key" ON "ContentVariant"("platform", "contentHash");

-- CreateIndex
CREATE INDEX "ApprovalRequest_variantId_idx" ON "ApprovalRequest"("variantId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requestedById_idx" ON "ApprovalRequest"("requestedById");

-- CreateIndex
CREATE INDEX "ApprovalRequest_decidedById_idx" ON "ApprovalRequest"("decidedById");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_expiresAt_idx" ON "ApprovalRequest"("expiresAt");

-- CreateIndex
CREATE INDEX "PlatformAccount_userId_idx" ON "PlatformAccount"("userId");

-- CreateIndex
CREATE INDEX "PlatformAccount_platform_idx" ON "PlatformAccount"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAccount_userId_platform_postizAccountId_key" ON "PlatformAccount"("userId", "platform", "postizAccountId");

-- CreateIndex
CREATE INDEX "PublishingSchedule_variantId_idx" ON "PublishingSchedule"("variantId");

-- CreateIndex
CREATE INDEX "PublishingSchedule_approvalId_idx" ON "PublishingSchedule"("approvalId");

-- CreateIndex
CREATE INDEX "PublishingSchedule_accountId_idx" ON "PublishingSchedule"("accountId");

-- CreateIndex
CREATE INDEX "PublishingSchedule_status_idx" ON "PublishingSchedule"("status");

-- CreateIndex
CREATE INDEX "PublishingSchedule_scheduledFor_idx" ON "PublishingSchedule"("scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "PublishingSchedule_platform_idempotencyKey_key" ON "PublishingSchedule"("platform", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "PublishingSchedule_variantId_platform_scheduledFor_key" ON "PublishingSchedule"("variantId", "platform", "scheduledFor");

-- CreateIndex
CREATE UNIQUE INDEX "PublishedPost_scheduleId_key" ON "PublishedPost"("scheduleId");

-- CreateIndex
CREATE INDEX "PublishedPost_accountId_idx" ON "PublishedPost"("accountId");

-- CreateIndex
CREATE INDEX "PublishedPost_platform_idx" ON "PublishedPost"("platform");

-- CreateIndex
CREATE INDEX "PublishedPost_publishedAt_idx" ON "PublishedPost"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PublishedPost_platform_platformPostId_key" ON "PublishedPost"("platform", "platformPostId");

-- CreateIndex
CREATE INDEX "ContentSource_userId_idx" ON "ContentSource"("userId");

-- CreateIndex
CREATE INDEX "ContentSource_campaignId_idx" ON "ContentSource"("campaignId");

-- CreateIndex
CREATE INDEX "ContentSource_type_idx" ON "ContentSource"("type");

-- CreateIndex
CREATE INDEX "ContentSource_isActive_idx" ON "ContentSource"("isActive");

-- CreateIndex
CREATE INDEX "TrendSignal_sourceId_idx" ON "TrendSignal"("sourceId");

-- CreateIndex
CREATE INDEX "TrendSignal_type_idx" ON "TrendSignal"("type");

-- CreateIndex
CREATE INDEX "TrendSignal_topic_idx" ON "TrendSignal"("topic");

-- CreateIndex
CREATE INDEX "TrendSignal_opportunityScore_idx" ON "TrendSignal"("opportunityScore");

-- CreateIndex
CREATE INDEX "TrendSignal_capturedAt_idx" ON "TrendSignal"("capturedAt");

-- CreateIndex
CREATE INDEX "FactCheckResult_variantId_idx" ON "FactCheckResult"("variantId");

-- CreateIndex
CREATE INDEX "FactCheckResult_status_idx" ON "FactCheckResult"("status");

-- CreateIndex
CREATE INDEX "ContentQualityScore_variantId_idx" ON "ContentQualityScore"("variantId");

-- CreateIndex
CREATE INDEX "ContentQualityScore_overallScore_idx" ON "ContentQualityScore"("overallScore");

-- CreateIndex
CREATE INDEX "ContentMetric_publishedPostId_idx" ON "ContentMetric"("publishedPostId");

-- CreateIndex
CREATE INDEX "ContentMetric_collectedAt_idx" ON "ContentMetric"("collectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentMetric_publishedPostId_windowHours_collectedAt_key" ON "ContentMetric"("publishedPostId", "windowHours", "collectedAt");

-- CreateIndex
CREATE INDEX "SystemHealthCheck_userId_idx" ON "SystemHealthCheck"("userId");

-- CreateIndex
CREATE INDEX "SystemHealthCheck_service_idx" ON "SystemHealthCheck"("service");

-- CreateIndex
CREATE INDEX "SystemHealthCheck_status_idx" ON "SystemHealthCheck"("status");

-- CreateIndex
CREATE INDEX "SystemHealthCheck_checkedAt_idx" ON "SystemHealthCheck"("checkedAt");

-- AddForeignKey
ALTER TABLE "ContentCampaign" ADD CONSTRAINT "ContentCampaign_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ContentCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentDraft" ADD CONSTRAINT "ContentDraft_trendSignalId_fkey" FOREIGN KEY ("trendSignalId") REFERENCES "TrendSignal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentVariant" ADD CONSTRAINT "ContentVariant_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "ContentDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ContentVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAccount" ADD CONSTRAINT "PlatformAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishingSchedule" ADD CONSTRAINT "PublishingSchedule_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ContentVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishingSchedule" ADD CONSTRAINT "PublishingSchedule_approvalId_fkey" FOREIGN KEY ("approvalId") REFERENCES "ApprovalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishingSchedule" ADD CONSTRAINT "PublishingSchedule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishedPost" ADD CONSTRAINT "PublishedPost_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "PublishingSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishedPost" ADD CONSTRAINT "PublishedPost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSource" ADD CONSTRAINT "ContentSource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSource" ADD CONSTRAINT "ContentSource_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "ContentCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendSignal" ADD CONSTRAINT "TrendSignal_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ContentSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactCheckResult" ADD CONSTRAINT "FactCheckResult_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ContentVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentQualityScore" ADD CONSTRAINT "ContentQualityScore_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ContentVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentMetric" ADD CONSTRAINT "ContentMetric_publishedPostId_fkey" FOREIGN KEY ("publishedPostId") REFERENCES "PublishedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemHealthCheck" ADD CONSTRAINT "SystemHealthCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
