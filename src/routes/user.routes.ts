import { Router } from "express";
import validate from "../middlewares/validate.middleware.js";
import { authenticateUser } from "../middlewares/auth.middleware.js"

import { searchUsersSchema, updateUserProfileSchema } from "../validation/user.validation.js";
import { deleteAvatarController, getPublicUserProfileController, searchUsersController, updateUserProfileController, uploadAvatarController } from "../controllers/user.controller.js";
import upload from "../middlewares/upload.middleware.js";

const router = Router();

router.patch("/me", authenticateUser, validate(updateUserProfileSchema), updateUserProfileController);


router.put("/me/avatar", authenticateUser, upload.single("avatar"), uploadAvatarController);
router.delete("/me/avatar", authenticateUser, deleteAvatarController);

// Search users — MUST come before /:username
router.get("/search", authenticateUser, validate(searchUsersSchema, "query"), searchUsersController);

// Dynamic username route — keep this last
router.get("/:username", authenticateUser, getPublicUserProfileController);
export default router;

// CLOUDINARY_CLOUD_NAME=
// CLOUDINARY_API_KEY=
// CLOUDINARY_API_SECRET=

// Account deletion
// DELETE /users/me
// Implement soft deletion using your existing deletedAt column.]
// lkcuqpes382288784438122XjUVhmQ1CKtBiYUSO04T44mPVio/yqjl1sczg3/Proton#Admin@183