require("dotenv").config();
const express = require("express");
const app = express();
const PORT = 3000;
const searchRoutes = require("./routes/searchRoutes");
const streamRoutes = require("./routes/streamRoutes");
const cors = require("cors");

app.use(cors());
app.use(express.json());

app.use("/api", streamRoutes);

app.use("/api", searchRoutes);

app.get("/", (req, res) => {
    res.send("Welcome to Anand Music API");
});

app.get("/about", (req, res) => {
    res.send("This backend is powerd by AVS Streaming Services.");
});



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});