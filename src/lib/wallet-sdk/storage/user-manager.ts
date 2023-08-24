import { BaseManager } from "./base-manager";
import { Record, StorageManager } from "./manager";
import storage from "./storage";
import { recordify, stringify } from "./utils";

export interface UserRecord extends Record {
  loginId: string,
  loginType: string,
  authToken?: string,
  metadata?: object,
  disclaimerStatus?: boolean,
  testnetEnabled?: boolean,
  crashReportEnabled?: boolean,
  displayName?: string,
  importedAccounts?: object[]
}

export class UserManager extends BaseManager implements StorageManager {
  KEY: string = "UserManager";

  get(key: string): Promise<UserRecord> {
    return this.fetch(key);
  }

  async set(key: string, path?: string[], record?: UserRecord): Promise<void> {
    let allRecords = (await this.getAll(this.KEY)) || {};

    // let key = `${value.loginId}_${value.loginType}`
    var storedRecord: UserRecord = await this.fetch(key);

    if(storedRecord){
      storedRecord.authToken = record.authToken;
      storedRecord.metadata = record.metadata;
      storedRecord.disclaimerStatus = record.disclaimerStatus;
      storedRecord.testnetEnabled = record.testnetEnabled;
      storedRecord.crashReportEnabled = record.crashReportEnabled;
      storedRecord.displayName = record.displayName;
      storedRecord.importedAccounts = record.importedAccounts;
      allRecords[key] = storedRecord;
    } else {
      allRecords[key] = record;
    }
    console.log("in user manager", allRecords)
    storage.setItem(this.KEY, stringify(allRecords));
  }

  remove(key: string, path: string[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  update(key: string, path: string[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async fetch(key: string): Promise<UserRecord> {
    return this.fetchRecords(this.KEY, [key])
  }
}

export const userManager: UserManager = new UserManager();
