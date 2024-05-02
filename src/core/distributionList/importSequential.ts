import fs from "fs";
import moment from "moment";
import log from "../../modules/logging";
import ZimbraAdminSoap from "../../modules/zimbraAdmin";
import { ZimbraAccount, ZimbraDistributionList } from "../../types/zimbra";
import { ImportDistributionListAttributes } from "../../configs/attribute";

interface existingDL extends ZimbraDistributionList {
  existingMembers: string[];
  existingOwnerIds: string[];
}

interface importDistributionListsSequentialOptions {
  importZimbraURL: string;
  importZimbraToken: string;
  action: "createDL" | "modifyDL";
  options: ImportDistributionListAttributes[];
}

const createDLAction = async ({
  zimbraAdminSoap,
  distributionLists,
  logFile,
  options,
}: {
  zimbraAdminSoap: ZimbraAdminSoap;
  distributionLists: ZimbraDistributionList[];
  logFile: string;
  options: ImportDistributionListAttributes[];
}) => {
  let zimbraDistributionLists: ZimbraDistributionList[] = [];

  try {
    const existingZimbraDistributionLists =
      await zimbraAdminSoap.getDistributionLists();

    // filter out existing distribution lists
    zimbraDistributionLists = distributionLists.filter(
      (distributionList) =>
        !existingZimbraDistributionLists.find(
          (existingDistributionList) =>
            existingDistributionList.name === distributionList.name
        )
    );
  } catch (error: any) {
    log(
      "IMPORT",
      logFile,
      "error",
      `Failed to get distribution lists: ${error.message}`
    );
  }

  for await (const distributionList of zimbraDistributionLists) {
    let createdDL: ZimbraDistributionList = {} as ZimbraDistributionList;
    try {
      createdDL = await zimbraAdminSoap.createDistributionList({
        name: distributionList.name,
        displayName: options.includes("displayName")
          ? distributionList.displayName
          : undefined,
        description: options.includes("description")
          ? distributionList.description
          : undefined,
        zimbraHideInGal: options.includes("zimbraHideInGal")
          ? distributionList.zimbraHideInGal
          : undefined,
        zimbraMailStatus: options.includes("zimbraMailStatus")
          ? distributionList.zimbraMailStatus
          : undefined,
      });

      log(
        distributionList.name,
        logFile,
        "success",
        "Distribution list has been created"
      );
    } catch (error: any) {
      log(
        distributionList.name,
        logFile,
        "error",
        `Failed to create distribution list: ${error.message}`
      );
      continue;
    }

    if (options.includes("members")) {
      if (distributionList.members.length === 0) {
        log(
          "IMPORT",
          logFile,
          "success",
          "No members to add to distribution list, skipping..."
        );
        continue;
      }
      // add members to distribution list
      try {
        await zimbraAdminSoap.addDistributionListMembers({
          dlId: createdDL.id,
          members: distributionList.members,
        });
        log(
          distributionList.name,
          logFile,
          "success",
          "Members have been added to distribution list"
        );
      } catch (error: any) {
        log(
          distributionList.name,
          logFile,
          "error",
          `Failed to add members to distribution list: ${error.message}`
        );
      }
    }

    if (options.includes("owners")) {
      const ownerAccounts: ZimbraAccount[] = [];
      for await (const owner of distributionList.owners) {
        // get account on server
        let zimbraAccount: ZimbraAccount = {} as ZimbraAccount;
        try {
          zimbraAccount = await zimbraAdminSoap.getAccountByName(owner.name);
          ownerAccounts.push(zimbraAccount);
        } catch (error: any) {
          log(
            distributionList.name,
            logFile,
            "error",
            `Failed to add ${owner.name} as owner to distribution list: ${error.message}`
          );
        }
      }

      // add owners to distribution list
      try {
        await zimbraAdminSoap.addDistributionListOwners({
          dlId: createdDL.id,
          ownerIds: ownerAccounts.map((owner) => owner.id),
        });
        log(
          distributionList.name,
          logFile,
          "success",
          "Owners have been added to distribution list"
        );
      } catch (error: any) {
        log(
          distributionList.name,
          logFile,
          "error",
          `Failed to add owners to distribution list: ${error.message}`
        );
      }
    }
  }
};

