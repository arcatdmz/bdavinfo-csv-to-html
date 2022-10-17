import iconv from "iconv-lite";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import ffmetadata from "./ffmetadata";

interface Mp4TaskIface {
  path: string;
  rename?: string;
  data: {
    title: string;
    description: string;
    year: string;
  };
}

const basedir = "data",
  input = path.join(basedir, "bdav.csv"),
  output = path.join(basedir, "bdav.html"),
  mp4dir = basedir,
  createMp4Path = (dir: string, index: number) =>
    path.join(dir, String(index + 1).padStart(5, "0") + ".mp4"),
  rename = true;

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

fs.createReadStream(input)
  // .pipe(iconv.decodeStream("Shift_JIS"))
  .pipe(
    csv({
      headers: ["t", "d", "e"],
    })
  )
  .on("data", (data) =>
    results.push(
      data as {
        t: string;
        d: string;
        e: string;
      }
    )
  )
  .on("end", async () => {
    const mp4Tasks: Mp4TaskIface[] = [];

    const ws = fs.createWriteStream(output, {
      encoding: "utf8",
    });
    ws.write(`<html><head>`);
    ws.write(
      `<link href="https://fonts.googleapis.com/css?family=Noto+Sans+JP" rel="stylesheet">`
    );
    ws.write(`<style type="text/css">${style}</style>`);
    ws.write(`</head>`);
    ws.write(`<body><div class="wrapper"><div class="header">`);
    ws.write(
      `<h1>${
        results.length + 1
      }タイトル <span class="dim">(作成日: ${date})</span></h1>`
    );
    ws.write(`</div><div class="content">`);
    results.forEach((r, i) => {
      for (let key in r) {
        r[key] = (r[key] as string)
          .replace(/[ａ-ｚＡ-Ｚ０-９]/g, (s: string) => {
            return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
          })
          .replace(/　/g, " ")
          .replace(/\[字\]$/g, "")
          .replace(/^\ufeff?".+"$/g, (s: string) => {
            return s.substring(
              s.charCodeAt(0) === 0xfeff ? 2 : 1,
              s.length - 1
            );
          });
      }
      ws.write(
        `<div class="title"><h1><span class="index">${
          i + 1
        }</span><span class="content">${r.t}</span></h1><p><small>${
          r.e
        }</small></p><p>${r.d}</p></div>`
      );
      const mp4Path = createMp4Path(mp4dir, i);
      if (fs.existsSync(mp4Path)) {
        const y = /^([0-9]+)/.exec(r.d);
        const data: any = {
          title: r.t,
          description: r.e,
        };
        if (y) {
          data.year = y[1];
        }
        const options: Mp4TaskIface = {
          path: mp4Path,
          data,
        };
        if (rename) {
          options.rename = path.join(
            mp4dir,
            `${r.t} (${(r.d as string).replace(/\//g, "-")}).mp4`
          );
        }
        mp4Tasks.push(options);
      }
    });
    ws.write(`</div></div>`);
    ws.write(`</div></body></html>`);
    ws.close();

    for (const { path: p, rename, data } of mp4Tasks) {
      await new Promise<void>((r) => {
        console.log("---", p);
        ffmetadata.write(p, data, (err) => {
          if (err) console.error("Error writing metadata", err);
          else console.log("Wrote metadata", data);
          if (rename) {
            fs.renameSync(p, rename);
          }
          r();
        });
      });
    }
  });
