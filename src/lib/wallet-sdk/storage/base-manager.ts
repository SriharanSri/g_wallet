import _ from "lodash";
import { Record } from "./manager";
import storage from "./storage";
import { recordify, stringify } from "./utils";

export class BaseManager {

  async getAll(key: string): Promise<any> {
    let records: string = await storage.getItem(key);

    return recordify(records);
  }

  async fetchRecords(key: string, path?: string[], filter?: (record: Record) => any){
    var records: any = await this.getAll(key);
    records = records || {};

    path?.forEach((path) => {
      if(records) records = records[path];
    }) 

    return filter ? (records as any).filter(filter) : records;
  }

  async setRecords(key: string, path?: string[], data?: any) {
    let allRecords = await this.getAll(key);
    allRecords = allRecords || {};

    let parsedRecords = allRecords;

    let lastKey = _.last(path);
    _.initial(path)?.forEach((p) => {
      parsedRecords[p] ?? (parsedRecords[p] = {}); 
      parsedRecords = parsedRecords[p];
    });

    if(parsedRecords) parsedRecords[lastKey] = data;

    storage.setItem(key, stringify(allRecords));    
  }

}
