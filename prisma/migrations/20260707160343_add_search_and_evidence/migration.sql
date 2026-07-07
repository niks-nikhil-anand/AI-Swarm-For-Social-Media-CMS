-- CreateTable
CREATE TABLE "SearchResult" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "snippet" TEXT,
    "engine" TEXT,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "searchResultId" TEXT,
    "agentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceTitle" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SearchResult_projectId_idx" ON "SearchResult"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "SearchResult_projectId_url_key" ON "SearchResult"("projectId", "url");

-- CreateIndex
CREATE INDEX "Evidence_projectId_idx" ON "Evidence"("projectId");

-- CreateIndex
CREATE INDEX "Evidence_agentId_idx" ON "Evidence"("agentId");

-- CreateIndex
CREATE INDEX "Evidence_topic_idx" ON "Evidence"("topic");

-- AddForeignKey
ALTER TABLE "SearchResult" ADD CONSTRAINT "SearchResult_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "ProjectAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_searchResultId_fkey" FOREIGN KEY ("searchResultId") REFERENCES "SearchResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
