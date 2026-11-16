import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "../config/database.js";
import { users } from "../db/user.schema.js";

export const findUserByEmail = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const [user] = await db.select().from(users).where(
        and(sql`lower(${users.email}) = ${normalizedEmail}`, isNull(users.deletedAt),),
    ).limit(1);
    return user;
};

export const findUserByUsername = async (userName: string) => {
    const normalizedUsername = userName.trim().toLowerCase();
    const [user] = await db.select().from(users).where(
        and(sql`lower(${users.userName}) = ${normalizedUsername}`, isNull(users.deletedAt),
        )).limit(1);
    return user;
};

export const findRegistrationConflicts = async (
    email: string,
    userName: string,
) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = userName.trim().toLowerCase();

    return db
        .select({
            id: users.id,
            email: users.email,
            userName: users.userName,
        })
        .from(users)
        .where(
            and(
                isNull(users.deletedAt),
                or(
                    sql`lower(${users.email}) = ${normalizedEmail}`,
                    sql`lower(${users.userName}) = ${normalizedUsername}`,
                ),
            ),
        )
        .limit(2);
};


export const findUserById = async (id: string) => {
    const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

    return user;
};

export const createUser = async (data: typeof users.$inferInsert) => {
    const [user] = await db.insert(users).values(data)
        .returning({
            id: users.id,
            email: users.email,
            userName: users.userName,
            displayName: users.displayName,
            createdAt: users.createdAt,
        });

    if (!user) {
        throw new Error("User creation failed");
    }

    return user;
};
