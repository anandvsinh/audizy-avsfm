const express = require("express");
const router = express.Router();
const { stream } = require("../controllers/streamController");

router.get("/stream", stream);

module.exports = router;