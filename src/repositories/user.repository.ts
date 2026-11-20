import { and, count, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "../config/database.js";
import { users } from "../db/user.schema.js";
import type { SearchUsersParams, UpdateUserProfile } from "../types/user.types.js";

// Check if the error is a unique constraint violation (PostgreSQL error code 23505)
export const findRegistrationConflicts = async (email: string, userName: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = userName.trim().toLowerCase();

    return db.select({ id: users.id, email: users.email, userName: users.userName, })
        .from(users).where(and(isNull(users.deletedAt), or(
            sql`lower(${users.email}) = ${normalizedEmail}`,
            sql`lower(${users.userName}) = ${normalizedUsername}`,
        ),),).limit(2);
};

// Create a new user in the database
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

// Find a user by their email verification token hash
export const verifyUserEmailByTokenHash = async (tokenHash: string) => {
    const now = new Date();

    const [user] = await db.update(users).set({
        isEmailVerified: true,
        emailVerifiedAt: now,
        emailVerificationTokenHash: null,
        emailVerificationExpires: null,
    }).where(and(
        eq(users.emailVerificationTokenHash, tokenHash),
        gt(users.emailVerificationExpires, now),
        eq(users.isEmailVerified, false),
        isNull(users.deletedAt),
    ),).returning({ id: users.id, email: users.email, });
    return user;
};

// Find a user by their email address
export const findUserByEmail = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    const [user] = await db.select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        userName: users.userName,
        displayName: users.displayName,
        isEmailVerified: users.isEmailVerified,
        isActive: users.isActive,
        loginAttempts: users.loginAttempts,
        lockUntil: users.lockUntil,
    }).
        from(users).where(
            and(sql`lower(${users.email}) = ${normalizedEmail}`, isNull(users.deletedAt),),
        ).limit(1);
    return user;
};

// Update the email verification token and its expiration for a user
export const updateVerificationToken = async (userId: string, tokenHash: string, expiresAt: Date) => {
    const [user] = await db.update(users).set({
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpires: expiresAt,
        updatedAt: new Date(),
    }).where(and(
        eq(users.id, userId),
        eq(users.isEmailVerified, false),
        isNull(users.deletedAt),
    ),).returning({ id: users.id, email: users.email, });
    return user;
};

// Failed login attempt handling: Increment login attempts and lock account if necessary
export const handleFailedLogin = async (userId: string) => {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() + 15 * 60 * 1000);

    const [user] = await db.update(users)
        .set({
            loginAttempts: sql`CASE WHEN ${users.lockUntil} IS NOT NULL
                         AND ${users.lockUntil} <= ${now}
                    THEN 1
                    ELSE ${users.loginAttempts} + 1
                END
            `,
            lockUntil: sql`
                CASE WHEN ( CASE WHEN ${users.lockUntil} IS NOT NULL
                                 AND ${users.lockUntil} <= ${now}
                            THEN 1
                            ELSE ${users.loginAttempts} + 1
                        END
                    ) >= 5
                    THEN ${lockExpiry}
                    ELSE NULL
                END
            `,
            updatedAt: now,
        })
        .where(and(eq(users.id, userId), isNull(users.deletedAt),
            or(isNull(users.lockUntil), sql`${users.lockUntil} <= ${now}`,),
        ))
        .returning({ loginAttempts: users.loginAttempts, lockUntil: users.lockUntil });

    return user;
};

export const completeLogin = async (userId: string) => {
    const now = new Date();

    const [user] = await db.update(users).set({
        loginAttempts: 0,
        lockUntil: null,
        lastLogin: now,
        updatedAt: now,
    })
        .where(and(eq(users.id, userId), isNull(users.deletedAt)))
        .returning({ id: users.id, lastLogin: users.lastLogin });

    return user;
};

export const saveRefreshTokenHash = async (userId: string, tokenHash: string) => {
    const [user] = await db.update(users)
        .set({ refreshTokenHash: tokenHash, updatedAt: new Date() })
        .where(and(
            eq(users.id, userId),
            eq(users.isActive, true),
            eq(users.isEmailVerified, true),
            isNull(users.deletedAt),
        ))
        .returning({ id: users.id });

    return user;
};

