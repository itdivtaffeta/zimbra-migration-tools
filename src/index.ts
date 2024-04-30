import inquirer from "inquirer";
import ZimbraAdminSoap from "./modules/zimbraAdmin";
import exportAccountsParallel from "./core/account/exportParallel";
import importAccountsParallel from "./core/account/importParallel";
import config from "./config";
import {
  importAccountAttributeOptions,
  exportAccountAttributeOptions,
  importDistributionListAttributeOptions,
} from "./configs/attribute";
import exportAccountsSequential from "./core/account/exportSequential";
import importAccountsSequential from "./core/account/importSequential";
import exportDistributionListsSequential from "./core/distributionList/exportSequential";
import importDistributionListsSequential from "./core/distributionList/importSequential";

const main = async () => {
  const { target, action } = await inquirer.prompt([
    {
      name: "target",
      type: "list",
      message: "Select target:",
      choices: [
        {
          name: "Account",
          value: "account",
        },
        {
          name: "Distribution List",
          value: "distribution-list",
        },
      ],
    },
    {
      name: "action",
      type: "list",
      message: "Select action:",
      choices: [
        {
          name: "Export",
          value: "export",
        },
        {
          name: "Import",
          value: "import",
        },
      ],
    },
  ]);

  console.log(target, action);

  if (target === "account") {
    const { runType } = await inquirer.prompt([
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
        ],
      },
    ]);
    if (action === "export") {
      const { exportAttributes } = await inquirer.prompt([
        {
          name: "exportAttributes",
          type: "checkbox",
          message: "Select additional attributes to export",
          choices: exportAccountAttributeOptions,
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
        await exportAccountsSequential(
          zimbraURL,
          zimbraToken,
          exportAttributes
        );
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

      const createAttributes = importAccountAttributeOptions.filter(
        (option) =>
          option.value !== "sharedFolders" && option.value !== "aliases"
      );

      const modifyAttributes = importAccountAttributeOptions.filter(
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
  }

  if (target === "distribution-list") {
    if (action === "export") {
      const {
        export: {
          adminUrl: zimbraURL,
          username: zimbraAdminUser,
          password: zimbraAdminPassword,
        },
      } = config;

      let zimbraToken;

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

      await exportDistributionListsSequential(zimbraURL, zimbraToken);
    }

    if (action === "import") {
      const {
        import: {
          adminUrl: zimbraURL,
          username: zimbraAdminUser,
          password: zimbraAdminPassword,
        },
      } = config;

      let zimbraToken;

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

      const { action } = await inquirer.prompt([
        {
          name: "action",
          type: "list",
          message: "Select action:",
          choices: [
            {
              name: "Create Distribution Lists",
              value: "createDL",
            },
            {
              name: "Modify Distribution Lists",
              value: "modifyDL",
            },
          ],
        },
      ]);

      const modifyAttributes = importDistributionListAttributeOptions.filter(
        (option) => option.value !== "zimbraId"
      );

      const { importAttributes } = await inquirer.prompt([
        {
          name: "importAttributes",
          type: "checkbox",
          message: "Select attributes to import",
          choices:
            action === "modifyDL"
              ? modifyAttributes
              : importDistributionListAttributeOptions,
        },
      ]);

      await importDistributionListsSequential({
        importZimbraToken: zimbraToken,
        importZimbraURL: zimbraURL,
        action,
        options: importAttributes,
      });
    }
  }
};

main();
