CREATE TABLE "site_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"landing_line1" text DEFAULT 'Little' NOT NULL,
	"landing_line2" text DEFAULT 'RSVP' NOT NULL,
	"landing_description" text DEFAULT '' NOT NULL,
	"landing_footer" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_single_row" CHECK ("site_settings"."id" = 1)
);