const modifyDLAction = async ({
  zimbraAdminSoap,
  distributionLists,
  logFile,
  options,
}: {
  zimbraAdminSoap: ZimbraAdminSoap;
  distributionLists: ZimbraDistributionList[];
  logFile: string;
  options: ImportDistributionListAttributes[];
}) => {
  let zimbraDistributionLists: existingDL[] = [];

  for await (const distributionList of distributionLists) {
    try {
      const zimbraDistributionList =
        await zimbraAdminSoap.getDistributionListByName(distributionList.name);

      zimbraDistributionLists.push({
        ...distributionList,
        id: zimbraDistributionList.id,
        existingMembers: zimbraDistributionList.members,
        existingOwnerIds: zimbraDistributionList.owners.map(
          (owner) => owner.id
        ),
      });
    } catch (error: any) {
      log(
        distributionList.name,
        logFile,
        "error",
        `Failed to get distribution list: ${error.message}`
      );
    }
  }
  console.log(options);
  // modify distribution lists
  for await (const distributionList of zimbraDistributionLists) {
    try {
      await zimbraAdminSoap.modifyDistributionList({
        dlId: distributionList.id,
        displayName: options.includes("displayName")
          ? distributionList.displayName
          : undefined,
        description: options.includes("description")
          ? distributionList.description
          : undefined,
        zimbraHideInGal: options.includes("zimbraHideInGal")
          ? distributionList.zimbraHideInGal
          : undefined,
        zimbraMailStatus: options.includes("zimbraMailStatus")
          ? distributionList.zimbraMailStatus
          : undefined,
      });

      log(
        distributionList.name,
        logFile,
        "success",
        "Distribution list has been modified"
      );
    } catch (error: any) {
      log(
        distributionList.name,
        logFile,
        "error",
        `Failed to modify distribution list: ${error.message}`
      );
    }
  }

  // modify members
  if (options.includes("members")) {
    for await (const distributionList of zimbraDistributionLists) {
      // if (distributionList.members.length === 0) {
      //   log(
      //     "IMPORT",
      //     logFile,
      //     "success",
      //     "No members to add to distribution list, skipping..."
      //   );
      //   continue;
      // }

      // if existing members not empty, remove them
      if (distributionList.existingMembers.length !== 0) {
        try {
          await zimbraAdminSoap.removeDistributionListMembers({
            dlId: distributionList.id,
            members: distributionList.existingMembers,
          });
        } catch (error: any) {
          log(
            distributionList.name,
            logFile,
            "error",
            `Failed to remove members from distribution list: ${error.message}`
          );
          continue;
        }
      }

      if (distributionList.members.length === 0) {
        log(
          distributionList.name,
          logFile,
          "success",
          "Members have been removed from distribution list"
        );
        continue;
      }

      try {
        await zimbraAdminSoap.addDistributionListMembers({
          dlId: distributionList.id,
          members: distributionList.members,
        });
        log(
          distributionList.name,
          logFile,
          "success",
          "Members have been added to distribution list"
        );
      } catch (error: any) {
        log(
          distributionList.name,
          logFile,
          "error",
          `Failed to add members to distribution list: ${error.message}`
        );
      }
    }
  }

  // modify owners
  if (options.includes("owners")) {
    for await (const distributionList of zimbraDistributionLists) {
      const ownerAccounts: ZimbraAccount[] = [];
      for await (const owner of distributionList.owners) {
        // get account on server
        let zimbraAccount: ZimbraAccount = {} as ZimbraAccount;
        try {
          zimbraAccount = await zimbraAdminSoap.getAccountByName(owner.name);
          ownerAccounts.push(zimbraAccount);
        } catch (error: any) {
          log(
            distributionList.name,
            logFile,
            "error",
            `Failed to add ${owner.name} as owner to distribution list: ${error.message}`
          );
        }
      }

      // remove existing owners
      try {
        await zimbraAdminSoap.removeDistributionListOwners({
          dlId: distributionList.id,
          ownerIds: distributionList.existingOwnerIds,
        });
      } catch (error: any) {
        log(
          distributionList.name,
          logFile,
          "error",
          `Failed to remove owners from distribution list: ${error.message}`
        );
        continue;
      }

      // add owners to distribution list
      try {
        await zimbraAdminSoap.addDistributionListOwners({
          dlId: distributionList.id,
          ownerIds: ownerAccounts.map((owner) => owner.id),
        });
        log(
          distributionList.name,
          logFile,
          "success",
          "Owners have been added to distribution list"
        );
      } catch (error: any) {
        log(
          distributionList.name,
          logFile,
          "error",
          `Failed to add owners to distribution list: ${error.message}`
        );
      }
    }
  }
};

const importDistributionListsSequential = async ({
  importZimbraURL,
  importZimbraToken,
  action,
  options,
}: importDistributionListsSequentialOptions) => {
  //   read array of accounts from json file
  const distributionLists: ZimbraDistributionList[] = JSON.parse(
    fs.readFileSync("./distribution-lists.json", "utf8")
  );

  const logFile = `import-dl-${moment().format("YYYY-MM-DD-HH-mm-ss")}.log`;

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
    `Found ${distributionLists.length} distribution lists in distribution-lists.json`
  );

  const zimbraAdminSoap = new ZimbraAdminSoap(
    importZimbraURL,
    importZimbraToken
  );

  if (action === "modifyDL") {
    await modifyDLAction({
      zimbraAdminSoap,
      distributionLists,
      logFile,
      options,
    });
  } else if (action === "createDL") {
    await createDLAction({
      zimbraAdminSoap,
      distributionLists,
      logFile,
      options,
    });
  }

  log("IMPORT", logFile, "info", "All distribution lists have been imported");
};

export default importDistributionListsSequential;
