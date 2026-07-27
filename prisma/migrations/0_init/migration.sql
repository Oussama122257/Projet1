-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'STARTER', 'PRO', 'SCALE');

-- CreateEnum
CREATE TYPE "AutopilotMode" AS ENUM ('OFF', 'ASSISTED', 'AUTO');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApifyRunStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('DISCOVERED', 'DOWNLOADING', 'STORED', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AiAnalysisStatus" AS ENUM ('PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "PipelineStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DRAFT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PipelineGoal" AS ENUM ('REACH', 'ENGAGEMENT', 'FOLLOWERS', 'TRAFFIC', 'CONVERSIONS');

-- CreateEnum
CREATE TYPE "PipelineMediaStatus" AS ENUM ('AVAILABLE', 'QUEUED', 'SCHEDULED', 'PUBLISHED', 'SKIPPED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('CONNECTED', 'EXPIRED', 'ERROR', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "ScheduledPostStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'QUEUED', 'SENT_TO_METRICOOL', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('CONTENT_PATTERN', 'POSTING_TIME', 'SOURCE_PERFORMANCE', 'HOOK_PATTERN', 'CAPTION_PATTERN', 'AUDIENCE_PATTERN', 'RECOMMENDATION');

-- CreateEnum
CREATE TYPE "ExperimentStatus" AS ENUM ('DRAFT', 'RUNNING', 'COMPLETED', 'STOPPED');

-- CreateEnum
CREATE TYPE "ExperimentVariable" AS ENUM ('CAPTION', 'HOOK', 'POSTING_TIME', 'HASHTAGS', 'THUMBNAIL', 'FORMAT', 'LENGTH', 'CTA');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'ACTIVE', 'COMPLETED', 'FAILED', 'DELAYED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "allowAiAnalysis" BOOLEAN NOT NULL DEFAULT true,
    "allowAiPerformance" BOOLEAN NOT NULL DEFAULT true,
    "allowAiCaptions" BOOLEAN NOT NULL DEFAULT true,
    "allowAiRecommendations" BOOLEAN NOT NULL DEFAULT true,
    "preferredAiProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "limit" INTEGER NOT NULL,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'instagram',
    "status" "SourceStatus" NOT NULL DEFAULT 'ACTIVE',
    "monitoringFrequencyMins" INTEGER NOT NULL DEFAULT 1440,
    "authorizationConfirmedAt" TIMESTAMP(3),
    "inputTemplate" JSONB,
    "lastScanAt" TIMESTAMP(3),
    "videosFound" INTEGER NOT NULL DEFAULT 0,
    "videosImported" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apify_runs" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "apifyRunId" TEXT,
    "datasetId" TEXT,
    "status" "ApifyRunStatus" NOT NULL DEFAULT 'PENDING',
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "itemsImported" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "apify_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'instagram',
    "platformMediaId" TEXT,
    "sourceId" TEXT,
    "originalUrl" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "storageKey" TEXT,
    "thumbnailKey" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "duration" DOUBLE PRECISION,
    "width" INTEGER,
    "height" INTEGER,
    "caption" TEXT,
    "hashtags" TEXT[],
    "publishedAt" TIMESTAMP(3),
    "contentHash" TEXT,
    "raw" JSONB,
    "aiAnalysisStatus" "AiAnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "aiScore" INTEGER,
    "status" "MediaStatus" NOT NULL DEFAULT 'DISCOVERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipelines" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "PipelineStatus" NOT NULL DEFAULT 'DRAFT',
    "goal" "PipelineGoal" NOT NULL DEFAULT 'ENGAGEMENT',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aiScoring" BOOLEAN NOT NULL DEFAULT true,
    "aiCaptionGeneration" BOOLEAN NOT NULL DEFAULT false,
    "aiHashtagGeneration" BOOLEAN NOT NULL DEFAULT false,
    "aiScheduling" BOOLEAN NOT NULL DEFAULT false,
    "aiRecommendations" BOOLEAN NOT NULL DEFAULT true,
    "autopilotMode" "AutopilotMode" NOT NULL DEFAULT 'OFF',
    "abTestingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "diversityRules" JSONB,
    "sourceAllocation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_sources" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "allocationWeight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "filters" JSONB,

    CONSTRAINT "pipeline_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_media" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "status" "PipelineMediaStatus" NOT NULL DEFAULT 'AVAILABLE',
    "aiScore" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "pipeline_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "postsPerDay" INTEGER NOT NULL DEFAULT 1,
    "aiOptimized" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_slots" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "time" TEXT NOT NULL,

    CONSTRAINT "schedule_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metricool_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "encryptedUserToken" TEXT NOT NULL,
    "metricoolUserId" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'CONNECTED',
    "brandsJson" JSONB,
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metricool_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_destinations" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "network" TEXT NOT NULL DEFAULT 'instagram',
    "displayName" TEXT,
    "autoPublish" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "pipeline_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_posts" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "status" "ScheduledPostStatus" NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMP(3) NOT NULL,
    "caption" TEXT,
    "hashtags" TEXT[],
    "captionSource" TEXT,
    "metricoolPostId" TEXT,
    "experimentVariantId" TEXT,
    "error" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_performance" (
    "id" TEXT NOT NULL,
    "scheduledPostId" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "platformPostId" TEXT,
    "views" INTEGER,
    "reach" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "saves" INTEGER,
    "watchTime" DOUBLE PRECISION,
    "completionRate" DOUBLE PRECISION,
    "engagementRate" DOUBLE PRECISION,
    "followersGained" INTEGER,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_content_analysis" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL DEFAULT 'v1',
    "contentType" TEXT,
    "hookType" TEXT,
    "hookStrength" INTEGER,
    "visualQuality" INTEGER,
    "trendScore" INTEGER,
    "audienceFit" INTEGER,
    "originalityScore" INTEGER,
    "reusabilityScore" INTEGER,
    "predictedPerformance" INTEGER,
    "confidence" TEXT,
    "analysisJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_content_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_embeddings" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pipelineId" TEXT,
    "type" "InsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "evidenceJson" JSONB NOT NULL,
    "confidence" TEXT NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "dateRangeStart" TIMESTAMP(3),
    "dateRangeEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_intelligence_profiles" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "profileJson" JSONB NOT NULL,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_intelligence_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pipelineId" TEXT,
    "brandName" TEXT,
    "targetAudience" TEXT,
    "tone" TEXT,
    "vocabulary" TEXT,
    "wordsToAvoid" TEXT[],
    "ctaStyle" TEXT,
    "emojiUsage" TEXT NOT NULL DEFAULT 'moderate',
    "language" TEXT NOT NULL DEFAULT 'en',
    "dialect" TEXT,

    CONSTRAINT "brand_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pipelineId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "subjectType" TEXT,
    "subjectId" TEXT,
    "reason" TEXT,
    "userAction" TEXT,
    "resultJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hypothesis" TEXT NOT NULL,
    "variable" "ExperimentVariable" NOT NULL,
    "primaryMetric" TEXT NOT NULL,
    "status" "ExperimentStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "winner" TEXT,
    "confidence" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_variants" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "configuration" JSONB NOT NULL,

    CONSTRAINT "experiment_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_results" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "views" INTEGER,
    "reach" INTEGER,
    "engagement" DOUBLE PRECISION,
    "shares" INTEGER,
    "saves" INTEGER,
    "watchTime" DOUBLE PRECISION,
    "conversionMetric" DOUBLE PRECISION,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "queue" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bullJobId" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "level" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "settings_userId_key_key" ON "settings"("userId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "usage_records_userId_metric_periodStart_key" ON "usage_records"("userId", "metric", "periodStart");

-- CreateIndex
CREATE INDEX "sources_userId_status_idx" ON "sources"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "apify_runs_apifyRunId_key" ON "apify_runs"("apifyRunId");

-- CreateIndex
CREATE INDEX "apify_runs_sourceId_status_idx" ON "apify_runs"("sourceId", "status");

-- CreateIndex
CREATE INDEX "media_userId_status_idx" ON "media"("userId", "status");

-- CreateIndex
CREATE INDEX "media_contentHash_idx" ON "media"("contentHash");

-- CreateIndex
CREATE INDEX "media_canonicalUrl_idx" ON "media"("canonicalUrl");

-- CreateIndex
CREATE UNIQUE INDEX "media_platform_platformMediaId_key" ON "media"("platform", "platformMediaId");

-- CreateIndex
CREATE INDEX "pipelines_userId_status_idx" ON "pipelines"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_sources_pipelineId_sourceId_key" ON "pipeline_sources"("pipelineId", "sourceId");

-- CreateIndex
CREATE INDEX "pipeline_media_pipelineId_status_priority_idx" ON "pipeline_media"("pipelineId", "status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_media_pipelineId_mediaId_key" ON "pipeline_media"("pipelineId", "mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_pipelineId_key" ON "schedules"("pipelineId");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_destinations_pipelineId_key" ON "pipeline_destinations"("pipelineId");

-- CreateIndex
CREATE INDEX "scheduled_posts_pipelineId_status_publishAt_idx" ON "scheduled_posts"("pipelineId", "status", "publishAt");

-- CreateIndex
CREATE INDEX "post_performance_scheduledPostId_collectedAt_idx" ON "post_performance"("scheduledPostId", "collectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ai_content_analysis_mediaId_key" ON "ai_content_analysis"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_embeddings_mediaId_key" ON "ai_embeddings"("mediaId");

-- CreateIndex
CREATE INDEX "ai_insights_userId_type_createdAt_idx" ON "ai_insights"("userId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "content_intelligence_profiles_destinationId_key" ON "content_intelligence_profiles"("destinationId");

-- CreateIndex
CREATE UNIQUE INDEX "brand_profiles_pipelineId_key" ON "brand_profiles"("pipelineId");

-- CreateIndex
CREATE INDEX "ai_usage_userId_createdAt_idx" ON "ai_usage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_audit_logs_userId_createdAt_idx" ON "ai_audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "experiments_userId_status_idx" ON "experiments"("userId", "status");

-- CreateIndex
CREATE INDEX "jobs_userId_createdAt_idx" ON "jobs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "jobs_queue_status_idx" ON "jobs"("queue", "status");

-- CreateIndex
CREATE INDEX "logs_userId_createdAt_idx" ON "logs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apify_runs" ADD CONSTRAINT "apify_runs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_sources" ADD CONSTRAINT "pipeline_sources_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_sources" ADD CONSTRAINT "pipeline_sources_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_media" ADD CONSTRAINT "pipeline_media_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_media" ADD CONSTRAINT "pipeline_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metricool_connections" ADD CONSTRAINT "metricool_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_destinations" ADD CONSTRAINT "pipeline_destinations_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_destinations" ADD CONSTRAINT "pipeline_destinations_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "metricool_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "pipeline_destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_experimentVariantId_fkey" FOREIGN KEY ("experimentVariantId") REFERENCES "experiment_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_performance" ADD CONSTRAINT "post_performance_scheduledPostId_fkey" FOREIGN KEY ("scheduledPostId") REFERENCES "scheduled_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_content_analysis" ADD CONSTRAINT "ai_content_analysis_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_embeddings" ADD CONSTRAINT "ai_embeddings_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_intelligence_profiles" ADD CONSTRAINT "content_intelligence_profiles_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "pipeline_destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_profiles" ADD CONSTRAINT "brand_profiles_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_audit_logs" ADD CONSTRAINT "ai_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiments" ADD CONSTRAINT "experiments_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_variants" ADD CONSTRAINT "experiment_variants_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "experiments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_results" ADD CONSTRAINT "experiment_results_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "experiment_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

