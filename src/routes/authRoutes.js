import express from "express";

import authLimiter from "../middleware/rateLimiter.js";

import {
    signup,
    login
} from "../controllers/authController.js";

const router = express.Router();

router.post(
    "/signup",
    authLimiter,
    signup
);

router.post(
    "/login",
    authLimiter,
    login
);

export default router;