import inquirer from "inquirer";
import ZimbraAdminSoap from "./modules/zimbraAdmin";
import exportAccountsParallel from "./exportParallel";
import importAccountsParallel from "./importParallel";
import config from "./config";
import { attributeOptions } from "./modules/util";
import exportAccountsSequential from "./exportSequential";
import importAccountsSequential from "./importSequential";

const main = async () => {
  const { action, runType } = await inquirer.prompt([
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
    {
      name: "runType",
      type: "list",
      message: "Select run type:",
      choices: [
        {
          name: "Sequential",
          value: "sequential",
        },
        {
          name: "Parallel",
          value: "parallel",
        },
        ,
      ],
    },
  ]);

  if (action === "export") {
    const {
      export: {
        adminUrl: zimbraURL,
        username: zimbraAdminUser,
        password: zimbraAdminPassword,
      },
    } = config;

    let zimbraToken = "";

    try {
      zimbraToken = await ZimbraAdminSoap.getAdminToken(
        zimbraURL,
        zimbraAdminUser,
        zimbraAdminPassword
      );
    } catch (error: any) {
      console.error(`Failed to get Zimbra admin token: ${error.message}`);
      process.exit(1);
    }

    if (runType === "sequential") {
      await exportAccountsSequential(zimbraURL, zimbraToken);
    } else if (runType === "parallel") {
      await exportAccountsParallel(zimbraURL, zimbraToken);
    }
  }
  if (action === "import") {
    const { importAction } = await inquirer.prompt([
      {
        name: "importAction",
        type: "list",
        message: "Select action:",
        choices: [
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
        choices: attributeOptions,
      },
    ]);

    const {
      import: {
        adminUrl: zimbraURL,
        username: zimbraAdminUser,
        password: zimbraAdminPassword,
      },
    } = config;

    let zimbraToken = "";

    try {
      zimbraToken = await ZimbraAdminSoap.getAdminToken(
        zimbraURL,
        zimbraAdminUser,
        zimbraAdminPassword
      );
    } catch (error: any) {
      console.error(`Failed to get Zimbra admin token: ${error.message}`);
      process.exit(1);
    }

    if (runType === "sequential") {
      await importAccountsSequential(
        zimbraURL,
        zimbraToken,
        importAction,
        importAttributes
      );
    } else if (runType === "parallel") {
      await importAccountsParallel(
        zimbraURL,
        zimbraToken,
        importAction,
        importAttributes
      );
    }
  }
};

main();
