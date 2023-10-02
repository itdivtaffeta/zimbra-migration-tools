import axios from "axios";
import https from "https";
import { load } from "cheerio";
import { ZimbraFolder, ZimbraFolderLink } from "../types/zimbra";

// disable SSL verification
axios.defaults.httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

class ZimbraUserSoap {
  zimbraURL: string;
  zimbraToken: string;

  constructor(zimbraURL: string, zimbraToken: string) {
    this.zimbraURL = zimbraURL;
    this.zimbraToken = zimbraToken;
  }

  async getFolders() {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <authToken>${this.zimbraToken}</authToken>
            </context>
        </soap:Header>
        <soap:Body>
            <GetFolderRequest xmlns="urn:zimbraMail" tr="1" />
        </soap:Body>
    </soap:Envelope>`;

    try {
      const { data } = await axios.post(this.zimbraURL, xml, {
        headers: {
          "Content-Type": "application/soap+xml",
          Cookie: `ZM_AUTH_TOKEN=${this.zimbraToken}`,
        },
      });

      const $ = load(data, {
        xmlMode: true,
      });

      const folders: ZimbraFolder[] = [];
      const links: ZimbraFolderLink[] = [];

      $("folder").each((i, el) => {
        folders.push({
          id: $(el).attr("id")!,
          name: $(el).attr("name")!,
          view: $(el).attr("view")!,
          path: $(el).attr("absFolderPath")!,
          grants: $(el)
            .find("grant")
            .map((i, element) => {
              if ($(el).attr("name") === "USER_ROOT") return;

              return {
                d: $(element).attr("d")!,
                gt: $(element).attr("gt")!,
                perm: $(element).attr("perm")!,
              };
            })
            .get(),
        });
      });

      $("link").each((i, el) => {
        if ($(el).attr("broken") === "1") {
          links.push({
            id: $(el).attr("id")!,
            name: $(el).attr("name")!,
            path: $(el).attr("absFolderPath")!,
            broken: true,
          });

          return;
        }

        links.push({
          id: $(el).attr("id")!,
          name: $(el).attr("name")!,
          view: $(el).attr("view"),
          permission: $(el).attr("perm"),
          owner: $(el).attr("owner"),
          rest: $(el).attr("rest"),
          path: $(el).attr("absFolderPath")!,
          parentFolderId: $(el).attr("l"),
          ownerPath: decodeURIComponent(
            $(el).attr("rest")?.split($(el).attr("owner")!)[1]!
          ),
          broken: false,
        });
      });

      return {
        folders,
        links,
      };
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

  async grantFolderPermission(
    folderId: string,
    zimbraUser: string,
    permission: string,
    granteeType: string
  ) {
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
            <FolderActionRequest xmlns="urn:zimbraMail">
                <action id="${folderId}" op="grant">
                    <grant d="${zimbraUser}" gt="${granteeType}" perm="${permission}"/>
                </action>
            </FolderActionRequest>
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

  async deleteFolder(folderId: string) {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <authToken>${this.zimbraToken}</authToken>
            </context>
        </soap:Header>
        <soap:Body>
            <FolderActionRequest xmlns="urn:zimbraMail">
                <action id="${folderId}" op="delete"/>
            </FolderActionRequest>
        </soap:Body>
    </soap:Envelope>`;

    try {
      const { data } = await axios.post(this.zimbraURL, xml, {
        headers: {
          "Content-Type": "application/soap+xml",
          Cookie: `ZM_AUTH_TOKEN=${this.zimbraToken}`,
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

  async createMountPoint(
    mountPointName: string,
    owner: string,
    path: string,
    view: string,
    parentFolderId: string
  ) {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
        <soap:Header>
            <context xmlns="urn:zimbra">
                <authToken>${this.zimbraToken}</authToken>
            </context>
        </soap:Header>
        <soap:Body>
            <CreateMountpointRequest xmlns="urn:zimbraMail">
                <link name="${mountPointName}" l="${parentFolderId}" owner="${owner}" path="${path}" view="${view}" reminder="0" />
            </CreateMountpointRequest>
        </soap:Body>
    </soap:Envelope>`;

    try {
      const { data } = await axios.post(this.zimbraURL, xml, {
        headers: {
          "Content-Type": "application/soap+xml",
          Cookie: `ZM_AUTH_TOKEN=${this.zimbraToken}`,
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

export default ZimbraUserSoap;
