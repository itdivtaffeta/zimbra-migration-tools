import fs from "fs";
import moment from "moment";
import log from "./modules/logging";
import ZimbraSoap from "./modules/zimbra";
import { ZimbraAccount } from "./types/zimbra";
import { ImportAttributes } from "./types/attribute";

const generateImportAttributes = (
  account: ZimbraAccount,
  options: string[]
) => {
  const attributes = options.reduce((acc: ImportAttributes, option) => {
    if (option === "filter") {
      acc.incomingFilter = account.incomingFilter;
      acc.outgoingFilter = account.outgoingFilter;
    }

    if (option === "forwarding") {
      acc.forwardingAddresses = account.forwardingAddresses;
    }

    if (option === "hiddenForwarding") {
      acc.hiddenForwardingAddresses = account.hiddenForwardingAddresses;
    }

    if (option === "description") {
      acc.description = account.description;
    }

    if (option === "quota") {
      acc.quota = account.quota;
    }

    if (option === "notes") {
      acc.notes = account.notes;
    }

    if (option === "firstName") {
      acc.firstName = account.firstName;
    }

    if (option === "lastName") {
      acc.lastName = account.lastName;
    }

    if (option === "middleName") {
      acc.middleName = account.middleName;
    }

    if (option === "displayName") {
      acc.displayName = account.displayName;
    }

    if (option === "zimbraAuthLdapExternalDn") {
      acc.zimbraAuthLdapExternalDn = account.zimbraAuthLdapExternalDn;
    }

    return acc;
  }, {});

  return attributes;
};

const importAccounts = async (
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

  const zimbraSoap = new ZimbraSoap(zimbraURL, zimbraToken);

  if (action === "modifyAccount") {
    // get accounts
    const zimbraAccounts = await Promise.allSettled(
      accounts.map(async (account) => {
        const zimbraAccount = await zimbraSoap.getAccountByName(account.name);
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

    // modify accounts
    await Promise.allSettled(
      zimbraAccounts.map(async (account) => {
        const attributes = generateImportAttributes(account, options);

        await zimbraSoap.modifyAccount({
          accountId: account.id,
          options: attributes,
        });

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
  }

  log("All Accounts", logFile, "info", "All accounts have been imported");
};

export default importAccounts;
