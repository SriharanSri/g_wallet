import axios, { Axios } from "axios";
import _ from "lodash";
import Web3 from "web3";
import { http } from "./config";
import storage, { Storage } from "./storage/storage";
import { userManager, UserRecord } from "./storage/user-manager";

// http.defaults.withCredentials = true;
// http.defaults.headers['sameSite'] = 'None'
// http.defaults.headers['secure'] = 'true'

export class Auth {
  static LoginType = {
    EMAIL: "email_auth",
    GOOGLE: "google_oauth2",
    OTP: "otp_auth",
  };

  api: string = "";
  metadata: object = {};
  localStorage: Storage = storage;

  constructor(api: string) {
    this.api = api;
  }

  async emailLogin(email: string, type: string) {
    let res = await http.post(
      `${this.api}${type == Auth.LoginType.OTP ? "otp_login" : "email_login"}`,
      {
        login_id: email,
        login_type: type,
        chain_type: await Auth.getBlockchainType(),
      }
    );

    if (res.data.status) {
      await this.setToken(res.data.data.auth_token);
      this.setLoginDetails({ login_type: type, login_id: email });
      return res.data;
    } else {
      return false;
    }
  }

  async otpLogin(number: string, type: string) {
    let res = await http.post(`${this.api}otp_login`, {
      login_id: number,
      login_type: type,
      chain_type: await Auth.getBlockchainType(),
    });

    if (res.data.status) {
      await this.setToken(res.data.data.auth_token);
      this.setLoginDetails({ login_type: type, login_id: number });
      return res.data;
    } else {
      return false;
    }
  }

  async verifyLogin(
    loginType?: string,
    loginId?: string,
    authToken?: string,
    request_data = true,
    verification_type = "verify"
  ) {
    http.defaults.headers.Authorization = `Bearer ${
      authToken || (await Auth.getToken())
    }`;

    loginType = loginType || (await this.getLoginType());
    loginId = loginId || (await this.getLoginId());

    return await http
      .get(`${this.api}verify`, {
        params: {
          login_type: loginType,
          login_id: loginId,
          chain_type: await Auth.getBlockchainType(),
          request_data: request_data,
          verification_type: verification_type,
        },
      })
      .then(async (response) => {
        if (response.data.status) {
          await this.setToken(response.data.token);
          this.setLoginDetails({ login_type: loginType, login_id: loginId });
          return response.data;
        } else {
          return { status: false };
        }
      })
      .catch((error) => {
        return { status: false };
      });
  }

  async sendOTP() {
    http.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${await Auth.getToken()}`;

    await http
      .post(`${this.api}send_otp`, {
        login_type: await this.getLoginType(),
        login_id: await this.getLoginId(),
        chain_type: await Auth.getBlockchainType(),
      })
      .then((response) => {
        return response.data.status;
      })
      .catch((_error) => {
        return false;
      });
  }

  async verifyOTP(
    loginType: string,
    loginId: number,
    authToken: string,
    otp: string,
    request_data = true,
    verification_type = "verify"
  ) {
    http.defaults.headers.Authorization = `Bearer ${
      authToken || (await Auth.getToken())
    }`;

    loginType = loginType || (await this.getLoginType());
    loginId = loginId || (await this.getLoginId());

    return await http
      .post(`${this.api}otp_auth_verify`, {
        login_type: loginType || (await this.getLoginType()),
        login_id: loginId || (await this.getLoginId()),
        chain_type: await Auth.getBlockchainType(),
        otp: otp,
        request_data: request_data,
        verification_type: verification_type,
      })
      .then(async (response) => {
        if (response.data.status) {
          await this.setToken(response.data.token);
          this.setLoginDetails({ login_type: loginType, login_id: loginId });
          return response.data;
        } else {
          return { status: false };
        }
      })
      .catch((_error) => {
        return false;
      });
  }

  async reverifyOTP(
    loginType: string,
    loginId: number,
    authToken: string,
    otp: string
  ) {
    http.defaults.headers.Authorization = `Bearer ${
      authToken || (await Auth.getToken())
    }`;

    return await http
      .post(`${this.api}otp_reverify`, {
        login_type: loginType || (await this.getLoginType()),
        login_id: loginId || (await this.getLoginId()),
        otp: otp,
      })
      .then((response) => {
        if (response.data.status) {
          return response.data;
        } else {
          return { status: false };
        }
      })
      .catch((_error) => {
        return false;
      });
  }

  async signOut() {
    return await http
      .get(`${this.api}signout`, {
        params: {
          login_type: await this.getLoginType(),
          login_id: await this.getLoginId(),
          chain_type: await Auth.getBlockchainType(),
        },
      })
      .then((_response) => {
        return true;
      })
      .catch((_error) => {
        return false;
      });
  }
  async deleteAccount() {
    http.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${await Auth.getToken()}`;

    return await http
      .delete(`${this.api}delete_account`, {
        params: {
          login_id: await this.getLoginId(),
          login_type: await this.getLoginType(),
        },
      })
      .then((response: any) => {
        console.log("_response", response?.data?.status);
        if (response?.data?.status) return { status: response?.data?.status };
        else {
          console.log("else=====>", response);
          return { status: response?.data?.status, message: response.message };
        }
      })
      .catch((error: Error) => {
        console.log("error", error.message);
        return { status: false, message: error.message };
      });
  }
  async update2FA(is2FAEnabled: boolean) {
    http.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${await Auth.getToken()}`;

    return await http
      .post(`${this.api}update_twofa`, {
        login_type: await this.getLoginType(),
        login_id: await this.getLoginId(),
        chain_type: await Auth.getBlockchainType(),
        two_fa: is2FAEnabled,
      })
      .then((response) => {
        return response.data.status;
      })
      .catch((_error) => {
        return false;
      });
  }

  async updateVerification() {
    http.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${await Auth.getToken()}`;

    return await http
      .post(`${this.api}update_verification`, {
        login_type: await this.getLoginType(),
        login_id: await this.getLoginId(),
      })
      .then((response) => {
        return response.data.status;
      })
      .catch((_error) => {
        return false;
      });
  }

