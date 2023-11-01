import { ZimbraFolder, ZimbraFolderLink } from "./zimbra";

export interface ImportAttributes {
  zimbraId?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  middleName?: string;
  displayName?: string;
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
