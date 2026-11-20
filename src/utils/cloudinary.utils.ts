import cloudinary from "../config/cloudinary.js";

export const uploadAvatarToCloudinary = (buffer: Buffer): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
            folder: "zeno/avatars",
            resource_type: "image",
            overwrite: false,
        }, (error, result) => {
            if (error) {
                reject(error);
                return;
            }

            if (!result) {
                reject(new Error("Cloudinary upload failed"));
                return;
            }
            resolve(result.public_id);
        }
        );

        uploadStream.end(buffer);
    });
};

export const deleteAvatarFromCloudinary = async (publicId: string): Promise<void> => {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });

    if (result.result !== "ok" && result.result !== "not found") {
        throw new Error("Failed to delete avatar from Cloudinary");
    }
};

export const getAvatarUrl = (publicId: string | null) => {
    if (!publicId) { return null; }

    return cloudinary.url(publicId, {
        secure: true,
        transformation: [
            {
                width: 512,
                height: 512,
                crop: "fill",
                gravity: "face",
                quality: "auto",
                fetch_format: "auto",
            },
        ],
    });
};