import log from "../../modules/logging";
import ZimbraAdminSoap from "../../modules/zimbraAdmin";
import fs from "fs";
import moment from "moment";
import ZimbraUserSoap from "../../modules/zimbraUser";

const exportAccountsParallel = async (
  zimbraURL: string,
  zimbraToken: string,
  options: string[]
): Promise<void> => {
  const logFile = `export-${moment().format("YYYY-MM-DD-HH-mm-ss")}.log`;

  const zimbraAdminSoap = new ZimbraAdminSoap(zimbraURL, zimbraToken);

  //   get all accounts
  const zimbraAccounts = await zimbraAdminSoap.getAllAccounts();

  log("EXPORT", logFile, "info", `Found ${zimbraAccounts.length} accounts`);

  if (options.includes("sharedFolders")) {
    // get folders and links for each account
    await Promise.allSettled(
      zimbraAccounts.map(async (account) => {
        const userToken = await zimbraAdminSoap.delegateAuth(account.name);
        const zimbraUserSoap = new ZimbraUserSoap(zimbraURL, userToken);

        const { folders, links } = await zimbraUserSoap.getFolders();

        account.folders = folders;
        account.folderLinks = links;

        log(
          account.name,
          logFile,
          "success",
          `Found ${folders.length} folders and ${links.length} shared folders`
        );
      })
    ).then((results) => {
      results.forEach((result) => {
        if (result.status === "rejected") {
          log(
            "EXPORT",
            logFile,
            "error",
            `Failed to get folders and links for account: ${result.reason.message}`
          );
        }
      });
    });
  }

  fs.writeFileSync("accounts.json", JSON.stringify(zimbraAccounts, null, 2));
  log("All Accounts", logFile, "info", "All accounts have been exported");
  9;
};

export default exportAccountsParallel;
