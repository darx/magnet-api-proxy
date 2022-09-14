try {
  require("dotenv").config();
} catch (e) {}

const lambda = require("../index");

const test = {
  id: "string",
  magnet: "string",
  title: "string",
  year: "string",
  size: "string",
  age: "string",
  ms: "number",
  seeders: "number",
  leechers: "number"
};

(async () => {
  const response = await lambda.handler({
    path: "/magnetdl/movies/1"
  });

  try {

    const body = JSON.parse(response.body);

    const [item] = body;

    Object.keys(item).forEach(x => {
      if (typeof item[x] !== test[x]) {
        throw new Error("Exspected type was not returned");
      };
    });

    console.log("!! TEST PASSED !!", item, test, "!! TEST PASSED !!");
  } catch (e) {
    console.error(e);
  }

})();