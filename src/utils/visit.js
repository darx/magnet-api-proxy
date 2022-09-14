const http = require("https");
const { SocksProxyAgent } = require("socks-proxy-agent");

const isProxy = () => {
  const { PROXY_HOSTNAME, PROXY_USER_ID, PROXY_PASSWORD, PROXY_PORT } =
    process.env;

  if (PROXY_HOSTNAME && PROXY_USER_ID && PROXY_PASSWORD && PROXY_PORT) {
    return {
      hostname: PROXY_HOSTNAME,
      userId: PROXY_USER_ID,
      password: PROXY_PASSWORD,
      port: PROXY_PORT,
    };
  }

  return null;
};

const visit = (url, agent) => {
  const info = isProxy();

  if (info) agent = new SocksProxyAgent(info);

  return new Promise((resolve, reject) => {

    const { hostname, pathname: path, search } = new URL(url);

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

    http
      .get(options, (res) => {
        if ([301, 302].includes(res.statusCode)) {
          return resolve(visit(res.headers.location, agent));
        }
        
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
};

module.exports = { visit, isProxy };
