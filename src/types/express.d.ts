declare global {
    namespace Express {
        interface User {
            userId: string;
        }

        interface Request {
            user?: User;
        }

        interface Response {
            success<T>(data: T, message?: string): this;
            created<T>(data: T, message?: string): this;
            error(message: string, statusCode?: number): this;
            badRequest(message: string): this;
            unauthorized(message?: string): this;
            forbidden(message?: string): this;
            notFound(message?: string): this;
        }
    }
}

export { };