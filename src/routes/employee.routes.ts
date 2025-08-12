import { createEmployee } from "@/controllers/employee.controller";
import { Router } from "express";

const router = Router();

router.post('/create',createEmployee);

export default router;