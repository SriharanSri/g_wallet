import AsyncStorage from "@react-native-async-storage/async-storage";
import _ from "lodash";
import * as Keychain from "react-native-keychain";
import { recordify, stringify } from "./utils";

const AuthToken: string = "authToken";
const KeyShare: string = "KeyShare";

export interface Storage {  
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class ReactNativeStorageAdapter implements Storage {  

  async getItem(key: string): Promise<string | false | any> {
    if(key === AuthToken || key.match(KeyShare)){
  
      let keyData: Keychain.UserCredentials|false = await Keychain.getGenericPassword();
      let strData: string = (keyData as any).password as string;
      let data = (strData ? recordify(strData) : {}) || {};
      return data[key];
    } 
    
    return await AsyncStorage.getItem(key);
  }
  
  async setItem(key: string, value: string|any): Promise<void> {

    if(key === AuthToken || key.match(KeyShare)){

      let keyData: Keychain.UserCredentials|false = await Keychain.getGenericPassword();
      let strData: string = (keyData as any).password as string;
      let data = (strData ? recordify(strData) : {}) || {};

      data[key] = value;

      Keychain.setGenericPassword("keyData", stringify(data));
      return;
    } 

    if (typeof value != "string") {
      try {
        value = stringify(value);
      } catch {}
    }

    return await AsyncStorage.setItem(key, value);
  }
  async removeItem(key: string): Promise<void> {
    return await AsyncStorage.removeItem(key);
  }
}

// export class ChromeStorageAdapter implements Storage {
//   async getItem(key: string): Promise<string | null> {
//     return new Promise((resolve, reject) => {
//       chrome.storage.local.get([key], (result) => {
//         resolve(result[key]);
//       });
//     });
//   }
//   async setItem(key: string, value: string): Promise<void> {
//     return new Promise((resolve) => {
//       chrome.storage.local.set({ [key]: value }, () => {
//         resolve();
//       });
//     });
//   }
//   async removeItem(key: string): Promise<void> {
//     return new Promise((resolve) => {
//       chrome.storage.local.remove([key], () => {
//         resolve();
//       });
//     });
//   }
// }

// export class LocalStorageAdapter implements Storage {
//   getItem(key: string): Promise<string | null> {
//     return Promise.resolve(localStorage.getItem(key));
//   }
//   setItem(key: string, value: string): Promise<void> {
//     localStorage.setItem(key, value);
//     return Promise.resolve();
//   }
//   removeItem(key: string): Promise<void> {
//     localStorage.removeItem(key);
//     return Promise.resolve();
//   }
// }

let storage: Storage;

if (typeof AsyncStorage !== 'undefined') {
  storage = new ReactNativeStorageAdapter();
// } else if (typeof chrome !== 'undefined' && typeof chrome.storage !== 'undefined') {
//   storage = new ChromeStorageAdapter();
// } else {
//   storage = new LocalStorageAdapter();
}

export default storage;