import inquirer from "inquirer";
import ZimbraAdminSoap from "./modules/zimbraAdmin";
import exportAccountsParallel from "./exportParallel";
import importAccountsParallel from "./importParallel";
import config from "./config";
import { importAttributeOptions, exportAttributeOptions } from "./modules/util";
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
    const { exportAttributes } = await inquirer.prompt([
      {
        name: "exportAttributes",
        type: "checkbox",
        message: "Select additional attributes to export",
        choices: exportAttributeOptions,
      },
    ]);

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
      await exportAccountsSequential(zimbraURL, zimbraToken, exportAttributes);
    } else if (runType === "parallel") {
      await exportAccountsParallel(zimbraURL, zimbraToken, exportAttributes);
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
          {
            name: "Create Accounts",
            value: "createAccount",
          },
        ],
      },
    ]);

    const createAttributes = importAttributeOptions.filter(
      (option) => option.value !== "sharedFolders" && option.value !== "aliases"
    );

    const modifyAttributes = importAttributeOptions.filter(
      (option) => option.value !== "zimbraId"
    );

    const { importAttributes } = await inquirer.prompt([
      {
        name: "importAttributes",
        type: "checkbox",
        message: "Select attributes to import",
        choices:
          importAction === "modifyAccount"
            ? modifyAttributes
            : createAttributes,
      },
    ]);

    const {
      import: {
        adminUrl: zimbraURL,
        username: zimbraAdminUser,
        password: zimbraAdminPassword,
      },
      // export: {
      //   adminUrl: exportZimbraURL,
      //   username: exportZimbraAdminUser,
      //   password: exportZimbraAdminPassword,
      // },
    } = config;

    let zimbraToken = "";

    try {
      zimbraToken = await ZimbraAdminSoap.getAdminToken(
        zimbraURL,
        zimbraAdminUser,
        zimbraAdminPassword
      );
    } catch (error: any) {
      console.error(
        `Failed to get import Zimbra admin token: ${error.message}`
      );
      process.exit(1);
    }

    // let exportZimbraToken = "";
    // try {
    //   exportZimbraToken = await ZimbraAdminSoap.getAdminToken(
    //     exportZimbraURL,
    //     exportZimbraAdminUser,
    //     exportZimbraAdminPassword
    //   );
    // } catch (error: any) {
    //   console.error(
    //     `Failed to get export Zimbra admin token: ${error.message}`
    //   );
    //   process.exit(1);
    // }

    if (runType === "sequential") {
      await importAccountsSequential(
        zimbraURL,
        zimbraToken,
        // exportZimbraURL,
        // exportZimbraToken,
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
