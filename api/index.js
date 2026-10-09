/**
 * Vercel Serverless Function entry point
 * Re-exports the unified Express app configured in server.js
 */
const app = require("../server");

module.exports = app;