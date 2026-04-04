import { Router, type IRouter } from "express";
import healthRouter from "./health";
import settingsRouter from "./settings";
import foodEntriesRouter from "./food-entries";
import summaryRouter from "./summary";
import recipesRouter from "./recipes";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(settingsRouter);
router.use(foodEntriesRouter);
router.use(summaryRouter);
router.use(recipesRouter);
router.use(storageRouter);

export default router;
