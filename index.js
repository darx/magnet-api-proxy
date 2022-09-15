const network = require("./src/utils/network");
const MagnetDL = new (require("./src/utils/magnetdl.js"))(null);

exports.handler = async (event) => {

  const { path } = event;
  const method = event.method || event.httpMethod;

  if (["OPTIONS"].indexOf(method) !== -1) {
    return network.response.cors();
  }

  const body = network.request.payload(event);
  const [base, type, pagination] = (path || "").split(/\//).filter(Boolean);

  const cached = await network.request.cached(base, type, pagination);

  if (cached) return network.response.success(cached);

  if (["magnet:search", "magnetdl:search"].includes(base)) {

    if (method !== "GET") return network.response.error(405, null);

    let value = decodeURIComponent(type || "");

    value = value
      .trim()
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/ /g, "-");

    let data = await MagnetDL.search(value, pagination);

    return network.response.success(data);
  }

  if (
    [
      "magnet",
      "magnetdl",
      "magnet:trusted",
      "magnetdl:trusted",
      "magnet:trusted:meta",
      "magnetdl:trusted:meta",
    ].includes(base)
  ) {

    if (method !== "GET") return network.response.error(405, null);

    const action = !pagination ? "getAllByCategory" : "getByCategory";

    if (!(type || "").trim()) return network.response.error(400, null);

    const items = await MagnetDL[action](type, pagination);
    const data = items.sort((a, b) => b.seeders - a.seeders);

    if (
      [
        "magnet:trusted",
        "magnetdl:trusted",
        "magnet:trusted:meta",
        "magnetdl:trusted:meta",
      ].includes(base)
    ) {
      for (const [idx, item] of data.entries()) {
        const addtional = await MagnetDL.getById(item.id);

        Object.assign(item, addtional);
        item.trusted = addtional.trusted === "true";
      }
    }

    if (["magnet:trusted:meta", "magnetdl:trusted:meta"].includes(base)) {
      for (const [idx, item] of data.entries()) {
        if (typeof item.imdb !== "string") continue;

        const addtional = await MagnetDL.getMetaData(item.imdb);
        data[idx].meta = addtional;
      }
    }

    network.response.cache(base, type, pagination, data);

    return network.response.success(data);
  }

  if (["imdb"].includes(base) && method == "POST") {
    if (method !== "POST") return network.response.error(405, null);

    const data = [];
    for (const item of body) {
      if (typeof item !== "string") continue;

      const addtional = await MagnetDL.getMetaData(item);
      data.push(addtional);
    }

    return network.responses.success(data);
  }

  return network.response.error(404, null);

};
