// index.js
const express = require("express");
const cors = require("cors"); // see CORS section below
const app = express();

app.use(cors()); // simple allow-all during dev; lock down for production
app.get("/data", (req, res) => {
    res.json({
        name: "John",
        age: 20,
        city: "Manila"
    });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
