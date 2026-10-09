const express = require("express");
const HealthController = require("../controllers/healthController");

const router = express.Router();

// GET /api/health
router.get("/", HealthController.checkHealth);

module.exports = router;
