import fs from "fs";
import moment from "moment";
import log from "./modules/logging";
import ZimbraAdminSoap from "./modules/zimbraAdmin";
import { ZimbraAccount } from "./types/zimbra";
import { createMountPoint, grantRight } from "./modules/migrateFolder";
import { generateImportAttributes } from "./modules/util";

const importAccountsParallel = async (
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
  const zimbraAccounts = await Promise.allSettled(
    accounts.map(async (account) => {
      const zimbraAccount = await zimbraAdminSoap.getAccountByName(
        account.name
      );
      return {
        ...account,
        id: zimbraAccount.id,
      };
    })
  ).then((results) => {
    const zimbraAccounts: ZimbraAccount[] = [];
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        zimbraAccounts.push(result.value);
      } else {
        log(
          accounts[index].name,
          logFile,
          "error",
          `Failed to get account: ${result.reason.message}`
        );
      }
    });

    return zimbraAccounts;
  });

  // if options only sharedFolders, then dont run modifyAccount

  if (options.includes("sharedFolders")) {
    // grant rights
    await Promise.allSettled(
      zimbraAccounts.map(async (account) => {
        await grantRight({
          account,
          zimbraAdminSoap,
        });
      })
    ).then((results) => {
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          log(
            zimbraAccounts[index].name,
            logFile,
            "error",
            `Failed to grant right: ${result.reason.message}`
          );
        } else {
          log(
            zimbraAccounts[index].name,
            logFile,
            "success",
            "Rights have been granted"
          );
        }
      });
    });

    // create mount points
    await Promise.allSettled(
      zimbraAccounts.map(async (account) => {
        await createMountPoint({
          account,
          zimbraAdminSoap,
        });
      })
    ).then((results) => {
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          log(
            zimbraAccounts[index].name,
            logFile,
            "error",
            `Failed to create mount point: ${result.reason.message}`
          );
        } else {
          log(
            zimbraAccounts[index].name,
            logFile,
            "success",
            "Mount point has been created"
          );
        }
      });
    });
  }

  if (options.length === 1 && options[0] === "sharedFolders") {
    log("All Accounts", logFile, "info", "All accounts have been imported");
    return;
  }
  // modify accounts
  await Promise.allSettled(
    zimbraAccounts.map(async (account) => {
      const attributes = generateImportAttributes(account, options);

      await zimbraAdminSoap.modifyAccount({
        accountId: account.id,
        options: attributes,
      });

      if (attributes.aliases) {
        await Promise.allSettled(
          attributes.aliases.map(async (alias) => {
            await zimbraAdminSoap.addAccountAlias({
              accountId: account.id,
              alias,
            });
          })
        );
      }

      log(account.name, logFile, "success", "Account has been modified");
    })
  ).then((results) => {
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        log(
          zimbraAccounts[index].name,
          logFile,
          "error",
          `Failed to modify account: ${result.reason.message}`
        );
      }
    });
  });

  log("All Accounts", logFile, "info", "All accounts have been imported");
};

export default importAccountsParallel;
