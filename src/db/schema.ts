import { pgTable, uuid, varchar, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),

    email: varchar("email", { length: 254 }).unique().notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),

    // User Information
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    about: varchar("about", { length: 139 }),
    avatarKey: varchar("avatar_key", { length: 512 }),

    // Email Status
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),

    // Soft-delete marker. Clear/anonymize personal data in your deletion flow.
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
},
    (table) => [
        uniqueIndex("users_email_lower_unique").on(sql`lower(${table.email})`),
    ],
);