
import { sql } from "drizzle-orm";
import {
    check,
    integer,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema.js";

export const connectionRejections = pgTable(
    "connection_rejections",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        requesterId: uuid("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }),  // User whose requests have been rejected
        addresseeId: uuid("addressee_id").notNull().references(() => users.id, { onDelete: "cascade" }),  // User who rejected those requests
        rejectionCount: integer("rejection_count").default(0).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
    },
    (table) => [
        check("connection_rejections_no_self", sql`${table.requesterId} <> ${table.addresseeId}`),
        check("connection_rejections_count_positive", sql`${table.rejectionCount} >= 0`),
        uniqueIndex("connection_rejections_unique_pair").on(table.requesterId, table.addresseeId,),
    ],
);

export type ConnectionRejection = typeof connectionRejections.$inferSelect;
export type NewConnectionRejection = typeof connectionRejections.$inferInsert;