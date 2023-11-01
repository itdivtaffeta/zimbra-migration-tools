import { ZimbraAccount, ZimbraFolderLink } from "../../types/zimbra";
import ZimbraAdminSoap from "../zimbraAdmin";
import config from "../../config";
import ZimbraUserSoap from "../zimbraUser";

const createMountPoint = async ({
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

  const { links: targetLinks } = await zimbraUserSoap.getFolders();

  const deleteLinks =
    account.folderLinks?.map((link) => {
      const targetLink = targetLinks.find((target: ZimbraFolderLink) => {
        return target.path === link.path && target.broken === true;
      });

      if (!targetLink) return;

      return targetLink;
    }) || [];

  //   delete links that are not in the user's folder list
  await Promise.all(
    deleteLinks.map((link) => {
      if (!link) return;

      return zimbraUserSoap.deleteFolder(link.id);
    })
  );

  // filter links that are already in the user's folder list but if broken is true create mount point
  const filteredLinks =
    account.folderLinks?.filter((link) => {
      const targetLink = targetLinks.find((target: ZimbraFolderLink) => {
        return target.path === link.path;
      });

      if (!targetLink) return true;
      if (targetLink.broken === true) return true;
      return false;
    }) || [];

  //   create mount points
  await Promise.all(
    filteredLinks.map((link) => {
      return zimbraUserSoap.createMountPoint(
        link.name,
        link.owner!,
        link.ownerPath!,
        link.view!,
        link.parentFolderId!
      );
    })
  );
};

export default createMountPoint;
