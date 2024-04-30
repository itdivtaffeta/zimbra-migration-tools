import axios from "axios";
import https from "https";
import { Cheerio, CheerioAPI, Element, load } from "cheerio";
import { ZimbraAccount, ZimbraDistributionList } from "../types/zimbra";
import { ImportAttributes } from "../types/attribute";
import { escapeXml } from "./util";

// disable SSL verification
axios.defaults.httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

class ZimbraAdminSoap {
  zimbraURL: string;
  zimbraToken: string;

  constructor(zimbraURL: string, zimbraToken: string) {
    this.zimbraURL = zimbraURL;
    this.zimbraToken = zimbraToken;
  }

  private generateAttributesXML(options: ImportAttributes) {
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
      status,
      displayName,
      zimbraId,
      company,
      street,
      state,
      country,
      postalCode,
      title,
      city,
    } = options;

    const zimbraIdXML = zimbraId
      ? `<a n="zimbraId">${escapeXml(zimbraId)}</a>`
      : "";

    const displayNameXML = displayName
      ? `<a n="displayName">${escapeXml(displayName)}</a>`
      : "";

    const forwardingAddressesXml = forwardingAddresses
      ? `<a n="zimbraPrefMailForwardingAddress">${escapeXml(
          forwardingAddresses
        )}</a>`
      : "";

    const hiddenForwardingAddressesXml = hiddenForwardingAddresses
      ? hiddenForwardingAddresses
          .map(
            (address) =>
              `<a n="zimbraMailForwardingAddress">${escapeXml(address)}</a>`
          )
          .join("")
      : "";

    const firstNameXml = firstName
      ? `<a n="givenName">${escapeXml(firstName)}</a>`
      : "";
    const middleNameXml = middleName
      ? `<a n="initials">${escapeXml(middleName)}</a>`
      : "";
    const lastNameXml = lastName ? `<a n="sn">${escapeXml(lastName)}</a>` : "";
    const notesXml = notes ? `<a n="zimbraNotes">${escapeXml(notes)}</a>` : "";
    const quotaXml = quota
      ? `<a n="zimbraMailQuota">${escapeXml(quota)}</a>`
      : "";
    const descriptionXml = description
      ? `<a n="description">${escapeXml(description)}</a>`
      : "";
    const incomingFilterXml = incomingFilter
      ? `<a n="zimbraMailSieveScript">${escapeXml(incomingFilter)}</a>`
      : "";
    const outgoingFilterXml = outgoingFilter
      ? `<a n="zimbraMailOutgoingSieveScript">${escapeXml(outgoingFilter)}</a>`
      : "";
    const zimbraAuthLdapExternalDnXml = zimbraAuthLdapExternalDn
      ? `<a n="zimbraAuthLdapExternalDn">${escapeXml(
          zimbraAuthLdapExternalDn
        )}</a>`
      : "";
    const statusXml = status
      ? `<a n="zimbraAccountStatus">${escapeXml(status)}</a>`
      : "";

    const companyXml = company
      ? `<a n="company">${escapeXml(company)}</a>`
      : "";

    const titleXml = title ? `<a n="title">${escapeXml(title)}</a>` : "";
    const streetXml = street ? `<a n="street">${escapeXml(street)}</a>` : "";
    const cityXml = city ? `<a n="l">${escapeXml(city)}</a>` : "";
    const stateXml = state ? `<a n="st">${escapeXml(state)}</a>` : "";
    const countryXml = country ? `<a n="co">${escapeXml(country)}</a>` : "";
    const postalCodeXml = postalCode
      ? `<a n="postalCode">${escapeXml(postalCode)}</a>`
      : "";

    return `
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
      ${statusXml}
      ${displayNameXML}
      ${zimbraIdXML}
      ${companyXml}
      ${titleXml}
      ${streetXml}
      ${cityXml}
      ${stateXml}
      ${countryXml}
      ${postalCodeXml}
      `;
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

