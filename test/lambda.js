try {
  require("dotenv").config();
} catch (e) {}

const lambda = require("../index");

async function main() {

  const response = await lambda.handler({
    path: "/magnet/category/movies/1"
  });

  const body = JSON.parse(response.body);

  const [item] = body;

  Object.keys(item).forEach(x => {
    if (typeof item[x] !== test[x]) {
      throw new Error("Exspected type was not returned");
    };
  });

  return true;
}

main({
  id: "string",
  magnet: "string",
  title: "string",
  year: "string",
  size: "string",
  age: "string",
  ms: "number",
  seeders: "number",
  leechers: "number"
}).then(console.log).catch(console.warn);
