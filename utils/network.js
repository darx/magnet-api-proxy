const https = require("https");
const { SocksProxyAgent } = require("socks-proxy-agent");
const { GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

const { s3, streamToBuffer } = require("./helpers");

const statusCodes = {
  100: "Continue",
  101: "Switching Protocols",
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  301: "Moved Permanently",
  302: 'Found (Previously "Moved temporarily")',
  307: "Temporary Redirect (since HTTP/1.1)",
  308: "Permanent Redirect (RFC 7538)",
  400: "Bad Request",
  401: "Unauthorized (RFC 7235)",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  408: "Request Timeout",
  413: "Payload Too Large (RFC 7231)",
  414: "URI Too Long (RFC 7231)",
  429: "Too Many Requests (RFC 6585)",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

const request = {};

request.payload = async (request) => {
  const { method, headers } = request;

  if (["POST", "PUT", "PATCH", "DELETE"].indexOf(method) === -1) return null;

  const contentType = headers["content-type"];

  if (!contentType) return null;

  if (contentType.startsWith("application/json")) {
    return await ((req) => {
      return new Promise((resolve) => {
        try {
          let body = "";
          req.on("data", (chunk) => (body += chunk.toString()));
          req.on("end", () => {
            try {
              const data = JSON.parse(body);
              resolve(data);
            } catch (_) {
              resolve(null);
            }
          });
        } catch (_) {
          resolve(null);
        }
      });
    })(request);
  } else if (contentType.startsWith("application/x-www-form-urlencoded")) {
    return await ((req) => {
      return new Promise((resolve) => {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });

        req.on("end", () => {
          try {
            const data = new URLSearchParams(body);
            resolve(Object.fromEntries(data.entries()));
          } catch (_) {
            resolve(null);
          }
        });
      });
    })(request);
  }

  return null;
};

request.cached = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_CACHE_BUCKET,
      Key: `cache/${key}.json`,
    });

    const data = await s3.send(command);

    if (data.Expires && new Date() > new Date(data.Expires)) {
      return null;
    }

    return JSON.parse(await streamToBuffer(data.Body));
  } catch (e) {
    return null;
  }
};

request.fetch = (url, agent) => {
  const info = {
    hostname: process.env.PROXY_HOSTNAME,
    username: process.env.PROXY_USER_ID,
    password: process.env.PROXY_PASSWORD,
    port: 1080,
    protocol: "socks5"
  };

  if (info.hostname) agent = new SocksProxyAgent(info);

  return new Promise((resolve, reject) => {

    let { hostname, pathname: path, search } = new URL(url);

    if (search) path = path + search;

    const options = {
      agent,
      method: "GET",
      hostname,
      path,
      headers: {
        accept: "application/json;"
      },
    };

    https
      .get(options, (res) => {

        if ([301, 302].includes(res.statusCode)) {
          return resolve(request.fetch(res.headers.location, agent));
        }
        
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
};

const response = {};

response.cache = (key, data) => {
  const params = {
    Bucket: process.env.AWS_S3_CACHE_BUCKET,
    Key: `cache/${key}.json`,
    ACL: "private",
    Body: JSON.stringify(data),
    ContentType: "application/json",
    Expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };

  try {
    const command = new PutObjectCommand(params);
    s3.send(command);
  } catch (e) {
    console.warn("Failed to cache", base, type, pagination, e);
  }
};

response.cors = () => {
  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: {
      accept: "application/json",
      "access-control-allow-headers": "Authorization,APPLICATIONKEY,CONSUMERKEY,CONTENT-TYPE",
      "access-control-allow-methods": "GET,POST,PUT,OPTIONS",
      "access-control-allow-origin": "*",
    },
  };
};

response.success = (data, code = 200, headers) => {
  const res = {
    isBase64Encoded: false,
    statusCode: code,
    statusDescription: `${code} ${statusCodes[code]}`,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  };

  if (typeof data === "object") {
    res.body = JSON.stringify(data);
  }

  if ("object" === typeof headers) {
    Object.assign(res.headers, headers);
  }

  if ("string" == typeof res.headers.Location) {
    res.statusCode = 301;
    res.statusDescription = `301 ${statusCodes[301]}`;
  }

  return res;
};

response.error = (code = 500, data, error) => {
  const res = {
    isBase64Encoded: false,
    statusCode: code,
    statusDescription: `${code} ${statusCodes[code]}`,
    headers: {
      "Content-Type": "application/json",
    },
  };

  res.body = JSON.stringify(data || error ? { error } : null);

  return res;
};

module.exports = { request, response };