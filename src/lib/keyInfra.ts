/* eslint-disable no-unused-vars */
import _ from "lodash";
import { http } from "./wallet-sdk/config";
import sss from "shamirs-secret-sharing";
import { Auth } from "./wallet-sdk/Auth";
import CryptoJS, { enc } from "crypto-js";
import { SERVICE_API } from "@env";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import storage, { Storage } from "./wallet-sdk/storage/storage";

export class KeyInfra {
  storageApi: string;
  recoveryApi: string;
  serviceApi: string;
  uKey: string | null;
  pKey: string | null;
  shareB: string | null;
  entropy: string;
  password: string | null;
  localStorage: Storage = storage;

  constructor(serviceApi: string, storageApi: string, recoveryApi: string) {
    this.storageApi = storageApi;
    this.recoveryApi = recoveryApi;
    this.serviceApi = serviceApi;

    // Keys
    this.uKey = null;

    this.pKey = null;
    this.shareB = null;
    this.entropy = "correct horse battery staple";
    this.password = null;
  }

  getDeviceDetail = () => {
    return `${Platform.OS} ${Platform.Version}`
  };

  splitShare = (key: string) => {
    let secret = Buffer.from(key);
    let shareBuffers = sss.split(secret, {
      threshold: 2, shares: 3,
      random: () => new Int8Array([13, 45, 23243, 4234, 324, 24, 2, 4, 2, 345, 4, 53, 5, 435, 43])
    });
    return shareBuffers.map((buffer: any) => buffer.toString("hex"));
  };

  setUkey = (uKey: string) => {
    this.uKey = uKey;
  }

  persistKeyShares = async function (keyShares: string[], metaData: object) {
    let uKey = this.uKey; // TODO: Verify the "noImplicitThis": false if fails
    let encKeyShares = keyShares.map((key: string) => this.encryptShare(key, uKey));
    let isOtp = (await Auth.getLoginType()) == Auth.LoginType.OTP;
    await this.persistInStorage(encKeyShares[1], metaData).then((response: any) => {
      this.persistInLocal(encKeyShares[0]);
      // isOtp || this.persistInRecovery(encKeyShares[2]);
    })
    return encKeyShares
    // return await Promise.all([
    //   this.persistInLocal(encKeyShares[0]),
    //   this.persistInStorage(encKeyShares[1], metaData),
    //   isOtp || this.persistInRecovery(encKeyShares[2]),
    // ]).then((values) => {
    //   return values;
    // });
  };

  // Store Local key
  persistInLocal = async function (keyShare: string) {
    this.localStorage.setItem(this.uKey + "-KeyShare", keyShare);
    return true;
  };

  // Store Storage key
  persistInStorage = async function (keyShare: string, data: string) {
    const response = await this.setMetaData(keyShare, data)
    return response.data.status
  };

  persistInRecovery = async function (keyShare: string) {
    const response = await this.sendRecovery(keyShare);
    console.log("EMAILING KEYSHARES ====> ", keyShare)
    return response.data.status;
  };

  resendRecoveryShare = async (pKey: string, ukey: string) => {
    const shares = this.splitShare(pKey)
    let recovery = this.encryptShare(shares[2], ukey)
    if (Auth.LoginType.OTP == await Auth.getLoginType()) {
      // Wallet.downloadKeyShare(recovery); // TODO: Uncomment
    } else {
      return await this.persistInRecovery(this.encryptShare(shares[2], ukey))
    }
  }

  getRecoveryForMobile = (pKey: string, ukey: string) => {
    const shares = this.splitShare(pKey)
    let recovery = this.encryptShare(shares[2], ukey)
    return recovery
  }

  // Get Local Key
  getFromLocal = async function () {
    let encryptedShare = await this.localStorage.getItem(this.uKey + "-KeyShare");

    if (encryptedShare == null) {
      return null;
    }

    return this.decryptShare(encryptedShare, this.uKey);
  };

  // Get Storage Key
  getFromStorage = function () {
    return this.getMetaData().then((res: any) => {

      if (!res.status || _.isEmpty(res.data)) {
        return null;
      }
      return this.decryptShare(res.data[0].key_share, this.uKey);
    });
  };

