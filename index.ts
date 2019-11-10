import csv from "csv-parser";
import fs from "fs";

const results = [];

const columns = 3;

const style = `
  body { font-family: "Noto Sans JP"; }
  .wrapper { display: flex; }
  .column { width: ${Math.floor((100 * 1000) / columns) /
    1000}%; flex-grow: 1; }
  h1 { font-size: 5mm; margin: 0 0 2mm 0; padding: 0; border: 1px solid #000; border-width: 0 0 1px 0; }
  p { font-size: 4mm; margin: 0; padding: 0; }
  p small { font-size: 3mm; }
`;

fs.createReadStream("csv/bdav1.csv", {
  encoding: "utf8"
})
  .pipe(
    csv({
      headers: ["t", "d", "e"]
    })
  )
  .on("data", data =>
    results.push(data as {
      t: string;
      d: string;
      e: string;
    })
  )
  .on("end", () => {
    const ws = fs.createWriteStream("html/bdav1.html", {
      encoding: "utf8"
    });
    ws.write(`<html><head>`);
    ws.write(
      `<link href="https://fonts.googleapis.com/css?family=Noto+Sans+JP" rel="stylesheet">`
    );
    ws.write(`<style type="text/css">${style}</style>`);
    ws.write(`</head>`);
    ws.write(`<body><div class="wrapper"><div class="column">`);
    let column = 0;
    const rows = Math.ceil(results.length / columns);
    results.forEach((r, i) => {
      if (column !== Math.floor(i / rows)) {
        column = Math.floor(i / rows);
        ws.write(`</div><div class="column">`);
      }
      for (let key in r) {
        r[key] = (r[key] as string)
          .replace(/[ａ-ｚＡ-Ｚ０-９]/g, (s: string) => {
            return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
          })
          .replace(/　/g, " ");
      }
      ws.write(`<h1>${r.t}</h1><p><small>${r.e}</small></p><p>${r.d}</p>`);
    });
    ws.write(`</div></div></body></html>`);
    ws.close();
  });
