import fs from "fs";
import chalk from "chalk";
import moment from "moment";

declare module "chalk" {
  interface Chalk {
    [key: string]: ChalkInstance & Chalk;
  }
}

const logDir = "logs";

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const log = (
  account: string,
  logFile: string,
  type: "info" | "success" | "error" = "info",
  message: string
) => {
  const now = moment().format("YYYY-MM-DD HH:mm:ss");
  const colors = {
    info: "blue",
    success: "green",
    error: "red",
  };
  const rawLogMessage = `[${now}] [${type.toUpperCase()}] [${account}] ${message}`;

  const logMessage = `[${now}] [${chalk[colors[type]](
    type.toUpperCase()
  )}] [${account}] ${chalk[colors[type]](message)}`;

  console.log(logMessage);
  fs.appendFileSync(`logs/${logFile}`, `${rawLogMessage}\n`);
};

export default log;
