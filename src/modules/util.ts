import { ImportAttributes } from "../types/attribute";
import { ZimbraAccount } from "../types/zimbra";

export const generateImportAttributes = (
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

    return acc;
  }, {});

  return attributes;
};

export const attributeOptions = [
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
    name: "Status",
    value: "status",
  },
  {
    name: "Aliases",
    value: "aliases",
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
  {
    name: "Shared Folders",
    value: "sharedFolders",
  },
];