export const rotateRefreshTokenHash = async (
    userId: string,
    currentTokenHash: string,
    newTokenHash: string,
) => {
    const [user] = await db.update(users)
        .set({ refreshTokenHash: newTokenHash, updatedAt: new Date() })
        .where(and(
            eq(users.id, userId),
            eq(users.refreshTokenHash, currentTokenHash),
            eq(users.isActive, true),
            eq(users.isEmailVerified, true),
            isNull(users.deletedAt),
        ))
        .returning({
            id: users.id,
            email: users.email,
            userName: users.userName,
            displayName: users.displayName,
        });

    return user;
};

export const revokeRefreshToken = async (tokenHash: string) => {
    const [user] = await db.update(users)
        .set({ refreshTokenHash: null, updatedAt: new Date(), })
        .where(eq(users.refreshTokenHash, tokenHash))
        .returning({ id: users.id });
    return user;
};

export const findActiveUserById = async (userId: string) => {
    const [user] = await db.select({
        id: users.id,
        email: users.email,
        userName: users.userName,
        displayName: users.displayName,
        isActive: users.isActive,
        isEmailVerified: users.isEmailVerified,
    }).from(users).where(and(
        eq(users.id, userId),
        eq(users.isActive, true),
        eq(users.isEmailVerified, true),
        isNull(users.deletedAt),
    )).limit(1);

    return user;
};

export const findUserProfileById = async (userId: string) => {
    const [user] = await db.select({
        id: users.id,
        email: users.email,
        userName: users.userName,
        displayName: users.displayName,
        about: users.about,
        avatarKey: users.avatarKey,
        isEmailVerified: users.isEmailVerified,
        createdAt: users.createdAt,
    }).from(users).where(and(
        eq(users.id, userId),
        eq(users.isActive, true),
        eq(users.isEmailVerified, true),
        isNull(users.deletedAt)
    )).limit(1);

    return user;
};

export const savePasswordResetToken = async (email: string, tokenHash: string, expiresAt: Date) => {
    const normalizedEmail = email.trim().toLowerCase();

    const [user] = await db.update(users).set({
        passwordResetTokenHash: tokenHash,
        passwordResetExpires: expiresAt,
        updatedAt: new Date(),
    }).where(and(
        sql`lower(${users.email}) = ${normalizedEmail}`,
        eq(users.isActive, true),
        eq(users.isEmailVerified, true),
        isNull(users.deletedAt),
    )).returning({ id: users.id, email: users.email });

    return user;
};

export const clearPasswordResetToken = async (userId: string, tokenHash: string): Promise<void> => {
    await db.update(users).set({
        passwordResetTokenHash: null,
        passwordResetExpires: null,
        updatedAt: new Date(),
    }).where(and(
        eq(users.id, userId),
        eq(users.passwordResetTokenHash, tokenHash),
    ));
};

export const resetPasswordByTokenHash = async (tokenHash: string, newPasswordHash: string) => {
    const now = new Date();

    const [user] = await db.update(users).set({
        passwordHash: newPasswordHash,    // Consume the reset token
        passwordResetTokenHash: null,
        passwordResetExpires: null,
        refreshTokenHash: null,          // Invalidate the stored refresh-token session
        loginAttempts: 0,                // Reset failed-login state
        lockUntil: null,
        lastPasswordChangedAt: now,
        updatedAt: now,
    }).where(and(
        eq(users.passwordResetTokenHash, tokenHash),
        gt(users.passwordResetExpires, now),
        eq(users.isActive, true),
        isNull(users.deletedAt),
    )).returning({ id: users.id, });

    return user ?? null;
};

