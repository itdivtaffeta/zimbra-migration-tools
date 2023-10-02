interface ZimbraFolderGrant {
  d: string;
  gt: string;
  perm: string;
}

export interface ZimbraAccount {
  id: string;
  name: string;
  status: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  description?: string;
  quota?: string;
  notes?: string;
  forwardingAddresses?: string;
  incomingFilter?: string;
  outgoingFilter?: string;
  zimbraAuthLdapExternalDn?: string;
  hiddenForwardingAddresses?: string[];
  aliases?: string[];
  folders?: ZimbraFolder[];
  folderLinks?: ZimbraFolderLink[];
}

export interface ZimbraFolder {
  id: string;
  name: string;
  path: string;
  view: string;
  grants: ZimbraFolderGrant[];
}

export interface ZimbraFolderLink {
  id: string;
  name: string;
  path: string;
  broken: boolean;
  view?: string;
  permission?: string;
  owner?: string;
  rest?: string;
  parentFolderId?: string;
  ownerPath?: string;
}
