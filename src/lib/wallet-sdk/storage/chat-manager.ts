import _ from "lodash";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { BaseManager } from "./base-manager";
import { StorageManager } from "./manager";
import storage from "./storage";
import { UserRecord } from "./user-manager";
import { stringify } from "./utils";

export class ChatManager extends BaseManager implements StorageManager {
  // const { wallet, keyInfra } = useSelector((state: RootState) => state.coreReducer);

  KEY = "ChatManager";

  /*
  ChatManager > suriya_message --> {"0x8da6700A5bF8d0854409F1ff646321D8DD81c781": [{sender: "0x52AB4c377F171C8Dbf05508fAC71c0a1A13329D8": receipent: "0x8da6700A5bF8d0854409F1ff646321D8DD81c781", content: "uyuy43792hj37920", timestamp: 122222, rawMessage: 'hello',checksum: "wh33k4jofdjuii2i4os"}, 
  {sender: "0x52AB4c377F171C8Dbf05508fAC71c0a1A13329D8": receipent: "0x8da6700A5bF8d0854409F1ff646321D8DD81c781", content: "kk122u3jkkbdoioq", timestamp: 122222, rawMessage: 'hello',checksum: "wh33k4jofdjuii2i4os"}],
   "0x52AB4c377F171C8Dbf05508fAC71c0a1A13329D8": [{sender: "0x8da6700A5bF8d0854409F1ff646321D8DD81c781", receipent: "0x52AB4c377F171C8Dbf05508fAC71c0a1A13329D8", content: "dasdu3u211", rawMessage: 'hello',checksum: "wh33k4jofdjuii2i4os", timestamp: 12222222}, {sender: "0x8da6700A5bF8d0854409F1ff646321D8DD81c781", receipent: "0x52AB4c377F171C8Dbf05508fAC71c0a1A13329D8", content: "jdhjfjkwew111i", timestamp: 12222222, rawMessage: 'hello',checksum: "wh33k4jofdjuii2i4os"}]}
  */
  async get(key: string | any, path?: string[]): Promise<string | any> {
    path = path || [];
    path.push(key as string);
    return await this.fetchRecords(this.KEY, path);
  }

  async set(key: string, path?: string[], data?: any): Promise<void> {
    let allData = await this.get(key, path);
    allData = allData || [];
    allData.push(data)

    path = path || [];
    await this.setRecords(this.KEY, path, allData);
    return;
  }

  remove(key: string | UserRecord, path?: string[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  update(key: string | UserRecord, path?: string[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

export const chatManager: ChatManager = new ChatManager();
