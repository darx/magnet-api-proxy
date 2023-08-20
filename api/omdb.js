const { cleanMetaData } = require("../utils/helpers");

exports.handler = async (event, document, network, formatted = true) => {

  if (!process.env.OMDB_API) {
    if (!formatted) return {};
    return network.response.error(501, null);
  }

  const base = `https://${process.env.OMDB_HOSTNAME}/?`;
  const url = `${base}i=${event.params.imdb}&apikey=${process.env.OMDB_API}`;

  const response = await network.request.fetch(url, null).catch(() => {}) || "{}";
  const json = JSON.parse(response);

  const data = cleanMetaData(json);

  if (!formatted) return data;

  return network.response.success(data);
};
