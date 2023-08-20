const id = require("./id");
const omdb = require("./omdb");

const selectors = require("./common/selectors");

exports.handler = async (event, document, network, formatted = true) => {

  if (Number(event.params.pagination) > 30) {
    return network.response.error(406, null);
  }

  const base = `https://${process.env.HOSTNAME_MAGNETDL}`;
  const url = `${base}/download/${event.params.category}/se/desc/${event.params.pagination}/`;

  const html = await network.request.fetch(url, null).catch(() => {}) || "";
  const fragment = document.body.cloneNode(true);

  fragment.innerHTML = html;

  const data = selectors.iterate(
    "#content > div.fill-table > table > tbody > tr",
    selectors.collection,
    fragment
  ).filter(
    (obj, index, self) => index === self.findIndex(item => item.title === obj.title && item.year === obj.year)
  );

  for (const [index, item] of data.entries()) {
    const addtional = await id.handler({
      params: { id: item.id }
    }, document, network, false) || {};

    const imdb = addtional.imdb ? await omdb.handler({
      params: { imdb: addtional.imdb }
    }, null, network, false) : {};

    Object.assign(data[index], addtional, imdb);
  }

  if (!formatted) return data;

  return network.response.success(data);
};