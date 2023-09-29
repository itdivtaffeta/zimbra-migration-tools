import axios from "axios";
import https from "https";
import { load } from "cheerio";
import fs from "fs";
import { ZimbraAccount } from "../types/zimbra";
import { ImportAttributes } from "../types/attribute";

// disable SSL verification
axios.defaults.httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

class ZimbraSoap {
  zimbraURL: string;
  zimbraToken: string;

  constructor(zimbraURL: string, zimbraToken: string) {
    this.zimbraURL = zimbraURL;
    this.zimbraToken = zimbraToken;
  }

  static async getAdminToken(
    zimbraAdminUrl: string,
    zimbraAdminUser: string,
    zimbraAdminPassword: string
  ) {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <format type="xml"/>
                <authToken/>
                <session/>
                <userAgent name="zclient"/>
            </context>
        </soap:Header>
        <soap:Body>
            <AuthRequest xmlns="urn:zimbraAdmin">
                <name>${zimbraAdminUser}</name>
                <password>${zimbraAdminPassword}</password>
            </AuthRequest>
        </soap:Body>
    </soap:Envelope>`;

    try {
      const { data } = await axios.post(zimbraAdminUrl, xml, {
        headers: {
          "Content-Type": "application/soap+xml",
        },
      });

      const $ = load(data, {
        xmlMode: true,
      });

      const authToken = $("authToken").text();

      return authToken;
    } catch (error: any) {
      if (!error.response) throw error;

      const $ = load(error.response.data, {
        xmlMode: true,
      });

      const reason = $("soap\\:Fault soap\\:Reason soap\\:Text").text();

      if (!reason) throw error;

      throw new Error(reason);
    }
  }

  async getAllAccounts() {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <authToken>${this.zimbraToken}</authToken>
            </context>
        </soap:Header>
        <soap:Body>
        <GetAllAccountsRequest xmlns="urn:zimbraAdmin"/>
        </soap:Body>
    </soap:Envelope>`;

    try {
      const { data } = await axios.post(this.zimbraURL, xml, {
        headers: {
          "Content-Type": "application/soap+xml",
        },
      });

      const $ = load(data, {
        xmlMode: true,
      });

      const accounts: ZimbraAccount[] = [];

      $("account").each((index, el) => {
        const $el = $(el);

        const isSystemAccount =
          $el.find("a[n='zimbraIsSystemResource']").text() === "TRUE";

        if (isSystemAccount) return;

        const hiddenForwardingAddresses: string[] = [];

        $el.find("a[n='zimbraMailForwardingAddress']").each((index, el) => {
          const $el = $(el);
          hiddenForwardingAddresses.push($el.text());
        });

        accounts.push({
          id: $el.attr("id")!,
          name: $el.attr("name")!,
          displayName: $el.find("a[n='displayName']").text(),
          firstName: $el.find("a[n='givenName']").text(),
          lastName: $el.find("a[n='sn']").text(),
          middleName: $el.find("a[n='initials']").text(),
          description: $el.find("a[n='description']").text(),
          quota: $el.find("a[n='zimbraMailQuota']").text(),
          notes: $el.find("a[n='zimbraNotes']").text(),
          hiddenForwardingAddresses,
          forwardingAddresses: $el
            .find("a[n='zimbraPrefMailForwardingAddress']")
            .text(),
          incomingFilter: $el.find("a[n='zimbraMailSieveScript']").text(),
          outgoingFilter: $el
            .find("a[n='zimbraMailOutgoingSieveScript']")
            .text(),
          zimbraAuthLdapExternalDn: $el
            .find("a[n='zimbraAuthLdapExternalDn']")
            .text(),
        });
      });

      return accounts;
    } catch (error: any) {
      if (!error.response) throw error;

      const $ = load(error.response.data, {
        xmlMode: true,
      });

      const reason = $("soap\\:Fault soap\\:Reason soap\\:Text").text();

      if (!reason) throw error;

      throw new Error(reason);
    }
  }

