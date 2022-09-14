const AWS = require("aws-sdk");

const isLocalEnvironment =
  !!(
    (process.env.LAMBDA_TASK_ROOT && process.env.AWS_EXECUTION_ENV) ||
    false
  ) === false;

if (isLocalEnvironment) {
  AWS.config.update({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
}

const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: process.env.AWS_S3_BUCKET },
});

const stub = {
  language: "Language",
  poster: "Poster",
  title: "Title",
  year: "Year",
  rated: "Rated",
  runtime: "Runtime",
  imdb: "imdbID",
  description: "Plot",
  releases(props) {
    return ["Released", "DVD"].map((x) => props[x] || "");
  },
  ratings(props) {
    return (props["Ratings"] || []).map((x) => {
      let { Source: name, Value: value } = x;
      return { name, value };
    });
  },
  genres(props) {
    return (props["Genre"] || "").split(",").map((x) => x.trim());
  },
  actors(props) {
    return (props["Actors"] || "").split(",").map((x) => x.trim());
  },
  classification(props) {
    const map = {
      G: "U",
      PG: "PG",
      "PG-13": "12",
      R: "18",
      NR: "r18",
    };

    return map[props["Rated"] || ""] || "";
  },
};

const cleanMetaData = (object) => {
  const entries = Object.entries(stub);
  return entries.reduce((obj, [name, prop]) => {
    obj[name] = typeof prop === "function" ? prop(object) : object[prop] || "";
    return obj;
  }, {});
};

module.exports = { cleanMetaData, isLocalEnvironment, s3 };
