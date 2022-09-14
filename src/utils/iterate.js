
module.exports = (iterator, content, context) => {
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
