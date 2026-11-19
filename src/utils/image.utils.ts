import sharp from "sharp";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_FORMATS = ["jpeg", "png", "webp"];

export const processAvatarImage = async (buffer: Buffer,): Promise<Buffer> => {
    if (buffer.length === 0 || buffer.length > MAX_FILE_SIZE) {
        throw Object.assign(new Error("Image must be between 1 byte and 2 MB"), { statusCode: 400 });
    }

    const metadata = await sharp(buffer).metadata();

    if (!metadata.format || !ALLOWED_FORMATS.includes(metadata.format)) {
        throw Object.assign(new Error("Only JPEG, PNG and WebP images are allowed"), { statusCode: 400 });
    }

    if (!metadata.width || !metadata.height) {
        throw Object.assign(new Error("Invalid image dimensions"), { statusCode: 400 });
    }

    return sharp(buffer).rotate().resize(512, 512, { fit: "cover", position: "centre" }).webp({ quality: 80 }).toBuffer();
};