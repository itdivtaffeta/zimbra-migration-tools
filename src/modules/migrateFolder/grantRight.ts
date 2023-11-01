import { ZimbraAccount } from "../../types/zimbra";
import ZimbraAdminSoap from "../zimbraAdmin";
import ZimbraUserSoap from "../zimbraUser";
import config from "../../config";

const grantRight = async ({
  account,
  zimbraAdminSoap,
}: {
  account: ZimbraAccount;
  zimbraAdminSoap: ZimbraAdminSoap;
}) => {
  const zimbraUserToken = await zimbraAdminSoap.delegateAuth(account.name);

  const zimbraUserSoap = new ZimbraUserSoap(
    config.import.userUrl,
    zimbraUserToken
  );

  const { folders: targetFolders } = await zimbraUserSoap.getFolders();

  const targetFolderList =
    account.folders?.map((folder) => {
      const targetFolder = targetFolders.find(
        (targetFolder) => targetFolder.path === folder.path
      );

      if (!targetFolder) {
        throw new Error(`Folder '${folder.path}' not found in target account`);
      }

      // delete grants if already exists in user's folder
      const grants = folder.grants.filter((grant) => {
        const index = targetFolder.grants.findIndex(
          (userGrant) =>
            userGrant.d === grant.d &&
            userGrant.perm === grant.perm &&
            userGrant.gt === grant.gt
        );

        if (index === -1) return true;
        return false;
      });

      return {
        id: targetFolder.id,
        name: targetFolder.name,
        grants,
      };
    }) || [];

  await Promise.all(
    targetFolderList.map(async (folder) => {
      const { id, grants } = folder;
      await Promise.allSettled(
        grants.map((grant) =>
          zimbraUserSoap.grantFolderPermission(
            id,
            grant.d,
            grant.perm,
            grant.gt
          )
        )
      );
    })
  );
};

export default grantRight;
