const iterate = (iterator, content, context) => {
  const required = content.reduce((arr, x) => {
    if (x?.required === true) arr.push(x.name);
    return arr;
  }, []);

  return [...context.querySelectorAll(iterator)].reduce((arr, x) => {
    const keys = content.reduce((object, i) => {
      let elem = x.querySelector(i.selector);
      let item =
        elem && i.property && elem[i.property] ? elem[i.property] || "" : "";

      if (typeof i.transform === "function") {
        item = i.transform(item);
      }

      if (typeof i.required === "boolean" && !item) return false;

      if (["number", "string", "boolean"].includes(typeof item)) {
        object[i.name] = item;
      } else if (typeof item === "object") {
        object = { ...object, ...item };
      }

      return object;
    }, {});

    if (!keys) return arr;
    if (required.length && !required.some((x) => keys.hasOwnProperty(x))) {
      return arr;
    }

    arr.push(keys);

    return arr;
  }, []);
};

const collection = [
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

      return { age: val, ms: Number(num) * segements[period] };
    },
  },
  {
    name: "seeders",
    selector: ".s",
    property: "textContent",
    transform(val) {
      return Number(val);
    },
  },
  {
    name: "leechers",
    selector: ".l",
    property: "textContent",
    transform(val) {
      return Number(val);
    },
  },
];

const addtional = [
  {
    name: "trusted",
    selector: ".col2 > dd > i",
    property: "textContent",
    transform(val) {
      return val.indexOf("trusted") !== -1;
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
      return segments[segments.length - 2]?.split(".").pop();
    },
  },
];

module.exports = { iterate, collection, addtional };
