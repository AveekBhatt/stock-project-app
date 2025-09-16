require("dotenv").config();
const express = require("express")
const cors = require("cors");
const reward =  require("./routes/rewardoutes")
const user = require("./routes/useroutes")

const app = express();

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use("/users", user);
app.use("/reward", reward);

app.listen(7000, () => console.log("Server running on port 7000"));

module.exports = app;



