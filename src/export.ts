import log from "./modules/logging";
import ZimbraSoap from "./modules/zimbra";
import fs from "fs";
import moment from "moment";

const exportAccounts = async (
  zimbraURL: string,
  zimbraToken: string
): Promise<void> => {
  const logFile = `export-${moment().format("YYYY-MM-DD-HH-mm-ss")}.log`;

  const zimbraSoap = new ZimbraSoap(zimbraURL, zimbraToken);

  //   get all accounts
  const zimbraAccounts = await zimbraSoap.getAllAccounts();

  log(
    "All Accounts",
    logFile,
    "info",
    `Found ${zimbraAccounts.length} accounts`
  );

  fs.writeFileSync("accounts.json", JSON.stringify(zimbraAccounts, null, 2));
  log("All Accounts", logFile, "info", "All accounts have been exported");
  9;
};

export default exportAccounts;
