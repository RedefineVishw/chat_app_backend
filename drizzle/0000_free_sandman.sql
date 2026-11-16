CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(254) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"user_name" varchar(30) NOT NULL,
	"display_name" varchar(50) NOT NULL,
	"about" varchar(180),
	"avatar_key" varchar(512),
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp with time zone,
	"email_verification_token_hash" varchar(100),
	"email_verification_expires" timestamp with time zone,
	"password_reset_token_hash" varchar(100),
	"password_reset_expires" timestamp with time zone,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"two_factor_code_hash" varchar(100),
	"two_factor_code_expires" timestamp with time zone,
	"two_factor_attempts" integer DEFAULT 0 NOT NULL,
	"refresh_token_hash" varchar(512),
	"login_attempts" integer DEFAULT 0 NOT NULL,
	"lock_until" timestamp with time zone,
	"last_login" timestamp with time zone,
	"last_password_changed_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_unique" ON "users" USING btree (lower("email")) WHERE "users"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_lower_unique" ON "users" USING btree (lower("user_name")) WHERE "users"."deleted_at" IS NULL;