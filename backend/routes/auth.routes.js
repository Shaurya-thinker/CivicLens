const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");

// Endpoints ko controller functions se connect karna
router.post("/register", register);
router.post("/login", login);

module.exports = router;