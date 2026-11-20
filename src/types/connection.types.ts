
import type { UserConnection, NewUserConnection, } from "../db/connection.schema.js";
import type { UserBlock, NewUserBlock } from "../db/block.schema.js";

// Connection status
export type ConnectionStatus = UserConnection["status"];

// Connection types
export type {
    UserConnection, NewUserConnection,
};

// Block types
export type {
    UserBlock, NewUserBlock,
};

// Send connection request
export interface SendConnectionRequestParams {
    requesterId: string;
    addresseeId: string;
}

export interface AcceptConnectionRequestParams {
    connectionId: string;
    userId: string;
}

// Connection action parameters
export interface ConnectionActionParams {
    userId: string;
    connectionId: string;
}

// Block user parameters
export interface BlockUserParams {
    blockerId: string;
    blockedUserId: string;
}

// Unblock user parameters
export interface UnblockUserParams {
    blockerId: string;
    blockedUserId: string;
}

// Connection list parameters
export interface GetConnectionsParams {
    userId: string;
    page: number;
    limit: number;
}

// Connection request list parameters
export interface GetConnectionRequestsParams {
    userId: string;
    page: number;
    limit: number;
}

// Rejection tracking parameters
export interface ConnectionRejectionParams {
    requesterId: string;
    addresseeId: string;
}
