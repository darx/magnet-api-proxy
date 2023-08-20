const selectors = require("./common/selectors");

exports.handler = async (event, document, network, formatted = true) => {

  const base = `https://${process.env.HOSTNAME_MAGNETDL}`;
  const url = `${base}/file/${event.params.id}/~/`;

  const html = await network.request.fetch(url, null).catch(() => {}) || "";
  const fragment = document.body.cloneNode(true);

  fragment.innerHTML = html;

  const [data] = selectors.iterate("#content", selectors.addtional, fragment);

  if (!formatted) return data;

  return network.response.success(data);

 };