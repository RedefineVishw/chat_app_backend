import { and, count, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "../config/database.js";
import type { SendConnectionRequestParams, AcceptConnectionRequestParams } from "../types/connection.types.js";
import { userBlocks } from "../db/block.schema.js";
import { userConnections } from "../db/connection.schema.js";

// Check whether either user has blocked the other
export const hasBlockBetweenUsers = async ({ requesterId, addresseeId }: SendConnectionRequestParams): Promise<boolean> => {
    const [block] = await db.select({ id: userBlocks.id }).from(userBlocks)
        .where(or(and(
            eq(userBlocks.blockerId, requesterId),
            eq(userBlocks.blockedUserId, addresseeId),
        ), and(
            eq(userBlocks.blockerId, addresseeId),
            eq(userBlocks.blockedUserId, requesterId),
        ))).limit(1);
    return Boolean(block);
};

// Create a connection request
export const createConnectionRequest = async ({ requesterId, addresseeId }: SendConnectionRequestParams) => {
    return db.transaction(async (tx) => {
        const [existingConnection] = await tx.select().from(userConnections)
            .where(or(and(
                eq(userConnections.requesterId, requesterId),
                eq(userConnections.addresseeId, addresseeId),
            ), and(
                eq(userConnections.requesterId, addresseeId),
                eq(userConnections.addresseeId, requesterId),
            ))).limit(1);

        if (existingConnection) {
            if (existingConnection.status === "accepted") {
                return { status: "already_connected" as const };
            }

            if (existingConnection.status === "pending") {
                return {
                    status: existingConnection.requesterId === requesterId ? "request_already_sent" as const : "incoming_request_exists" as const,
                };
            }

            // Reuse a previously rejected connection row
            const [updatedConnection] = await tx.update(userConnections).set({
                requesterId,
                addresseeId,
                status: "pending",
                acceptedAt: null,
                updatedAt: new Date(),
            }).where(eq(userConnections.id, existingConnection.id)).returning();

            return {
                status: "created" as const,
                connection: updatedConnection,
            };
        }

        const [connection] = await tx.insert(userConnections).values({
            requesterId,
            addresseeId,
            status: "pending",
        }).returning();

        return {
            status: "created" as const,
            connection,
        };
    });
};

export const acceptConnectionRequest = async ({ connectionId, userId }: AcceptConnectionRequestParams) => {
    const [connection] = await db.update(userConnections).set({
        status: "accepted",
        acceptedAt: new Date(),
        updatedAt: new Date(),
    }).where(and(
        eq(userConnections.id, connectionId),
        eq(userConnections.addresseeId, userId),
        eq(userConnections.status, "pending"),
    )).returning();

    return connection ?? null;
};