import log from "../../modules/logging";
import ZimbraAdminSoap from "../../modules/zimbraAdmin";
import fs from "fs";
import moment from "moment";

const exportDistributionListsSequential = async (
  zimbraURL: string,
  zimbraToken: string
): Promise<void> => {
  const logFile = `export-dl-${moment().format("YYYY-MM-DD-HH-mm-ss")}.log`;

  const zimbraAdminSoap = new ZimbraAdminSoap(zimbraURL, zimbraToken);

  //   get all distribution lists
  const distributionLists = await zimbraAdminSoap.getDistributionLists();

  log(
    "EXPORT",
    logFile,
    "info",
    `Found ${distributionLists.length} distribution lists`
  );

  fs.writeFileSync(
    "distribution-lists.json",
    JSON.stringify(distributionLists, null, 2)
  );
  log(
    "Distribution Lists",
    logFile,
    "info",
    "All distribution lists have been exported"
  );
};

export default exportDistributionListsSequential;
