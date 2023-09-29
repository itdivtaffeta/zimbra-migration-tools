"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const moment_1 = __importDefault(require("moment"));
const logging_1 = __importDefault(require("./modules/logging"));
const zimbra_1 = __importDefault(require("./modules/zimbra"));
const importAccounts = (zimbraURL, zimbraToken) => __awaiter(void 0, void 0, void 0, function* () {
    //   read array of accounts from json file
    const accounts = JSON.parse(fs_1.default.readFileSync("./accounts.json", "utf8"));
    const logFile = `import-${(0, moment_1.default)().format("YYYY-MM-DD-HH-mm-ss")}.log`;
    (0, logging_1.default)("All Accounts", logFile, "info", `Found ${accounts.length} accounts in accounts.json`);
    const zimbraSoap = new zimbra_1.default(zimbraURL, zimbraToken);
    // get accounts
    const zimbraAccounts = yield Promise.allSettled(accounts.map((account) => zimbraSoap.getAccountByName(account.name))).then((results) => {
        const zimbraAccounts = [];
        results.forEach((result, index) => {
            if (result.status === "fulfilled") {
                zimbraAccounts.push(result.value);
            }
            else {
                (0, logging_1.default)(accounts[index].name, logFile, "error", `Failed to get account: ${result.reason.message}`);
            }
        });
        return zimbraAccounts;
    });
    // modify accounts
    yield Promise.allSettled(zimbraAccounts.map((account) => __awaiter(void 0, void 0, void 0, function* () {
        const accountForwarding = accounts.find((acc) => acc.name === account.name);
        if (!accountForwarding) {
            (0, logging_1.default)(account.name, logFile, "error", "Forwarding not found in accounts.json");
            return;
        }
        yield zimbraSoap.modifyAccount({
            accountId: account.id,
            forwardingAddresses: accountForwarding.forwardingAddresses,
            hiddenForwardingAddresses: accountForwarding.hiddenForwardingAddresses,
        });
        (0, logging_1.default)(account.name, logFile, "success", "Account has been modified");
    }))).then((results) => {
        results.forEach((result, index) => {
            if (result.status === "rejected") {
                (0, logging_1.default)(accounts[index].name, logFile, "error", `Failed to modify account: ${result.reason.message}`);
            }
        });
    });
    //   create accounts
    // await Promise.allSettled(
    //   accounts.map(async (account) => {
    //     const {
    //       name,
    //       password,
    //       displayName,
    //       firstName,
    //       lastName,
    //       middleName,
    //       description,
    //       quota,
    //       notes,
    //     } = account;
    //     await zimbraSoap.createAccount({
    //       email: name,
    //       password: "Taffeta123#",
    //       displayName,
    //       firstName,
    //       lastName,
    //       middleName,
    //       description,
    //       quota,
    //       notes,
    //     });
    //     log(name, logFile, "success", "Account has been created successfully");
    //   })
    // ).then((results) => {
    //   results.forEach((result, index) => {
    //     if (result.status === "rejected") {
    //       log(
    //         accounts[index].name,
    //         logFile,
    //         "error",
    //         `Failed to create account: ${result.reason.message}`
    //       );
    //     }
    //   });
    // });
    (0, logging_1.default)("All Accounts", logFile, "info", "All accounts have been imported");
});
exports.default = importAccounts;
