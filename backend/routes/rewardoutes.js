const express = require("express");
const router = express.Router();
const {reward , todaystocks , historicalinr , stats , portfolio} = require("../controllers/rewardContoller");

router.post("/reward" , reward);
router.get("/today-stocks/:userId" , todaystocks);
router.get("/historical-inr/:userId" , historicalinr);
router.get("/stats/:userId" , stats);
router.get("/portfolio/:userId",portfolio)


module.exports = router

