import multer from "multer";

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 2 * 1024 * 1024, // 2 MB
        files: 1,
    },

    fileFilter: (_req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.mimetype)) {
            cb(new Error("Only JPEG, PNG and WebP images are allowed"));
            return;
        }

        cb(null, true);
    },
});

export default upload;