import csv from "csv-parser";
import fs from "fs";

const input = "csv/bdav.csv",
  output = "html/bdav.html";

const results = [];

const columns = 3;

const date = (() => {
  const d = new Date();
  let month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("/");
})();

const style = `
  body {
    font-family: "Noto Sans JP";
    margin: 0;
    padding: 4mm 2mm;
  }
  .wrapper {
    display: flex;
    flex-direction: column;
  }
  .wrapper > .header {
    flex-grow: 0;
  }
  .wrapper > .header > h1 {
    margin: 0 2mm 3mm 2mm;
    padding: 1mm 2mm 1.2mm 2mm;
    background: #eee;
    border: 1px solid #000;
    border-width: 1px 0;
    font-size: 4mm;
  }
  .wrapper > .header > h1 > .dim {
    color: #888;
  }
  .wrapper > .content {
    flex-grow: 1;
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    width: 100%;
    height: 100%;
  }
  .title {
    width: ${Math.floor((100 * 1000) / columns) / 1000}%;
    flex-grow: 1;
    margin: 3mm 0;
  }
  .title > * {
    margin: 0 2mm;
  }
  .title > h1 {
    display: flex;
    align-items: stretch;
    font-size: 3mm;
    padding: 0;
    border: 1px solid #000;
    border-width: 1px 0;
    min-height: 11mm;
  }
  .title > h1 > .index {
    flex-grow: 0;
    background: #aaa;
    min-width: 4.5mm;
    padding: 1mm 2mm;
    color: #fff;
    text-align: right;
  }
  .title > h1 > .content {
    flex-grow: 1;
    padding: 1mm;
    background: #eee;
  }
  .title > p {
    font-size: 2.4mm;
    margin: 2mm !important;
    padding: 0;
  }
  .title > p:last-child {
    margin-bottom: 0 !important;
  }
  .title > p small {
    font-size: 1.8mm;
  }
`;

fs.createReadStream(input, {
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
    const ws = fs.createWriteStream(output, {
      encoding: "utf8"
    });
    ws.write(`<html><head>`);
    ws.write(
      `<link href="https://fonts.googleapis.com/css?family=Noto+Sans+JP" rel="stylesheet">`
    );
    ws.write(`<style type="text/css">${style}</style>`);
    ws.write(`</head>`);
    ws.write(`<body><div class="wrapper"><div class="header">`);
    ws.write(
      `<h1>${results.length +
        1}タイトル <span class="dim">(作成日: ${date})</span></h1>`
    );
    ws.write(`</div><div class="content">`);
    results.forEach((r, i) => {
      for (let key in r) {
        r[key] = (r[key] as string)
          .replace(/[ａ-ｚＡ-Ｚ０-９]/g, (s: string) => {
            return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
          })
          .replace(/　/g, " ")
          .replace(/\[字\]$/g, "");
      }
      ws.write(
        `<div class="title"><h1><span class="index">${i +
          1}</span><span class="content">${r.t}</span></h1><p><small>${
          r.e
        }</small></p><p>${r.d}</p></div>`
      );
    });
    ws.write(`</div></div>`);
    ws.write(`</div></body></html>`);
    ws.close();
  });
