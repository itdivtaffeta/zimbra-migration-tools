export interface ImportAttributes {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  displayName?: string;
  description?: string;
  quota?: string;
  notes?: string;
  forwardingAddresses?: string;
  hiddenForwardingAddresses?: string[];
  incomingFilter?: string;
  outgoingFilter?: string;
  zimbraAuthLdapExternalDn?: string;
}
