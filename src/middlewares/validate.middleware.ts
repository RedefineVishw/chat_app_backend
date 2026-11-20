import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

type RequestSource = "body" | "query" | "params";

const validate = (schema: z.ZodType, source: RequestSource = "body") =>
    (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req[source]);

        if (!result.success) {
            res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                    code: issue.code,
                })),
            });

            return;
        }

        if (source === "body") {
            req.body = result.data;
        } else {
            res.locals.validatedData = result.data;
        }
        next();
    };

export default validate;