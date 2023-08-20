const http = require("http");
try {
  require("dotenv").config();
} catch (e) {}

const lambda = require("../index");

const ips = ["172.0.0.1"];
const port = 3001;

const server = http.createServer(async (req, res) => {
  try {
    req.httpMethod = req.method;
    req.path = req.url;

    const response = await lambda.handler(req).catch(console.warn) || {};

    res.statusCode = response.statusCode || 500;

    for (const [head, value] of Object.entries(response.headers || {})) {
      res.setHeader(head, value);
    }

    res.end(response.body || "");
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end("Internal Server Error");
    console.error(err.stack);
  }
});

process.on("uncaughtException", (err) => {
  console.log("uncaughtException");
  console.error(err.stack);
});

server.listen(port, ips, () => {
  console.log(`Server is listening on port ${port} via ${ips.join(", ")}`);
});