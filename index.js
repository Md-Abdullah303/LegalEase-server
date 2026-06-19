const express = require("express");
require("dotenv").config();
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5555;

// meddleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

//
// app.get("/api/users/:id", async (req, res) => {
//   const { id } = req.params;
//   const result = await usersCollections.findOne(query)
// });