  // Get Recovery key
  getFromRecovery = function () {
    return this.getRecovery().then((res: any) => {

      if (!res.status || _.isEmpty(res.data)) {
        return null;
      }

      return this.decryptShare(res.data.key_share, this.uKey);
    });
  };

  reconstructKey = async function (recoveryShare = "") {
    const keySharesObj = await Promise.all([
      recoveryShare === "" ? this.getFromLocal() : null,
      this.getFromStorage(),
      new Promise((resolve, _reject) => resolve(this.decryptShare(recoveryShare, this.uKey)))
    ]);

    let keyShares = keySharesObj.map((v: any) => v);
    keyShares = _.compact(keyShares);
    if (keyShares.length >= 2) {
      let pKey = this.combineShares(keyShares);
      return pKey;
    } else {
      throw new Error("Invalid Key");
    }
    ;
  };

  combineShares = function (shares: any) {
    return sss.combine(shares).toString();
  };

  // ======= OrbitDB Implememntation ========
  // async setMetaData(keyShare, address) {
  setMetaData = async function (keyShare: any, data: { address: any; }) {
    http.defaults.headers.Authorization = `Bearer ${await Auth.getToken()}`;
    let metaData = {
      key: this.uKey,
      address: data.address,
      key_share: keyShare,
      devices: [this.getDeviceDetail()],
      sign: null
    };

    (metaData).sign = this.signKey(metaData);
    return await http.post(`${this.storageApi}set`, metaData, {
      headers: {
        "content-type": "application/json",
      },
    });
  };

  getMetaData = async function () {
    http.defaults.headers.Authorization = `Bearer ${await Auth.getToken()}`;
    let api = this.serviceApi;
    return await http
      .get(`${this.storageApi}get`, {
        params: {
          key: this.uKey,
          sign: this.signKey(this.uKey),
        },
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        return response.data;
      });
  };

  // ======= Old Implementation: Set Recovery Key ========
  // setRecovery = async function (keyShare) {
  //   let params = {
  //     key: this.uKey,
  //     key_share: keyShare,
  //     entropy: this.entropy,
  //   }

  //   return await http.post(`${this.recoveryApi}set_recovery`, params
  //   );
  // };

  sendRecovery = async function (recoveryKey: any) {
    http.defaults.headers.Authorization = `Bearer ${await Auth.getToken()}`;
    let params = {
      login_type: await Auth.getLoginType(),
      login_id: await Auth.getLoginId(),
      recovery_key: recoveryKey
    }

    return await http.post(`${this.serviceApi}send_recovery`, params);
  };

  getRecovery = async function () {
    http.defaults.headers.Authorization = `Bearer ${await Auth.getToken()}`;

    return await http.get(`${this.recoveryApi}get_recovery`, {
      params: {
        key: this.uKey,
        entropy: this.entropy || "correct horse battery staple",
      },
      headers: {
        "content-type": "application/json",
      },
    });
  };

  signKey = (encKey: string | CryptoJS.lib.WordArray) => {
    return CryptoJS.SHA256(encKey).toString();
  };

  storeShareB = function (share: any) {
    if (!share) return;

    let encShare = this.encryptShare(share);

    const options = {
      pinataMetadata: { name: "key-222" },
      pinataOptions: { cidVersion: 0 },
    };
  };

  encryptShare = (message: string | CryptoJS.lib.WordArray, key: string | CryptoJS.lib.WordArray) => {
    return CryptoJS.AES.encrypt(message, key).toString();
  };

  verifyHash = (message: any, hash: any) => {
    return this.hashify(message) == hash;
  }

  decryptShare = (message: string | CryptoJS.lib.CipherParams, key: string | CryptoJS.lib.WordArray) => {
    var decrypted: CryptoJS.lib.WordArray = CryptoJS.AES.decrypt(message, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
    // return decrypted.toString();
  };
  // Private
  hashify = (message: string | CryptoJS.lib.WordArray) => {
    return CryptoJS.SHA256(message) + "Ethereum";
  }
}
