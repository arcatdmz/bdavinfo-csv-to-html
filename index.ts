import csv from "csv-parser";
import fs from "fs";

const results = [];

fs.createReadStream("csv/bdav1.csv")
  .pipe(csv())
  .on("data", data => results.push(data))
  .on("end", () => {
    console.log(results);
  });
