const express = require("express");
const DashboardController = require("../controllers/dashboardController");

const router = express.Router();

// GET /api/dashboard/stats
router.get("/stats", DashboardController.getStats);

module.exports = router;
