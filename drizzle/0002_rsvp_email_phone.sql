ALTER TABLE "rsvps" ADD COLUMN "email" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "rsvps" ADD COLUMN "phone" text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE "rsvps" SET "email" = "contact" WHERE "contact" LIKE '%@%';--> statement-breakpoint
UPDATE "rsvps" SET "phone" = "contact" WHERE "contact" <> '' AND "contact" NOT LIKE '%@%';
