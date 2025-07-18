ALTER TABLE "ingestion_sources" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "ingestion_sources" ALTER COLUMN "status" SET DEFAULT 'pending_auth'::text;--> statement-breakpoint
DROP TYPE "public"."ingestion_status";--> statement-breakpoint
CREATE TYPE "public"."ingestion_status" AS ENUM('active', 'paused', 'error', 'pending_auth', 'syncing', 'importing', 'auth_success');--> statement-breakpoint
ALTER TABLE "ingestion_sources" ALTER COLUMN "status" SET DEFAULT 'pending_auth'::"public"."ingestion_status";--> statement-breakpoint
ALTER TABLE "ingestion_sources" ALTER COLUMN "status" SET DATA TYPE "public"."ingestion_status" USING "status"::"public"."ingestion_status";