export interface ZimbraAccount {
  id: string;
  name: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  description?: string;
  quota?: string;
  notes?: string;
  hiddenForwardingAddresses?: string[];
  forwardingAddresses?: string;
  incomingFilter?: string;
  outgoingFilter?: string;
  zimbraAuthLdapExternalDn?: string;
}
