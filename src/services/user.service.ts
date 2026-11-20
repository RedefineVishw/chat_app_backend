import { findPublicUserProfileByUsername, findUserAvatarKeyById, searchUsers, updateUserAvatar, updateUserProfile } from "../repositories/user.repository.js";
import type { SearchUsersParams, UpdateUserProfile } from "../types/user.types.js";
import { deleteAvatarFromCloudinary, getAvatarUrl, uploadAvatarToCloudinary } from "../utils/cloudinary.utils.js";
import { processAvatarImage } from "../utils/image.utils.js";

export const updateUserProfileService = async (userId: string, data: UpdateUserProfile) => {
    try {
        const user = await updateUserProfile(userId, data);
        if (!user) {
            throw Object.assign(new Error("User not found or account unavailable"), { statusCode: 404, });
        }
        return user;
    } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
            throw Object.assign(new Error("Username already taken"), { statusCode: 409 });
        }
        throw error;
    }
};



export const getPublicUserProfileService = async (userName: string) => {
    const user = await findPublicUserProfileByUsername(userName);
    if (!user) {
        throw Object.assign(new Error("User not found"), { statusCode: 404 });
    }
    return {
        ...user,
        avatarUrl: getAvatarUrl(user.avatarKey),
    };
};

export const uploadAvatarService = async (userId: string, buffer: Buffer) => {
    const existingUser = await findUserAvatarKeyById(userId);
    if (!existingUser) {
        throw Object.assign(new Error("User not found or account unavailable"), { statusCode: 404 });
    }

    // Process the uploaded image.
    const processedImage = await processAvatarImage(buffer);

    // Upload the new image to Cloudinary.
    const newAvatarKey = await uploadAvatarToCloudinary(processedImage);

    let updatedUser;

    try {
        updatedUser = await updateUserAvatar(userId, newAvatarKey);
        if (!updatedUser) {
            throw Object.assign(new Error("User not found or account unavailable"), { statusCode: 404 });
        }
    } catch (error) {
        try {
            await deleteAvatarFromCloudinary(newAvatarKey); // Database update failed. Remove the newly uploaded image.
        } catch (cleanupError) {
            console.error("Failed to clean up new avatar:", cleanupError);
        }

        throw error;
    }

    // Database now references the new image.
    // Delete the previous image if one existed.
    if (existingUser.avatarKey) {
        try {
            await deleteAvatarFromCloudinary(existingUser.avatarKey);
        } catch (error) {
            console.error("Failed to delete previous avatar:", error);
        }
    }

    return updatedUser;
};


export const deleteAvatarService = async (userId: string) => {
    const existingUser = await findUserAvatarKeyById(userId);
    if (!existingUser) {
        throw Object.assign(new Error("User not found or account unavailable"), { statusCode: 404 });
    }

    if (!existingUser.avatarKey) {
        return { avatarKey: null };
    }

    const updatedUser = await updateUserAvatar(userId, null);
    if (!updatedUser) {
        throw Object.assign(new Error("User not found or account unavailable"), { statusCode: 404 });
    }

    try {
        await deleteAvatarFromCloudinary(existingUser.avatarKey);
    } catch (error) {
        console.error("Failed to delete avatar from Cloudinary:", error);
    }

    return updatedUser;
};

export const searchUsersService = async (data: SearchUsersParams) => {
    const { users, total } = await searchUsers(data);

    return {
        users: users.map((user) => ({
            userName: user.userName,
            displayName: user.displayName,
            about: user.about,
            avatarUrl: getAvatarUrl(user.avatarKey),
        })),

        pagination: {
            page: data.page,
            limit: data.limit,
            total,
            totalPages: Math.ceil(total / data.limit),
        },
    };
};