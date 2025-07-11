CREATE TYPE "public"."retention_action" AS ENUM('delete_permanently', 'notify_admin');--> statement-breakpoint
CREATE TYPE "public"."ingestion_provider" AS ENUM('google_workspace', 'microsoft_365', 'generic_imap');--> statement-breakpoint
CREATE TYPE "public"."ingestion_status" AS ENUM('active', 'paused', 'error', 'pending_auth', 'syncing');--> statement-breakpoint
CREATE TABLE "archived_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"custodian_id" uuid NOT NULL,
	"message_id_header" text NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"subject" text,
	"sender_name" text,
	"sender_email" text NOT NULL,
	"recipients" jsonb,
	"storage_path" text NOT NULL,
	"storage_hash_sha256" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"is_indexed" boolean DEFAULT false NOT NULL,
	"has_attachments" boolean DEFAULT false NOT NULL,
	"is_on_legal_hold" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text,
	"size_bytes" bigint NOT NULL,
	"content_hash_sha256" text NOT NULL,
	"storage_path" text NOT NULL,
	CONSTRAINT "attachments_content_hash_sha256_unique" UNIQUE("content_hash_sha256")
);
--> statement-breakpoint
CREATE TABLE "email_attachments" (
	"email_id" uuid NOT NULL,
	"attachment_id" uuid NOT NULL,
	CONSTRAINT "email_attachments_email_id_attachment_id_pk" PRIMARY KEY("email_id","attachment_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_identifier" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"details" jsonb,
	"is_tamper_evident" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "ediscovery_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"created_by_identifier" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ediscovery_cases_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "export_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"format" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"query" jsonb NOT NULL,
	"file_path" text,
	"created_by_identifier" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "legal_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"custodian_id" uuid,
	"hold_criteria" jsonb,
	"reason" text,
	"applied_by_identifier" text NOT NULL,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"removed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "retention_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"priority" integer NOT NULL,
	"retention_period_days" integer NOT NULL,
	"action_on_expiry" "retention_action" NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"conditions" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "retention_policies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "custodians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"display_name" text,
	"source_type" "ingestion_provider" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custodians_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "ingestion_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"provider" "ingestion_provider" NOT NULL,
	"credentials" jsonb,
	"status" "ingestion_status" DEFAULT 'pending_auth' NOT NULL,
	"last_sync_started_at" timestamp with time zone,
	"last_sync_finished_at" timestamp with time zone,
	"last_sync_status_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "archived_emails" ADD CONSTRAINT "archived_emails_custodian_id_custodians_id_fk" FOREIGN KEY ("custodian_id") REFERENCES "public"."custodians"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_email_id_archived_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."archived_emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_attachment_id_attachments_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_case_id_ediscovery_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."ediscovery_cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_case_id_ediscovery_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."ediscovery_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_custodian_id_custodians_id_fk" FOREIGN KEY ("custodian_id") REFERENCES "public"."custodians"("id") ON DELETE cascade ON UPDATE no action;