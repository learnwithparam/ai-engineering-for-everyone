// A provider that plays back saved answers, so the eval needs no key.
const fs = require("node:fs");
const path = require("node:path");

class Recorded {
  constructor(options) {
    this.file = options.config.file;
    this.name = options.config.name;
  }

  id() {
    return this.name;
  }

  async callApi(_prompt, context) {
    const rows = fs.readFileSync(path.join(__dirname, this.file), "utf8").trim().split("\n");
    const row = rows.slice(1).find((line) => line.startsWith(context.vars.form));
    return { output: row ?? "unknown" };
  }
}

module.exports = Recorded;
