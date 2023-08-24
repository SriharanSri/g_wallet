import _ from "lodash";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { BaseManager } from "./base-manager";
import { StorageManager } from "./manager";
import storage from "./storage";
import { UserRecord } from "./user-manager";
import { stringify } from "./utils";

export class PriceManager extends BaseManager implements StorageManager {

  KEY = 'PriceManager';

  // PriceManager > ethereum
  //              > matic
  async get(key: string | UserRecord, path?: string[]): Promise<string | any> {
    path = path || [];
    path.push(key as string);
    return await this.fetchRecords(this.KEY, path) || {};
  }

  async set(key: string, path?: string[], data?: any): Promise<void> {
    path = path || [];
    console.log("** in storgae **", key);
    path.push(key as string);
    await this.setRecords(this.KEY, path, data);
    return;
  }

  remove(key: string | UserRecord, path?: string[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  update(key: string | UserRecord, path?: string[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

export const priceManager: PriceManager = new PriceManager();