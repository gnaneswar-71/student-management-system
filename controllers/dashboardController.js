const StudentModel = require("../models/studentModel");

/**
 * Controller for dashboard analytics & statistics
 */
const DashboardController = {
    /**
     * GET /api/dashboard/stats
     * Return calculated database metrics
     */
    async getStats(req, res, next) {
        try {
            const stats = await StudentModel.getStats();

            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = DashboardController;
