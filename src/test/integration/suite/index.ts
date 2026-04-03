import Mocha from "mocha";
import * as fs from "fs";
import * as path from "path";

export function run(): Promise<void> {
  const mocha = new Mocha({ ui: "bdd", color: true, timeout: 10000 });
  const testsRoot = __dirname;

  const files = fs.readdirSync(testsRoot).filter((f) => f.endsWith(".test.js"));
  files.forEach((f) => mocha.addFile(path.join(testsRoot, f)));

  return new Promise((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} integration test(s) failed`));
      } else {
        resolve();
      }
    });
  });
}