  async delegateAuth(account: string) {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <format type="xml"/>
                <authToken>${this.zimbraToken}</authToken>
                <session/>
                <userAgent name="zclient"/>
            </context>
        </soap:Header>
        <soap:Body>
            <DelegateAuthRequest xmlns="urn:zimbraAdmin">
                <account by="name">${account}</account>
            </DelegateAuthRequest>
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

        const aliases: string[] = [];

        $el.find("a[n='zimbraMailAlias']").each((index, el) => {
          const $el = $(el);
          aliases.push($el.text());
        });

        accounts.push({
          id: $el.attr("id")!,
          name: $el.attr("name")!,
          status: $el.find("a[n='zimbraAccountStatus']").text(),
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
          aliases,
          company: $el.find("a[n='company']").text(),
          title: $el.find("a[n='title']").text(),
          street: $el.find("a[n='street']").text(),
          city: $el.find("a[n='l']").text(),
          state: $el.find("a[n='st']").text(),
          postalCode: $el.find("a[n='postalCode']").text(),
          country: $el.find("a[n='co']").text(),
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

      const aliases: string[] = [];

      $("a[n='zimbraMailAlias']").each((index, el) => {
        const $el = $(el);
        aliases.push($el.text());
      });

      const account: ZimbraAccount = {
        id: $("account").attr("id")!,
        name: $("account").attr("name")!,
        status: $("a[n='zimbraAccountStatus']").text(),
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
        aliases,
        company: $("a[n='company']").text(),
        title: $("a[n='title']").text(),
        street: $("a[n='street']").text(),
        city: $("a[n='l']").text(),
        state: $("a[n='st']").text(),
        postalCode: $("a[n='postalCode']").text(),
        country: $("a[n='co']").text(),
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
            ${this.generateAttributesXML(options)}
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
            ${this.generateAttributesXML(options)}
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

  async addAccountAlias({
    accountId,
    alias,
  }: {
    accountId: string;
    alias: string;
  }) {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <authToken>${this.zimbraToken}</authToken>
            </context>
        </soap:Header>
        <soap:Body>
          <AddAccountAliasRequest id="${accountId}" alias="${alias}" xmlns="urn:zimbraAdmin"/>
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

  async getDistributionLists() {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <authToken>${this.zimbraToken}</authToken>
            </context>
        </soap:Header>
        <soap:Body>
        <GetAllDistributionListsRequest xmlns="urn:zimbraAdmin"/>
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

      const distributionLists: ZimbraDistributionList[] = [];

      $("dl").each((index, el) => {
        const $el = $(el);

        // distribution list members
        const members: string[] = [];
        $el.find("dlm").each((index, el) => {
          const $el = $(el);
          members.push($el.text());
        });

        // distribution list owners
        const owners: ZimbraDistributionList["owners"] = [];
        $el.find("owner").each((index, el) => {
          const $el = $(el);
          owners.push({
            id: $el.attr("id")!,
            name: $el.attr("name")!,
          });
        });

        const dl: ZimbraDistributionList = {
          id: $el.attr("id")!,
          name: $el.attr("name")!,
          displayName: $el.find("a[n='displayName']").text(),
          zimbraHideInGal: $el.find("a[n='zimbraHideInGal']").text() === "TRUE",
          zimbraMailStatus: $el.find("a[n='zimbraMailStatus']").text(),
          members,
          owners,
        };

        distributionLists.push(dl);
      });

      return distributionLists;
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

  async getDistributionListByName(name: string) {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <authToken>${this.zimbraToken}</authToken>
            </context>
        </soap:Header>
        <soap:Body>
        <GetDistributionListRequest xmlns="urn:zimbraAdmin">
          <dl by="name">${name}</dl>
        </GetDistributionListRequest>
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

      // distribution list members
      const members: string[] = [];
      $("dlm").each((index, el) => {
        const $el = $(el);
        members.push($el.text());
      });

      // distribution list owners
      const owners: ZimbraDistributionList["owners"] = [];
      $("owner").each((index, el) => {
        const $el = $(el);
        owners.push({
          id: $el.attr("id")!,
          name: $el.attr("name")!,
        });
      });

      const dl: ZimbraDistributionList = {
        id: $("dl").attr("id")!,
        name: $("dl").attr("name")!,
        displayName: $("a[n='displayName']").text(),
        zimbraHideInGal: $("a[n='zimbraHideInGal']").text() === "TRUE",
        zimbraMailStatus: $("a[n='zimbraMailStatus']").text(),
        members,
        owners,
      };

      return dl;
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

  async createDistributionList({
    name,
    zimbraId,
    displayName,
    zimbraMailStatus,
    zimbraHideInGal,
  }: {
    name: string;
    zimbraId?: string;
    displayName?: string;
    zimbraMailStatus?: string;
    zimbraHideInGal?: boolean;
  }) {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <authToken>${this.zimbraToken}</authToken>
            </context>
        </soap:Header>
        <soap:Body>
          <CreateDistributionListRequest xmlns="urn:zimbraAdmin" name="${name}">
            ${zimbraId && `<a n="zimbraId">${zimbraId}</a>`}
            ${displayName && `<a n="displayName">${escapeXml(displayName)}</a>`}
            ${
              zimbraMailStatus &&
              `<a n="zimbraMailStatus">${zimbraMailStatus}</a>`
            }
            ${
              zimbraHideInGal !== undefined &&
              `<a n="zimbraHideInGal">${zimbraHideInGal ? "TRUE" : "FALSE"}</a>`
            }
          </CreateDistributionListRequest>
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

      // distribution list members
      const members: string[] = [];
      $("dlm").each((index, el) => {
        const $el = $(el);
        members.push($el.text());
      });

      // distribution list owners
      const owners: ZimbraDistributionList["owners"] = [];
      $("owner").each((index, el) => {
        const $el = $(el);
        owners.push({
          id: $el.attr("id")!,
          name: $el.attr("name")!,
        });
      });

      const dl: ZimbraDistributionList = {
        id: $("dl").attr("id")!,
        name: $("dl").attr("name")!,
        displayName: $("a[n='displayName']").text(),
        zimbraHideInGal: $("a[n='zimbraHideInGal']").text() === "TRUE",
        zimbraMailStatus: $("a[n='zimbraMailStatus']").text(),
        members,
        owners,
      };

      return dl;
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

  async addDistributionListMembers({
    dlId,
    members,
  }: {
    dlId: string;
    members: string[];
  }) {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <authToken>${this.zimbraToken}</authToken>
            </context>
        </soap:Header>
        <soap:Body>
          <AddDistributionListMemberRequest id="${dlId}" xmlns="urn:zimbraAdmin">
            ${members.map((member) => `<dlm>${member}</dlm>`).join("")}
          </AddDistributionListMemberRequest>
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

  async addDistributionListOwners({
    dlId,
    ownerIds,
  }: {
    dlId: string;
    ownerIds: string[];
  }) {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <authToken>${this.zimbraToken}</authToken>
            </context>
        </soap:Header>
        <soap:Body>
          <ModifyDistributionListRequest id="${dlId}" xmlns="urn:zimbraAdmin">
            ${ownerIds
              .map((id) => `<a n="+zimbraACE">${id} usr ownDistList</a>`)
              .join("")}
          </ModifyDistributionListRequest>
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

  async removeDistributionListMembers({
    dlId,
    members,
  }: {
    dlId: string;
    members: string[];
  }) {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <authToken>${this.zimbraToken}</authToken>
            </context>
        </soap:Header>
        <soap:Body>
          <RemoveDistributionListMemberRequest id="${dlId}" xmlns="urn:zimbraAdmin">
            ${members.map((member) => `<dlm>${member}</dlm>`).join("")}
          </RemoveDistributionListMemberRequest>
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

  async removeDistributionListOwners({
    dlId,
    ownerIds,
  }: {
    dlId: string;
    ownerIds: string[];
  }) {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <authToken>${this.zimbraToken}</authToken>
            </context>
        </soap:Header>
        <soap:Body>
          <ModifyDistributionListRequest id="${dlId}" xmlns="urn:zimbraAdmin">
            ${ownerIds
              .map((id) => `<a n="-zimbraACE">${id} usr ownDistList</a>`)
              .join("")}
          </ModifyDistributionListRequest>
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

  async modifyDistributionList({
    dlId,
    displayName,
    zimbraHideInGal,
    zimbraMailStatus,
  }: {
    dlId: string;
    displayName?: string;
    zimbraHideInGal?: boolean;
    zimbraMailStatus?: string;
  }) {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
    <soap:Header>
        <context xmlns="urn:zimbra">
            <authToken>${this.zimbraToken}</authToken>
        </context>
    </soap:Header>
    <soap:Body>
      <ModifyDistributionListRequest id="${dlId}" xmlns="urn:zimbraAdmin">
        ${displayName && `<a n="displayName">${escapeXml(displayName)}</a>`}
        ${
          zimbraHideInGal !== undefined &&
          `<a n="zimbraHideInGal">${zimbraHideInGal ? "TRUE" : "FALSE"}</a>`
        }
        ${zimbraMailStatus && `<a n="zimbraMailStatus">${zimbraMailStatus}</a>`}
      </ModifyDistributionListRequest>
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

export default ZimbraAdminSoap;
