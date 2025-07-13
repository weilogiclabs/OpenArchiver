ALTER TABLE "archived_emails" DROP CONSTRAINT "archived_emails_custodian_id_custodians_id_fk";
--> statement-breakpoint
ALTER TABLE "archived_emails" ADD COLUMN "ingestion_source_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "archived_emails" ADD CONSTRAINT "archived_emails_ingestion_source_id_ingestion_sources_id_fk" FOREIGN KEY ("ingestion_source_id") REFERENCES "public"."ingestion_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archived_emails" DROP COLUMN "custodian_id";