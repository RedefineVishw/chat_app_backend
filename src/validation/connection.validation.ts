import { z } from "zod";

// Send connection request
export const sendConnectionRequestSchema = z.object({ addresseeId: z.uuid() }).strict();

// Connection actions: accept, reject, cancel
export const connectionActionSchema = z.object({ connectionId: z.uuid(), }).strict();

// Block / unblock user
export const blockUserSchema = z.object({ userId: z.uuid() }).strict();

// Pagination
export const connectionPaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(20).default(20),
}).strict();