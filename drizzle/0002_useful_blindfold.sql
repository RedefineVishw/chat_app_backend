CREATE TYPE "public"."connection_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TABLE "user_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blocker_id" uuid NOT NULL,
	"blocked_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_blocks_no_self_block" CHECK ("user_blocks"."blocker_id" <> "user_blocks"."blocked_user_id")
);
--> statement-breakpoint
CREATE TABLE "user_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"addressee_id" uuid NOT NULL,
	"status" "connection_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	CONSTRAINT "user_connections_no_self_connection" CHECK ("user_connections"."requester_id" <> "user_connections"."addressee_id")
);
--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_user_id_users_id_fk" FOREIGN KEY ("blocked_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_connections" ADD CONSTRAINT "user_connections_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_connections" ADD CONSTRAINT "user_connections_addressee_id_users_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_blocks_unique_pair" ON "user_blocks" USING btree ("blocker_id","blocked_user_id");--> statement-breakpoint
CREATE INDEX "user_blocks_blocker_idx" ON "user_blocks" USING btree ("blocker_id");--> statement-breakpoint
CREATE INDEX "user_blocks_blocked_user_idx" ON "user_blocks" USING btree ("blocked_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_connections_unique_pair" ON "user_connections" USING btree (LEAST("requester_id", "addressee_id"),GREATEST("requester_id", "addressee_id"));--> statement-breakpoint
CREATE INDEX "user_connections_addressee_status_idx" ON "user_connections" USING btree ("addressee_id","status","created_at");--> statement-breakpoint
CREATE INDEX "user_connections_requester_status_idx" ON "user_connections" USING btree ("requester_id","status","created_at");