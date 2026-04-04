import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import settingsRouter from "./settings.js";
import foodEntriesRouter from "./food-entries.js";
import summaryRouter from "./summary.js";
import recipesRouter from "./recipes.js";
import storageRouter from "./storage.js";
import { requireAuth } from "../middlewares/require-auth.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(requireAuth, settingsRouter);
router.use(requireAuth, foodEntriesRouter);
router.use(requireAuth, summaryRouter);
router.use(requireAuth, recipesRouter);
router.use(storageRouter);

export default router;
