import { parseArgs } from "node:util";
import { parse } from "csv";
import { createTEI } from "./scripts/tei.mjs";
import { argOptions } from "./scripts/constants.mjs";
import fs from "fs";

const main = async (options) => {
  if (options.file) {
    //in this case we'll read in the arguments from a CSV
    let rows = [];
    fs.createReadStream(`csvs/${options.file}`)
      .pipe(parse({ delimiter: "," }))
      .on("data", function (row) {
        rows.push(row);
      })
      .on("end", async function () {
        const header = rows[0];
        for (const row of rows.slice(1)) {
          let data = {};
          for (let i = 0; i < header.length; i++) {
            data[header[i]] = row[i];
          }
          await createTEI(data);
        }
        console.log(`Finished ${rows.length - 1} documents.`);
      })
      .on("error", function (error) {
        console.log(error.message);
      });
  } else {
    await createTEI(options);
    console.log("Finished 1 document.");
  }
};

const options = parseArgs(argOptions).values;

main(options);