  clearStorage() {
    let exceptions =
      "ADDRESSBOOK-|-TOKEN-|-COLLECTIBLE-|-WALLET|TRANSACTIONS-|-address-|network|TESTNET-ENABLED|TESTNET-ENABLED|SEND-CRASH-REPORT|NETWORKS|network|keyShare|chainType|disclaimerStatus|ACCT-STATUS|ACCT_CONTRACT_ADDR|ACCT-TXN";

    Object.keys(this.localStorage).forEach((key) => {
      if (!key.match(exceptions)) {
        this.localStorage.removeItem(key);
      }
    });
  }

  async getToken() {
    return await Auth.getToken();
  }

  async setToken(authToken: string) {
    await this.localStorage.setItem("authToken", authToken);
    http.defaults.headers.Authorization = authToken;
  }

  setLoginDetails(data: any) {
    this.localStorage.setItem("loginType", data.login_type);
    this.localStorage.setItem("loginId", data.login_id);
  }
  getLoginId() {
    return Auth.getLoginId();
  }

  getLoginType() {
    return Auth.getLoginType();
  }

  static getLoginId() {
    return (storage as any).getItem("loginId");
  }

  static getLoginType() {
    return (storage as any).getItem("loginType");
  }
  static setDisclaimerStatus(status) {
    (storage as any).setItem("disclaimerStatus", status);
  }

  static async isDisclaimerAccepted() {
    return (await (storage as any).getItem("disclaimerStatus")) === "true";
  }

  static async getIsSigned(address: string) {
    return await (storage as any).getItem(`isSigned`);
  }

  static async setIsSigned(status: boolean, address: string) {
    (storage as any).setItem(`isSigned`, status);
  }

  static async getPubKey(address: string) {
    return await (storage as any).getItem(`${address}_pubkey`);
  }

  static async setPubKey(pubkey: boolean, address: string) {
    (storage as any).setItem(`${address}_pubkey`, pubkey);
  }

  errorSignout() {
    this.clearStorage();

    setTimeout(() => {
      global.window.location.href = "/";
    }, 2000);
  }

  async getMetadata() {
    let status = this.metadata != null && !_.isEmpty(this.metadata);

    if (status) return this.metadata;

    try {
      var lsMetaData = JSON.parse(
        (await this.localStorage.getItem("metadata")) as string
      );
      const key = `${await Auth.getLoginId()}_${await Auth.getLoginType()}`;
      this.metadata = lsMetaData[key];
      return this.metadata;
    } catch {
      this.metadata = {};
    }

    return this.metadata;
  }

  setMetadata(metadata: object) {
    this.localStorage.getItem("metadata").then(async (metadata) => {
      var lsMetaData = JSON.parse(metadata || "{}");
      const key = `${await Auth.getLoginId()}_${await Auth.getLoginType()}`;
      lsMetaData[key] = metadata;
      this.localStorage.setItem("metadata", JSON.stringify(lsMetaData));
    });
  }

  static async loadStreams(
    secret: string,
    targetOrigin: string,
    authStream: any,
    wallet: any
  ) {
    const isExists = await storage.getItem(`${secret}-connectedSites`);
    const availableSites = isExists ? JSON.parse(isExists) : null;

    if (availableSites && availableSites.includes(targetOrigin)) {
      authStream?.write({
        method: "app_checkAuth",
        data: {
          authenticated: true,
          isConnected: true,
          chainID: Web3.utils.toHex(
            await wallet.walletInst?.web3.eth.getChainId()
          ),
        },
      });
    } else {
      authStream?.write({
        method: "app_checkAuth",
        data: {
          authenticated: true,
          isConnected: false,
          chainID: Web3.utils.toHex(
            await wallet.walletInst?.web3.eth.getChainId()
          ),
        },
      });
    }

    return;
  }

  static async getUserStorageKey() {
    return `${await Auth.getLoginId()}_${await Auth.getLoginType()}`;
  }

  static async getDisplayUserName() {
    let user = await userManager.get(await Auth.getUserStorageKey());
    console.log("get display name", user);
    return (
      user?.displayName ||
      (await Auth.getLoginId())
        .replace(/@.*|\W+|_+/g, " ")
        ?.toUpperCase()
        .trim()
    );
  }

  static async getToken() {
    return await storage.getItem("authToken");
  }

  static selectBlockchainType = (chainType: string) => {
    storage.setItem("chainType", chainType);
  };

  static getBlockchainType = async () => {
    return (await storage.getItem("chainType")) || "Ethereum";
  };

  saveUserRecords = async (userRecord: UserRecord) => {
    let key = await Auth.getUserStorageKey();
    let existsUser = (await userManager.get(key)) || {};
    console.log(
      "key in save",
      key,
      "merged :",
      { ...existsUser, ...userRecord },
      "exists user :",
      { ...existsUser },
      "user record : ",
      { ...userRecord }
    );
    await userManager.set(key, [], {
      ...existsUser,
      ...userRecord,
    });
  };
}