  async getAccountByName(account: string) {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <authToken>${this.zimbraToken}</authToken>
            </context>
        </soap:Header>
        <soap:Body>
        <GetAccountRequest effectiveQuota="0" applyCos="1" xmlns="urn:zimbraAdmin">
          <account by="name">${account}</account>
        </GetAccountRequest>
  
        </soap:Body>
    </soap:Envelope>`;

    try {
      const { data } = await axios.post(this.zimbraURL, xml, {
        headers: {
          "Content-Type": "application/soap+xml",
        },
      });

      const $ = load(data, {
        xmlMode: true,
      });

      const hiddenForwardingAddresses: string[] = [];

      $("a[n='zimbraMailForwardingAddress']").each((index, el) => {
        const $el = $(el);
        hiddenForwardingAddresses.push($el.text());
      });

      const account: ZimbraAccount = {
        id: $("account").attr("id")!,
        name: $("account").attr("name")!,
        displayName: $("a[n='displayName']").text(),
        firstName: $("a[n='givenName']").text(),
        lastName: $("a[n='sn']").text(),
        middleName: $("a[n='initials']").text(),
        description: $("a[n='description']").text(),
        quota: $("a[n='zimbraMailQuota']").text(),
        notes: $("a[n='zimbraNotes']").text(),
        hiddenForwardingAddresses,
        forwardingAddresses: $("a[n='zimbraPrefMailForwardingAddress']").text(),
        incomingFilter: $("a[n='zimbraMailSieveScript']").text(),
        outgoingFilter: $("a[n='zimbraMailOutgoingSieveScript']").text(),
        zimbraAuthLdapExternalDn: $("a[n='zimbraAuthLdapExternalDn']").text(),
      };

      return account;
    } catch (error: any) {
      if (!error.response) throw error;

      const $ = load(error.response.data, {
        xmlMode: true,
      });

      const reason = $("soap\\:Fault soap\\:Reason soap\\:Text").text();

      if (!reason) throw error;

      throw new Error(reason);
    }
  }

  async modifyAccount({
    accountId,
    options = {},
  }: {
    accountId: string;
    options?: ImportAttributes;
  }) {
    const {
      forwardingAddresses,
      hiddenForwardingAddresses,
      firstName,
      middleName,
      lastName,
      notes,
      quota,
      description,
      incomingFilter,
      outgoingFilter,
      zimbraAuthLdapExternalDn,
    } = options;

    const forwardingAddressesXml = forwardingAddresses
      ? `<a n="zimbraPrefMailForwardingAddress">${forwardingAddresses}</a>`
      : "";

    const hiddenForwardingAddressesXml = hiddenForwardingAddresses
      ? hiddenForwardingAddresses
          .map((address) => `<a n="zimbraMailForwardingAddress">${address}</a>`)
          .join("")
      : "";

    const firstNameXml = firstName ? `<a n="givenName">${firstName}</a>` : "";
    const middleNameXml = middleName ? `<a n="initials">${middleName}</a>` : "";
    const lastNameXml = lastName ? `<a n="sn">${lastName}</a>` : "";
    const notesXml = notes ? `<a n="zimbraNotes">${notes}</a>` : "";
    const quotaXml = quota ? `<a n="zimbraMailQuota">${quota}</a>` : "";
    const descriptionXml = description
      ? `<a n="description">${description}</a>`
      : "";
    const incomingFilterXml = incomingFilter
      ? `<a n="zimbraMailSieveScript">${incomingFilter}</a>`
      : "";
    const outgoingFilterXml = outgoingFilter
      ? `<a n="zimbraMailOutgoingSieveScript">${outgoingFilter}</a>`
      : "";
    const zimbraAuthLdapExternalDnXml = zimbraAuthLdapExternalDn
      ? `<a n="zimbraAuthLdapExternalDn">${zimbraAuthLdapExternalDn}</a>`
      : "";

    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <authToken>${this.zimbraToken}</authToken>
            </context>
        </soap:Header>
        <soap:Body>
          <ModifyAccountRequest xmlns="urn:zimbraAdmin">
            <id>${accountId}</id>
            ${forwardingAddressesXml}
            ${hiddenForwardingAddressesXml}
            ${firstNameXml}
            ${middleNameXml}
            ${lastNameXml}
            ${notesXml}
            ${quotaXml}
            ${descriptionXml}
            ${incomingFilterXml}
            ${outgoingFilterXml}
            ${zimbraAuthLdapExternalDnXml}
          </ModifyAccountRequest>
        </soap:Body>
    </soap:Envelope>`;

    try {
      const { data } = await axios.post(this.zimbraURL, xml, {
        headers: {
          "Content-Type": "application/soap+xml",
        },
      });

      return data;
    } catch (error: any) {
      if (!error.response) throw error;

      const $ = load(error.response.data, {
        xmlMode: true,
      });

      const reason = $("soap\\:Fault soap\\:Reason soap\\:Text").text();

      if (!reason) throw error;

      throw new Error(reason);
    }
  }