export const changePasswordByUserId = async (userId: string, currentPasswordHash: string, newPasswordHash: string) => {
    const now = new Date();

    const [user] = await db.update(users).set({
        passwordHash: newPasswordHash,
        refreshTokenHash: null,
        loginAttempts: 0,
        lockUntil: null,
        lastPasswordChangedAt: now,
        updatedAt: now,
    }).where(and(
        eq(users.id, userId),
        eq(users.passwordHash, currentPasswordHash),
        eq(users.isActive, true),
        isNull(users.deletedAt),
    )).returning({ id: users.id, });

    return user ?? null;
};

export const findUserForPasswordChange = async (userId: string) => {
    const [user] = await db.select({
        id: users.id,
        passwordHash: users.passwordHash,
    }).from(users).where(and(
        eq(users.id, userId),
        eq(users.isActive, true),
        isNull(users.deletedAt),
    )).limit(1);

    return user ?? null;
};


// Update user profile
export const updateUserProfile = async (userId: string, data: UpdateUserProfile) => {
    const [user] = await db.update(users).set({ ...data, updatedAt: new Date() })
        .where(and(
            eq(users.id, userId),
            eq(users.isActive, true),
            eq(users.isEmailVerified, true),
            isNull(users.deletedAt),
        ))
        .returning({
            id: users.id,
            email: users.email,
            userName: users.userName,
            displayName: users.displayName,
            about: users.about,
            avatarKey: users.avatarKey,
            updatedAt: users.updatedAt,
        });

    return user ?? null;
};

// Find a public user profile by username
export const findPublicUserProfileByUsername = async (userName: string) => {
    const normalizedUsername = userName.trim().toLowerCase();

    const [user] = await db.select({
        userName: users.userName,
        displayName: users.displayName,
        about: users.about,
        avatarKey: users.avatarKey,
        createdAt: users.createdAt,
    }).from(users).where(and(
        sql`lower(${users.userName}) = ${normalizedUsername}`,
        eq(users.isActive, true),
        eq(users.isEmailVerified, true),
        isNull(users.deletedAt),
    )).limit(1);

    return user ?? null;
};

export const updateUserAvatar = async (userId: string, avatarKey: string | null) => {
    const [user] = await db.update(users).set({ avatarKey, updatedAt: new Date() })
        .where(and(
            eq(users.id, userId),
            eq(users.isActive, true),
            eq(users.isEmailVerified, true),
            isNull(users.deletedAt),
        ))
        .returning({ avatarKey: users.avatarKey });
    return user ?? null;
};

export const findUserAvatarKeyById = async (userId: string) => {
    const [user] = await db.select({ avatarKey: users.avatarKey })
        .from(users).where(and(
            eq(users.id, userId),
            eq(users.isActive, true),
            eq(users.isEmailVerified, true),
            isNull(users.deletedAt),
        )).limit(1);

    return user ?? null;
};


export const searchUsers = async (data: SearchUsersParams) => {
    const normalizedQuery = data.query.trim().toLowerCase();

    // Escape SQL LIKE wildcard characters so they are treated literally.
    const escapedQuery = normalizedQuery.replace(/[\\%_]/g, "\\$&");
    const searchPattern = `%${escapedQuery}%`;

    const conditions = and(or(
        sql`${users.userName} ILIKE ${searchPattern}`,
        sql`${users.displayName} ILIKE ${searchPattern}`,
        sql`${users.email} ILIKE ${searchPattern}`,
    ), eq(users.isActive, true),
        eq(users.isEmailVerified, true),
        isNull(users.deletedAt),
        sql`${users.id} <> ${data.excludeUserId}`,
    );

    const offset = (data.page - 1) * data.limit;
    const [results, totalResult] = await Promise.all([
        db.select({
            userName: users.userName,
            displayName: users.displayName,
            about: users.about,
            avatarKey: users.avatarKey,
        }).from(users).where(conditions)
            .orderBy(users.userName)
            .limit(data.limit)
            .offset(offset),
        db.select({ total: count() }).from(users).where(conditions),
    ]);

    return {
        users: results,
        total: totalResult[0]?.total ?? 0,
    };
};