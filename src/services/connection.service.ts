import {
    createConnectionRequest,
    hasBlockBetweenUsers,
} from "../repositories/connection.repository.js";

import type { SendConnectionRequestParams } from "../types/connection.types.js";

export const sendConnectionRequestService = async ({ requesterId, addresseeId }: SendConnectionRequestParams) => {
    // Prevent sending a request to yourself
    if (requesterId === addresseeId) {
        throw new Error("You cannot send a connection request to yourself");
    }

    // Check whether either user has blocked the other
    const isBlocked = await hasBlockBetweenUsers({ requesterId, addresseeId });
    if (isBlocked) {
        throw new Error("Connection request cannot be sent");
    }

    const result = await createConnectionRequest({ requesterId, addresseeId });
    switch (result.status) {
        case "already_connected":
            throw new Error("You are already connected with this user");

        case "request_already_sent":
            throw new Error("Connection request has already been sent");

        case "incoming_request_exists":
            throw new Error(
                "This user has already sent you a connection request",
            );

        case "created":
            return result.connection;
    }
};