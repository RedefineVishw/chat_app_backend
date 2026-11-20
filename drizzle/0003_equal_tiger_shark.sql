CREATE TABLE "connection_rejections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"addressee_id" uuid NOT NULL,
	"rejection_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "connection_rejections_no_self" CHECK ("connection_rejections"."requester_id" <> "connection_rejections"."addressee_id"),
	CONSTRAINT "connection_rejections_count_positive" CHECK ("connection_rejections"."rejection_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "connection_rejections" ADD CONSTRAINT "connection_rejections_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_rejections" ADD CONSTRAINT "connection_rejections_addressee_id_users_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "connection_rejections_unique_pair" ON "connection_rejections" USING btree ("requester_id","addressee_id");