  async createAccount({
    name,
    options = {},
  }: {
    name: string;
    options?: ImportAttributes;
  }) {
    const {
      forwardingAddresses,
      hiddenForwardingAddresses,
      firstName,
      middleName,
      lastName,
      notes,
      quota,
      description,
      incomingFilter,
      outgoingFilter,
      zimbraAuthLdapExternalDn,
    } = options;

    const forwardingAddressesXml = forwardingAddresses
      ? `<a n="zimbraPrefMailForwardingAddress">${forwardingAddresses}</a>`
      : "";

    const hiddenForwardingAddressesXml = hiddenForwardingAddresses
      ? hiddenForwardingAddresses
          .map((address) => `<a n="zimbraMailForwardingAddress">${address}</a>`)
          .join("")
      : "";

    const firstNameXml = firstName ? `<a n="givenName">${firstName}</a>` : "";
    const middleNameXml = middleName ? `<a n="initials">${middleName}</a>` : "";
    const lastNameXml = lastName ? `<a n="sn">${lastName}</a>` : "";
    const notesXml = notes ? `<a n="zimbraNotes">${notes}</a>` : "";
    const quotaXml = quota ? `<a n="zimbraMailQuota">${quota}</a>` : "";
    const descriptionXml = description
      ? `<a n="description">${description}</a>`
      : "";
    const incomingFilterXml = incomingFilter
      ? `<a n="zimbraMailSieveScript">${incomingFilter}</a>`
      : "";
    const outgoingFilterXml = outgoingFilter
      ? `<a n="zimbraMailOutgoingSieveScript">${outgoingFilter}</a>`
      : "";
    const zimbraAuthLdapExternalDnXml = zimbraAuthLdapExternalDn
      ? `<a n="zimbraAuthLdapExternalDn">${zimbraAuthLdapExternalDn}</a>`
      : "";

    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <authToken>${this.zimbraToken}</authToken>
            </context>
        </soap:Header>
        <soap:Body>
          <CreateAccountRequest xmlns="urn:zimbraAdmin">
            <name>${name}</name>
            ${forwardingAddressesXml}
            ${hiddenForwardingAddressesXml}
            ${firstNameXml}
            ${middleNameXml}
            ${lastNameXml}
            ${notesXml}
            ${quotaXml}
            ${descriptionXml}
            ${incomingFilterXml}
            ${outgoingFilterXml}
            ${zimbraAuthLdapExternalDnXml}
          </CreateAccountRequest>
        </soap:Body>
    </soap:Envelope>`;

    try {
      const { data } = await axios.post(this.zimbraURL, xml, {
        headers: {
          "Content-Type": "application/soap+xml",
        },
      });

      return data;
    } catch (error: any) {
      if (!error.response) throw error;

      const $ = load(error.response.data, {
        xmlMode: true,
      });

      const reason = $("soap\\:Fault soap\\:Reason soap\\:Text").text();

      if (!reason) throw error;

      throw new Error(reason);
    }
  }
}

export default ZimbraSoap;
