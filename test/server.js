try {
  require("dotenv").config();
} catch (e) {}

const http = require("http");
const lambda = require("../index");

process.on("uncaughtException", (err) => {
  console.log("uncaughtException");
  console.error(err.stack);
  console.log(err);
});

const ips = ["172.0.0.1"];

const server = http.createServer(
  async (req, res) => {
    try {
      req.httpMethod = req.method;

      req.path = req.url;

      let response = await lambda.handler(req);

      if (response.hasOwnProperty("statusCode")) {
        res.statusCode = response.statusCode;
      }
      
      if (response.hasOwnProperty("headers")) {
        for (let head in response.headers) {
          res.setHeader(head, response.headers[head]);
        }
      }

      res.end(response.body);
    } catch (e) {
      console.log(e);
    }

  }
);

server.listen(3001, ips, () => {
  console.log(
    "Server is listening on port 3001 via " +
      ips.join(", ")
  );
});