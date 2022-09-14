const { visit } = require("./visit");
const { cleanMetaData, getCachedItem } = require("./helpers");

const jsdom = require("jsdom");

const { JSDOM } = jsdom;
const {
  window: { document },
} = new JSDOM();

const iterate = require("./iterate");

class MagnetDL {
  constructor(proxy) {
    this.proxy = proxy;
    this.store = {};
    this.map = [
      {
        name: "magnet",
        selector: '[href^="magnet:"]',
        property: "href",
        required: true,
        transform(val) {
          return val.split("&tr=")[0];
        }
      },
      {
        name: "id",
        selector: ".n a",
        property: "href",
        required: true,
        transform(val) {
          return Number(val.split(/\//).filter(Boolean)[1]);
        },
      },
      {
        name: "name",
        selector: 'a:not([href*="magnet:"])',
        property: "textContent",
        transform(val) {
          let item = /^.+?(?=\s*[(.]?(\d{4}))/gim.exec(val);

          if (!item) return false;

          let { [0]: title, [1]: year } = item;

          return { title: title.replace(/\./g, " "), year: Number(year) };
        },
        required: true,
      },
      {
        name: "size",
        selector: "td:nth-child(6)",
        property: "textContent",
      },
      {
        name: "age",
        selector: "td:nth-child(3)",
        property: "textContent",
        transform(val) {
          const { [0]: num, [1]: period } = val.split(/\s/);
          const segements = {
            second: 1000,
            seconds: 1000,
            minute: 60000,
            minutes: 60000,
            hour: 3600000,
            hours: 3600000,
            day: 86400000,
            days: 86400000,
            week: 604800000,
            weeks: 604800000,
            month: 2629800000,
            months: 2629800000,
            year: 31557600000,
            years: 31557600000,
          };

          return { age: val, ms: +num * segements[period] };
        },
      },
      {
        name: "seeders",
        selector: ".s",
        property: "textContent",
        transform(val) {
          return +val;
        },
      },
      {
        name: "leechers",
        selector: ".l",
        property: "textContent",
        transform(val) {
          return +val;
        },
      },
    ];
  }

  getById(id) {
    return new Promise((resolve) => {
      visit(
        `https://${process.env.HOSTNAME_MAGNETDL}/file/${id}/-/`,
        this.proxy
      )
        .then((html) => {
          document.body.innerHTML = html;
          return document.body;
        })
        .then((fragment) => {
          const list = iterate(
            "#content",
            [
              {
                name: "trusted",
                selector: ".col2 dd:nth-child(4)",
                property: "textContent",
                transform(val) {
                  return String(val.indexOf("trusted") !== -1);
                },
              },
              {
                name: "imdb",
                selector: `.col1 a[href*="imdb.com"]`,
                property: "href",
                transform(val) {
                  return val.split(/\//).filter(Boolean)[3];
                },
              },
              {
                name: "format",
                selector: ".f-avi",
                property: "textContent",
                transform(val) {
                  const segments = val.split(" (");
                  return segments[segments.length - 2].split(".").pop();
                },
              },
            ],
            fragment
          );

          resolve(list[0] || {});
        })
        .catch(() => resolve([]));
    });
  }

  search(value = "", page = 1) {
    return new Promise((resolve) => {
      visit(
        `https://${process.env.HOSTNAME_MAGNETDL}/k/${value}/${page}/`,
        this.proxy
      )
        .then((html) => {
          document.body.innerHTML = html;
          return document.body;
        })
        .then((fragment) => {
          const list = iterate(
            "#content > div.fill-table > table > tbody > tr",
            this.map,
            fragment
          );

          resolve(list);
        })
        .catch(() => resolve([]));
    });
  }

  getByCategory(category = "movies", page = 1) {
    return new Promise((resolve) => {
      visit(
        `https://${process.env.HOSTNAME_MAGNETDL}/download/${category}/se/desc/${page}/`,
        this.proxy
      )
        .then((html) => {
          document.body.innerHTML = html;
          return document.body;
        })
        .then((fragment) => {
          const list = iterate(
            "#content > div.fill-table > table > tbody > tr",
            this.map,
            fragment
          );

          resolve(list);
        })
        .catch(() => resolve([]));
    });
  }

  getAllByCategory(category = "movies", page = 1, data = []) {
    return new Promise((resolve) => {
      if (this.store.hasOwnProperty(category)) {
        return resolve(this.store[category]);
      }

      page = Number(page) || 0;
      this.getByCategory(category, page)
        .then((list) => {
          resolve(
            page !== 30
              ? this.getAllByCategory(category, page + 1, [].concat(list, data))
              : [].concat(list, data)
          );
        })
        .catch((e) => {
          resolve(
            page !== 30
              ? this.getAllByCategory(category, page + 1, [].concat([], data))
              : [].concat([], data)
          );
        });
    });
  }

  getMetaData(id) {
    return new Promise((resolve) => {
      visit(
        `https://www.omdbapi.com/?i=${id}&apikey=${process.env.OMDB_API}`,
        this.proxy
      )
        .then((response) => {
          return JSON.parse(response);
        })
        .then((data) => {
          resolve(cleanMetaData(data));
        })
        .catch((e) => {
          console.log(e)
        });
    });
  }
};

module.exports = MagnetDL;
