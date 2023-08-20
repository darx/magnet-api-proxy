const jsdom = require("jsdom");
const { match } = require("path-to-regexp");

const omdb = require("./omdb");
const search = require("./search");
const category = require("./category");

const network = require("../utils/network");

const { JSDOM } = jsdom;
const { window: { document } } = new JSDOM();

exports.handler = async (request) => {
  const routes = [
    {
      path: "/omdb/:imdb",
      method: "GET",
      handler: omdb.handler
    },
    {
      path: "/magnet/search/:query/:pagination(\\d+)",
      method: "GET",
      handler: search.handler
    },
    {
      path: "/magnet/category/:category/:pagination(\\d+)",
      method: "GET",
      handler: category.handler
    },
  ].sort((a, b) => b.path.length - a.path.length);

  let route = null;
  let methodNotAllowed = false;

  for (let i = 0, len = routes.length; i < len; i++) {
    let options = match(routes[i].path, {
      decode: (pathname) => {
        return decodeURI(pathname).replace(/\/+/g, "/").normalize();
      },
    })(request.path);

    if (!options) continue;

    if (routes[i].method !== request.method) {
      methodNotAllowed = true;
      continue;
    }

    route = Object.assign({}, routes[i], {
      params: options.params,
      body: request.body,
    });
    methodNotAllowed = false;
  }

  if (methodNotAllowed === true) {
    return network.response.error(405, null);
  }

  if (!route) {
    return network.response.error(404, null);
  }

  try {
    return await route.handler(route, document, network);
  } catch (_) {
    console.log(_);
    return network.response.error(500, null);
  }
};