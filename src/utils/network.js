const { s3 } = require("./helpers");

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
  const { method } = request;

  if (["POST", "PUT"].indexOf(method) === -1) return null;

  return await ((req) => {
    return new Promise((resolve) => {
      try {
        let body = "";
        req.on("data", (chunk) => (body += chunk.toString()));
        req.on("end", () => resolve(body));
      } catch (e) {
        resolve(null);
      }
    });
  })(request);
};

request.cached = async (base, type, pagination) => {
  try {
    const data = await s3
      .getObject({ Key: `cache/${base}/${type}/${pagination}.json` })
      .promise();
    return JSON.parse(data?.Body.toString("utf-8"));
  } catch (e) {
    return null;
  }
};

const response = {};

response.cache = (base, type, pagination, data) => {
  const params = {
    Key: `cache/${base}/${type}/${pagination}.json`,
    ACL: "private",
    Body: data,
    ContentType: "application/json",
    Expires: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
  };

  if (typeof params.Body === "object") {
    params.Body = JSON.stringify(data);
  }

  try {
    s3.putObject(params).promise();
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
      "access-control-allow-headers": "Authorization,CONTENT-TYPE",
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
