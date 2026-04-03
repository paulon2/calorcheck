import { Router, type IRouter } from "express";
import healthRouter from "./health";
import settingsRouter from "./settings";
import foodEntriesRouter from "./food-entries";
import summaryRouter from "./summary";

const router: IRouter = Router();

router.use(healthRouter);
router.use(settingsRouter);
router.use(foodEntriesRouter);
router.use(summaryRouter);

export default router;
