import inquirer from "inquirer";
import ZimbraSoap from "./modules/zimbra";
import exportAccounts from "./export";
import importAccounts from "./import";
import config from "./config";

const main = async () => {
  const { action } = await inquirer.prompt([
    {
      name: "action",
      type: "list",
      message: "Select action:",
      choices: [
        {
          name: "Export Accounts",
          value: "export",
        },
        {
          name: "Import Accounts",
          value: "import",
        },
        ,
      ],
    },
  ]);

  if (action === "export") {
    const {
      export: {
        url: zimbraURL,
        username: zimbraAdminUser,
        password: zimbraAdminPassword,
      },
    } = config;

    let zimbraToken = "";

    try {
      zimbraToken = await ZimbraSoap.getAdminToken(
        zimbraURL,
        zimbraAdminUser,
        zimbraAdminPassword
      );
    } catch (error: any) {
      console.error(`Failed to get Zimbra admin token: ${error.message}`);
      process.exit(1);
    }

    await exportAccounts(zimbraURL, zimbraToken);
  }
  if (action === "import") {
    const { importAction } = await inquirer.prompt([
      {
        name: "importAction",
        type: "list",
        message: "Select action:",
        choices: [
          {
            name: "Create Accounts",
            value: "createAccount",
          },
          {
            name: "Modify Accounts",
            value: "modifyAccount",
          },
          ,
        ],
      },
    ]);

    const { importAttributes } = await inquirer.prompt([
      {
        name: "importAttributes",
        type: "checkbox",
        message: "Select attributes to import",
        choices: [
          {
            name: "First Name",
            value: "firstName",
          },
          {
            name: "Middle Name",
            value: "middleName",
          },
          {
            name: "Last Name",
            value: "lastName",
          },
          {
            name: "Display Name",
            value: "displayName",
          },
          {
            name: "Description",
            value: "description",
          },
          {
            name: "Quota",
            value: "quota",
          },
          {
            name: "Notes",
            value: "notes",
          },
          {
            name: "Filter",
            value: "filter",
          },
          {
            name: "Forwarding",
            value: "forwarding",
          },
          {
            name: "Hidden Forwarding",
            value: "hiddenForwarding",
          },
          {
            name: "zimbraAuthLdapExternalDn",
            value: "zimbraAuthLdapExternalDn",
          },
        ],
      },
    ]);

    const {
      import: {
        url: zimbraURL,
        username: zimbraAdminUser,
        password: zimbraAdminPassword,
      },
    } = config;

    let zimbraToken = "";

    try {
      zimbraToken = await ZimbraSoap.getAdminToken(
        zimbraURL,
        zimbraAdminUser,
        zimbraAdminPassword
      );
    } catch (error: any) {
      console.error(`Failed to get Zimbra admin token: ${error.message}`);
      process.exit(1);
    }

    await importAccounts(
      zimbraURL,
      zimbraToken,
      importAction,
      importAttributes
    );
  }
};

main();
