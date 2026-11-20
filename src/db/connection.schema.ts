import { sql } from "drizzle-orm";
import {
    check,
    index,
    pgEnum,
    pgTable,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema.js";

export const connectionStatusEnum = pgEnum("connection_status", [
    "pending",
    "accepted",
    "rejected",
]);

export const userConnections = pgTable(
    "user_connections",
    {
        id: uuid("id").defaultRandom().primaryKey(),

        requesterId: uuid("requester_id").notNull().references(() => users.id, { onDelete: "cascade" }), // User who initiated the connection request
        addresseeId: uuid("addressee_id").notNull().references(() => users.id, { onDelete: "cascade" }), // User who received the connection request
        status: connectionStatusEnum("status").default("pending").notNull(),

        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull(),
        acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    },
    (table) => [
        // Prevent users from sending requests to themselves.
        check("user_connections_no_self_connection", sql`${table.requesterId} <> ${table.addresseeId}`),

        // Prevent duplicate relationships in either direction.
        uniqueIndex("user_connections_unique_pair").on(sql`LEAST(${table.requesterId}, ${table.addresseeId})`,
            sql`GREATEST(${table.requesterId}, ${table.addresseeId})`),

        // Find incoming requests and accepted connections.
        index("user_connections_addressee_status_idx").on(table.addresseeId, table.status, table.createdAt,),

        // Find outgoing requests and accepted connections.
        index("user_connections_requester_status_idx").on(table.requesterId, table.status, table.createdAt),
    ],
);

export type UserConnection = typeof userConnections.$inferSelect;
export type NewUserConnection = typeof userConnections.$inferInsert;