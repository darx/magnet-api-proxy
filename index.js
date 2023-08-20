const router = require("./api/+router");
const network = require("./utils/network");

const { cacheKey } = require("./utils/helpers");

exports.handler = async (event) => {
  
  event.body = await network.request.payload(event);
  event.path = event.path || event.requestContext.http.path || "";
  event.method =
    event.method || event.httpMethod || event.requestContext.http.method;

  if (event.queryStringParameters) {
    event.path = [event.path, event.queryStringParameters].join("?");
  }

  if (["OPTIONS"].indexOf(event.method) !== -1) {
    return network.response.cors();
  }

  const CACHE_KEY = cacheKey(event.path, event.method, event.body);

  const cached = await network.request.cached(CACHE_KEY);
  if (cached && cached.body.length > 2) return cached;

  try {
    const response = await router.handler(event);

    if (response?.statusCode === 200) {
      network.response.cache(CACHE_KEY, response);
    }

    return response;
  } catch (_) {
    console.log(_);
    return network.response.error(500, null);
  }

};
