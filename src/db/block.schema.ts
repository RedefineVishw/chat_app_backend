import { sql } from "drizzle-orm";
import {
    check,
    index,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema.js";

export const userBlocks = pgTable(
    "user_blocks",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        blockerId: uuid("blocker_id").notNull().references(() => users.id, { onDelete: "cascade" }),           // User who initiated the block
        blockedUserId: uuid("blocked_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),  // User who is being blocked
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        // Prevent users from blocking themselves.
        check("user_blocks_no_self_block", sql`${table.blockerId} <> ${table.blockedUserId}`),

        // Prevent duplicate blocks in the same direction.
        uniqueIndex("user_blocks_unique_pair").on(table.blockerId, table.blockedUserId),

        // Find users blocked by a particular user.
        index("user_blocks_blocker_idx").on(table.blockerId),

        // Check whether a particular user has blocked the requester.
        index("user_blocks_blocked_user_idx").on(table.blockedUserId),
    ],
);

export type UserBlock = typeof userBlocks.$inferSelect;
export type NewUserBlock = typeof userBlocks.$inferInsert;
