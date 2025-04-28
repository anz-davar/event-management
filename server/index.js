require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3005;
const pool = require("./db/connection");

app.use(express.json());

app.get("/health", (req, res) => {
  res.send("OK");
});

app.use("/api/users", require("./api/users/routes"));
app.use("/api/halls", require("./api/halls/routes"));
app.use("/api/eventtables", require("./api/eventtables/routes"));
// USE TABLES API
app.use("/api/tables", require("./api/tables/routes"));
app.use("/api/seatingarrangement", require("./api/seatingarrangement/routes"));
app.use("/api/guests", require("./api/guests/routes"));
// events
app.use("/api/events", require("./api/events/routes"));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
