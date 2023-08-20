const { S3Client } = require("@aws-sdk/client-s3");

const configuration = {};

const isLambda =
  !(
    (process.env.LAMBDA_TASK_ROOT && process.env.AWS_EXECUTION_ENV) ||
    false
  ) === false;

if (isLambda === false) {
  if (!process.env.AWS_ACCESSKEYID || !process.env.AWS_SECRETACCESSKEYID) {
    throw new Error(`Unable to find env AWS_ACCESSKEYID / AWS_SECRETACCESSKEYID, 
      .env file must be missing or doesn't contain the referenced envs.`);
  }

  Object.assign(configuration, {
    region: process.env.AWS_REGION || "eu-west-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESSKEYID,
      secretAccessKey: process.env.AWS_SECRETACCESSKEYID,
    },
  });
} else {
  Object.assign(configuration, {
    region: process.env.AWS_REGION || "eu-west-1",
  });
}

const s3 = new S3Client(configuration);

const streamToBuffer = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};

const uuid = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const cacheKey = (path = "", method = "", body = {}) => {
  return Buffer.from([path, method, JSON.stringify(body)].join(""))
    .toString("base64")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/ /g, "-")
    .substring(0, 1024);
};

const cleanMetaData = (object) => {
  const entries = Object.entries({
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
  });

  return entries.reduce((obj, [name, prop]) => {
    obj[name] = typeof prop === "function" ? prop(object) : object[prop] || "";
    return obj;
  }, {});
};

module.exports = { streamToBuffer, uuid, s3, isLambda, cacheKey, cleanMetaData };