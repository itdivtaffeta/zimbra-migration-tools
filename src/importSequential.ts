import fs from "fs";
import moment from "moment";
import log from "./modules/logging";
import ZimbraAdminSoap from "./modules/zimbraAdmin";
import { ZimbraAccount } from "./types/zimbra";
import { ImportAttributes } from "./types/attribute";
import { createMountPoint, grantRight } from "./modules/migrateFolder";
import { generateImportAttributes } from "./modules/util";

const importAccountsSequential = async (
  zimbraURL: string,
  zimbraToken: string,
  action: string,
  options: string[]
) => {
  //   read array of accounts from json file
  const accounts: ZimbraAccount[] = JSON.parse(
    fs.readFileSync("./accounts.json", "utf8")
  );

  const logFile = `import-${moment().format("YYYY-MM-DD-HH-mm-ss")}.log`;

  log(
    "IMPORT",
    logFile,
    "info",
    `Importing ${action} with options: ${options.join(", ")}`
  );

  log(
    "IMPORT",
    logFile,
    "info",
    `Found ${accounts.length} accounts in accounts.json`
  );

  const zimbraAdminSoap = new ZimbraAdminSoap(zimbraURL, zimbraToken);

  // get accounts
  const zimbraAccounts: ZimbraAccount[] = [];
  for await (const account of accounts) {
    try {
      const zimbraAccount = await zimbraAdminSoap.getAccountByName(
        account.name
      );
      zimbraAccounts.push({
        ...account,
        id: zimbraAccount.id,
      });
    } catch (error: any) {
      log(
        account.name,
        logFile,
        "error",
        `Failed to get account: ${error.message}`
      );
    }
  }

  if (options.includes("sharedFolders")) {
    //   grant rights
    for await (const account of zimbraAccounts) {
      try {
        await grantRight({
          account,
          zimbraAdminSoap,
        });
        log(account.name, logFile, "success", "Rights have been granted");
      } catch (error: any) {
        log(
          account.name,
          logFile,
          "error",
          `Failed to grant right: ${error.message}`
        );
      }
    }

    // create mountpoints
    for await (const account of zimbraAccounts) {
      try {
        await createMountPoint({
          account,
          zimbraAdminSoap,
        });
        log(account.name, logFile, "success", "Mountpoint has been created");
      } catch (error: any) {
        log(
          account.name,
          logFile,
          "error",
          `Failed to create mountpoint: ${error.message}`
        );
      }
    }
  }

  if (options.length === 1 && options[0] === "sharedFolders") {
    log("All Accounts", logFile, "info", "All accounts have been imported");
    return;
  }
  // modify accounts
  for await (const account of zimbraAccounts) {
    try {
      const attributes = generateImportAttributes(account, options);

      await zimbraAdminSoap.modifyAccount({
        accountId: account.id,
        options: attributes,
      });

      if (attributes.aliases) {
        await Promise.all(
          attributes.aliases.map((alias) =>
            zimbraAdminSoap.addAccountAlias({
              accountId: account.id,
              alias,
            })
          )
        );
      }

      log(account.name, logFile, "success", "Account has been modified");
    } catch (error: any) {
      log(
        account.name,
        logFile,
        "error",
        `Failed to modify account: ${error.message}`
      );
    }
  }

  log("All Accounts", logFile, "info", "All accounts have been imported");
};

export default importAccountsSequential;
