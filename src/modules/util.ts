import { ImportAttributes } from "../types/attribute";
import { ZimbraAccount } from "../types/zimbra";

export const generateImportAccountAttributes = (
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

    if (option === "status") {
      acc.status = account.status;
    }

    if (option === "aliases") {
      acc.aliases = account.aliases;
    }

    if (option === "sharedFolders") {
      acc.folders = account.folders;
      acc.folderLinks = account.folderLinks;
    }

    if (option === "zimbraId") {
      acc.zimbraId = account.id;
    }

    if (option === "company") {
      acc.company = account.company;
      acc.title = account.title;
    }

    if (option === "address") {
      acc.street = account.street;
      acc.city = account.city;
      acc.state = account.state;
      acc.postalCode = account.postalCode;
      acc.country = account.country;
    }

    return acc;
  }, {});

  return attributes;
};

export function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}
