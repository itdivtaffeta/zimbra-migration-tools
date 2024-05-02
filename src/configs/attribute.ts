export type ImportDistributionListAttributes =
  (typeof importDistributionListAttributeOptions)[number]["value"];

export const importAccountAttributeOptions = [
  {
    name: "Zimbra ID",
    value: "zimbraId",
  },
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
  {
    name: "Company",
    value: "company",
  },
  {
    name: "Address",
    value: "address",
  },
];

export const exportAccountAttributeOptions = [
  {
    name: "Shared Folders",
    value: "sharedFolders",
  },
];

export const importDistributionListAttributeOptions = [
  {
    name: "Zimbra ID",
    value: "zimbraId",
  },
  {
    name: "Name",
    value: "name",
  },
  {
    name: "Display Name",
    value: "displayName",
  },
  {
    name: "Can receive email status",
    value: "zimbraMailStatus",
  },
  {
    name: "Hide in GAL",
    value: "zimbraHideInGal",
  },
  {
    name: "Members",
    value: "members",
  },
  {
    name: "Owners",
    value: "owners",
  },
  {
    name: "Description",
    value: "description",
  },
] as const;
