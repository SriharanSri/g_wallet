/* eslint-disable no-unused-vars */
import Web3 from "web3";
import _ from "lodash";
import { http } from "./config";
import CryptoJS, { enc } from "crypto-js";
import downloader from "downloadjs";
import moment from "moment";
import fromExponential from "from-exponential";
import ABI from "./Abi.json";
import ERC721_ABI from "./ERC721_ABI.json";
// import Gns from "gnssdk";
import axios from "axios";
// import {Auth} from "./Auth";
// import {Wallet} from "./Wallet";
import Moralis from "moralis";
import InputDataDecoder from 'ethereum-input-data-decoder';
import abi from "./registry.json";
import base64 from 'base-64';
import { EncryptedKeystoreV3Json } from "web3-core";
import { TransactionReceipt } from "web3-core";
import { Wallet } from "./wallet";
import storage, { Storage } from "./storage/storage";
import { MORALIS, PRICE_CACHE_TIME, RECOVERY_API, SERVICE_API, STORAGE_API } from '@env';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { transactionManager } from "./storage/transaction-manager";
import nft_not_found from "../../../assets/image/nft_not_found.png";
import { Auth } from "./Auth";
import { priceManager } from "./storage/price-manager";
import { activityManager } from "./storage/activity-manager";
import { decryptPkFromJsonRN } from "../EthereumOverrides";


Moralis.start({
  apiKey: process.env.MORALIS,
});

export class EthereumWallet {
  static AddressType = {
    ENSDomain: "ensDomain",
    GNSDomain: "gnsDomain",
    UnstoppableDomain: "unstoppableDomain",
    EthAddress: "eth_address",
  };

  web3: Web3;
  networkProvider: any;
  symbol: string | null;
  uKey: string | null;
  wallet: any;
  account: any; // TODO: Add appropriate type
  totalValue: number;
  walletPassword: null;
  pKey: any;
  localStorage: Storage = storage;

  constructor(networkName: string) {
    this.web3 = new Web3();
    this.networkProvider = null;
    this.symbol = null;

    this.setProvider(networkName);

    this.uKey = null;

    // Wallet
    this.wallet = null;
    this.account = null;
    this.totalValue = 0;
    this.walletPassword = null;
  }

  // TODO: Add appropriate type for account arg
  changeAccount = (account: any) => {
    this.account = account;
  }

  getEstimatation = async (transaction: any) => {
    return;
  }

  toCompatibleAmount = (amount: number) => {
    return this.web3.utils.toHex(this.web3.utils.toWei(amount.toString(), 'ether'));
  }

  hexChainId = async () => {
    return this.web3.utils.toHex(await this.web3.eth.getChainId())
  }

  getPubKey = () => {
    return this.account?.address;
  }

  startAccountStatusCheck = () => { }

  getPKey = () => {
    return this.account?.privateKey;
  }

  getPKeyBN = () => {
    return this.web3.utils.toBN(this.account?.privateKey).toString();
  }

  getAcctAddresses = () => {
    const wl = this.wallet || this.web3.eth.accounts?.wallet;
    const noOfAccounts = wl.length || 0
    const accounts = [];
    for (let i = 0; i < noOfAccounts; i++) {
      accounts.push(wl[i].address)
    }
    console.log(accounts)
    return accounts;
  }

  storingLatestBlock = async (address: string, latest_block?: string) => {
    let block = latest_block ? latest_block : await this.web3.eth.getBlockNumber();
    // TODO: Storage
    // this.localStorage.setItem(`BLOCK-${address}-${this.networkProvider.key}`, block as string);
    await transactionManager.set(address, [this.networkProvider.chainId], block);
  }

  removeAccount = async (remAccount: any) => {
    // this.getWallet();
    // if(this.account.address === remAccount.address){
    //   this.account = this.web3.eth.accounts.wallet[0]
    // }
    var _status = this.web3.eth.accounts.wallet.remove(remAccount.address);
    const wallets = JSON.parse(await AsyncStorage.getItem("wallet") ?? "[]") as any[]
    const accountToRemove = wallets.find((account) => `0x${account.address.toLowerCase()}` === remAccount.address.toLowerCase())
    const index = wallets.indexOf(accountToRemove)
    wallets.splice(index, 1)
    await AsyncStorage.setItem("wallet", JSON.stringify(wallets))
  }

  getAccountAddress = () => {
    return this.account.address;
  };

  getTrasactionReceipt = (hash: string) => {
    return this.web3.eth.getTransactionReceipt(hash);
  };

  walletName = () => {
    return `${this.uKey}-WALLET`;
  };

  getTxnStatus = (hash: string) => {

  }

  // TODO: Network type
  setProvider = async (network: any) => {
    this.networkProvider = (await Wallet.getNetworkProviders()).get(network.key);
    this.web3.setProvider(this.networkProvider?.url);
    this.symbol = this.networkProvider?.symbol;
  };

  updateProvider = (network) => {
    Wallet.getNetworkProviders().then((providers) => {
      this.networkProvider = providers.get(network.key);
      this.web3.setProvider(network.url);
      this.symbol = this.networkProvider.symbol;  
    });
  }

  createWallet = async () => {
    if (this.uKey) {
      this.wallet = this.web3.eth.accounts.wallet.create(1);
      let data = [{ [this.wallet[0].address]: "Primary Account" }];
      let auth = new Auth(SERVICE_API);
      console.log("data is", data)
      auth.saveUserRecords({ loginId: await Auth.getLoginId(), loginType: await Auth.getLoginType(), importedAccounts: data });
      const encryptedWallet = this.wallet.encrypt(this.uKey)
      await AsyncStorage.setItem("wallet", JSON.stringify(encryptedWallet))

      // TODO: unable to save wallet
      // this.wallet.save(
      // Not sure why to give this name for wallet
      //   this.uKey,
      //   this.walletName()
      // );
      this.account = this.wallet[0];
      this.pKey = this.account.privateKey;

      return [this.account.privateKey, this];
    } else {
      throw new Error("Unable to create wallet");
    }
  };

  exportWallet = (password: string) => {
    let encWallet = this.encryptedWallet(password);
    let digest = CryptoJS.SHA1(encWallet).toString();
    let fileName = moment().format("YYYYMMDDHHmmss") + "-" + digest + ".json";
    downloader(encWallet, fileName, "text/plain");
    return encWallet
  };

  encryptedWallet = (password: string) => {
    // var wallet = this.getWallet();
    var encWallet = this.web3.eth.accounts.wallet.encrypt(password)
    // var encWallet = this.wallet[this.account.address].encrypt(password);

    return JSON.stringify(encWallet);
  };

  encryptedAccount = (password: string) => {
    // var wallet = this.getWallet();
    var encWallet = this.account.encrypt(password)
    // var encWallet = this.wallet[this.account.address].encrypt(password);
    return JSON.stringify(encWallet);
  };


  getWallet = () => {
    this.web3.eth.accounts?.wallet?.load(this.uKey as string, this.walletName());
    this.wallet = this.wallet || this.web3.eth.accounts?.wallet;
    if (this.wallet) this.account = this.account || this.wallet[0];
    return this.wallet;
  };

  //NOTE: Commented due to performance issue
  // loadWallet = (encryptedWallets: any[], password: string, index:any) => {
  //   encryptedWallets.map((encryptedWallet) => {
  //     const account = this.web3.eth.accounts.decrypt(encryptedWallet, password)
  //     this.web3.eth.accounts?.wallet?.add(account)
  //   })
  // };

  loadWallet = (encryptedWallets: any[], password: string, index: any) => {
    return new Promise(async (resolve, reject) => {
      for (let index = 0; index < encryptedWallets.length; index++) {
        const account = await decryptPkFromJsonRN(encryptedWallets[index], password, null)
        this.web3.eth.accounts?.wallet?.add(account)
        this.wallet = this.web3.eth.accounts.wallet
      }
      this.account = this.wallet[index]
      resolve(this.wallet)
    })
  };

  walletFromPkey = (pKey: string) => {
    this.account = this.web3.eth.accounts.privateKeyToAccount(pKey);
    this.pKey = this.account.privateKey;

    this.web3.eth.accounts.wallet.add({
      address: this.account.address,
      privateKey: this.account.privateKey,
    });

    // this.web3.eth.accounts.wallet.save(this.uKey as string, this.walletName());

    this.wallet = this.web3.eth.accounts.wallet;
    return this.account;
  };

  getAccountFromJson = (json: EncryptedKeystoreV3Json, password: string) => {
    return this.web3.eth.accounts.decrypt(json, password);
  };

  getFromPrivateKey = (privateKey: string, _password: string = "") => {
    return this.web3.eth.accounts.privateKeyToAccount(privateKey);
  }

  importAccountFromJson = (json: any, password: string) => {
    let account = this.getAccountFromJson(json, password);

    this.web3.eth.accounts.wallet.add({
      address: account.address,
      privateKey: account.privateKey,
    });
    const encryptedWallet = this.web3.eth.accounts.wallet.encrypt(this.uKey)
    AsyncStorage.setItem("wallet", JSON.stringify(encryptedWallet))
    this.account = this.web3.eth.accounts.wallet[0]
    return account.privateKey;
  };

  importFromPrivateKey = (privateKey: string, _password: string = '') => {
    let account = this.getFromPrivateKey(privateKey, _password);

    // this.web3.eth.accounts.wallet.add({
    //   address: account.address,
    //   privateKey: account.privateKey,
    // });
    this.web3.eth.accounts.wallet.add(account);
    const encryptedWallet = this.web3.eth.accounts.wallet.encrypt(_password)
    AsyncStorage.setItem("wallet", JSON.stringify(encryptedWallet))
    this.account = this.web3.eth.accounts.wallet[0]
    // this.web3.eth.accounts.wallet.save(this.uKey as string, this.walletName());
    return account.privateKey;
  };


  getBalance = async (type = "ethereum") => {
    try {
      let result: string;
      let decimal: string;
      if (type === "ethereum") {
        result = await this.web3.eth.getBalance(this.account?.address)
        result = this.web3.utils.fromWei(result);
      } else {
        let contractInstance = new this.web3.eth.Contract(ABI as any, type);
        result = await contractInstance.methods
          .balanceOf(this.account?.address)
          .call();
        decimal = await contractInstance.methods.decimals().call();
        result = fromExponential(Number(result) / 10 ** Number(decimal));
        // alert(result)
      }

      this.totalValue = Number(result);
      return this.totalValue;
    } catch (error) {
      return 0;
    }
  };

  stringToHex = (data) => {
    return this.web3.utils.toHex(data)
  }
  // getLocalPrice = (priceType: any) => {
  //   var priceBook: string|null = this.localStorage.getItem("PriceBook");
  //   if (!priceBook) return {};
  //   let priceBookObj: any = JSON.parse(priceBook);
  //   let priceData: any = priceBookObj[priceType];
  //   // TODO: Setup the price Data type
  getLocalPrice = async (priceType: string) => {
    let priceData = await priceManager.get(priceType as string);
    // var priceBook: string|null = this.localStorage.getItem("PriceBook");    
    // if (!priceBook) return {};
    // let priceBookObj: any = JSON.parse(priceBook);
    // let priceData: any = priceBookObj[priceType];
    // TODO: Setup the price Data type
    console.log("-- priceData ---", JSON.stringify(priceData));

    if (!priceData) return {};

    let timeDiff = (new Date() as any) - Date.parse(priceData.updatedAt);
    let cache_time = Number(PRICE_CACHE_TIME);
    priceData = (timeDiff / 1000 / 60) > cache_time ? {} : priceData;
    return priceData;
  };

  setLocalPrice = async (priceId: string | number, currency: string, price: string) => {
    let priceData = { updatedAt: moment().format() };
    priceData[currency] = price;
    await priceManager.set(priceId as string, [], priceData)
  };

  getPrice = async (type = "0x1", contractAddresses: any) => {
    if (contractAddresses) {
      var {
        data: { data },
      } = await http.get(
        `${SERVICE_API}blockchain/${type}/price?token_addresses=${contractAddresses}&currencies=usd`,
        {
          headers: { Authorization: `Bearer ${await Auth.getToken()}` },
        }
      );
      return data || {};
    } else {
      let price = await this.getLocalPrice(this.networkProvider.priceId);
      if (!_.isEmpty(price)) {
        return price;
      }

      let priceResponse: any = {};
      await http.get(
        `${SERVICE_API}/blockchain/${type}/price?currencies=usd`,
        {
          headers: { Authorization: `Bearer ${Auth.getToken()}` },
        }
      ).then((response) => {
        if (response.status) {
          priceResponse = response.data.data;

          if (!priceResponse) return {};

          this.setLocalPrice(
            this.networkProvider.priceId,
            "usd",
            priceResponse[this.networkProvider.priceId].usd
          );
        } else {
          console.log("** unable to fetch **");
        }
      }).catch((e) => {
        console.error("Error in fetching from price feeder");
      });

      return priceResponse[this.networkProvider.priceId] || {};
    }
  };

  getAddressFromEns = async (ensDomain: string) => {
    let ens = this.web3.eth.ens;
    return await ens.getAddress(ensDomain);
  };

  getAddressFromGns = async (gnsDomain: string) => {
    try {
      const contract_address = this.networkProvider.key === "GUARDIAN_TESTNET" ? "0x26852e5797f5380AbbFc577ff558D29052005cFe" : this.networkProvider.key === "MUMBAI_TESTNET" ? "0x036bA1fEd6Ee77d6D46576D7a42561Be77435039" : "";
      let domainName = gnsDomain.split(".")[0];
      let tldName = gnsDomain.split(".")[1];
      const contractInstance = new this.web3.eth.Contract(abi as any, contract_address);
      let tldId = await contractInstance.methods.getDomainId(tldName).call();
      let sldId = await contractInstance.methods.getDomainId(domainName, tldId).call();
      let getKey = await contractInstance.methods.getMany(["eth", "btc", "gl", "starknet", "ltc", "doge", "matic", "email", "url", "avatar", "description", "notice", "keywords", "discord", "github", "twitter", "telegram"], sldId).call();
      return getKey[0];
      // let gns = new Gns("0x3CF0AcfBE05C585B2F23f4ef6106C561d007B93E", "0xFF60cc8f8A96Fd4412715ea914a79a7B4F6dCf2D", "https://rpc-mumbai.maticvigil.com");
      // let dots = gnsDomain.match(/\./g).length;
      // let TLD, tokenName, domainName;
      // if (dots == "1") {
      //   [tokenName, domainName] = gnsDomain.trim().split(/\./)
      //   if (domainName == "wallet" || domainName == "glink") {
      //     let tokenId = gns.getTokenId(tokenName);
      //     let domain = gns.getTokenId(domainName);
      //     let result = await gns.resolve(tokenId, domain);
      //     return result?.addressess?.eth;
      //   }
      // }
      // else if (dots == "2") {
      //   [tokenName, domainName, TLD] = gnsDomain.trim().split(/\./)
      //   tokenName = tokenName.concat(".", domainName)
      //   let tokenId = gns.getTokenId(tokenName);
      //   let TLDId = gns.getTokenId(TLD);
      //   let result = await gns.resolve(tokenId, TLDId);
      //   return result?.addressess?.eth;
      // }
      // return "";
    } catch (e: any) {
      console.error("ERROR IS RESOLVE ====>", e.message)
      return "";
    }
  };

  isEnsDomainExists = async (ensDomain: string) => {
    let ens = this.web3.eth.ens;
    return await ens.recordExists(ensDomain);
  };

  // async sendSignedTransaction() {
  //   const receipt = await this.web3.eth.sendSignedTransaction(
  //     sigTxn.rawTransaction
  //   );

  //   return receipt;
  // }

  signMessage = async (message: any) => {
    return (await this.account.sign(message, this.account.privateKey)).signature;
  };

  signTransaction = async (transactionHash: any) => {
    return await this.account.signTransaction(
      transactionHash,
      this.account.privateKey
    );
  };

  sendTransaction = async (from: any, to: any, amount: any, gas: any, tokenAddress: any, data: any, onSuccess: (arg0: string) => void, onError: (arg0: Error) => void, options: { maxFeePerGas: string | number | import("bn.js") | undefined; maxPriorityFeePerGas: string | number | import("bn.js") | undefined; gasPrice: number; tokenSymbol: any; }) => {
    try {
      if (data) {

        //Uniswap - Deposit function for ETH <-> Token case
        // amount = data === "0xd0e30db0" || "0x3593564c" ? amount : "0"
        return await this.web3.eth.sendTransaction(
          { from, to: tokenAddress, value: amount, gas, data, maxFeePerGas: options.maxFeePerGas, maxPriorityFeePerGas: options.maxPriorityFeePerGas, gasPrice: options?.gasPrice ? (options?.gasPrice) * 1e9 : undefined },
          async (err, hash) => {
            if (!err) {
              // console.table({from, to, amount, gas, hash, status: 'pending', data, option: options.tokenSymbol || this.networkProvider.symbol})
              await this.storeTransferData(from, to, to, amount, gas, hash, 'pending', data, '', options.tokenSymbol || this.networkProvider.symbol)
              onSuccess(hash);
            } else {
              console.table({ from, to, amount, gas, hash, status: 'failed', error: err.message, symbol: options.tokenSymbol || this.networkProvider.symbol })
              await this.storeTransferData(from, to, to, amount, gas, hash, 'failed', '', err.message, options.tokenSymbol || this.networkProvider.symbol)
              onError(err);
            }
          }
        );
      } else {
        console.log("data", from, to, amount, options, gas)
        return await this.web3.eth.sendTransaction(
          { from, to, value: amount, gas, maxFeePerGas: options.maxFeePerGas, maxPriorityFeePerGas: options.maxPriorityFeePerGas, gasPrice: options?.gasPrice ? (options?.gasPrice) * 1e9 : undefined },
          async (err, hash) => {
            if (!err) {
              console.log("in success response")
              console.log({ from, to, amount, gas: 21000, hash, status: 'pending', data, 'empty': "", symbol: this.networkProvider.symbol })
              await this.storeTransferData(from, to, to, amount, 21000, hash, 'pending', data, '', this.networkProvider.symbol)
              onSuccess(hash);
            } else {
              console.log("in error response")
              console.log({ from, to, amount, gas: 21000, hash, status: 'failed', error: err.message, symbol: this.networkProvider.symbol })
              await this.storeTransferData(from, to, to, amount, 21000, hash, 'failed', '', err.message, this.networkProvider.symbol)
              onError(err);
            }
          }
        );
      }
    } catch (err: any) {
      console.error("error", err.toString(), err.stack);
      return err.toString();
    }
  };

  // TODO: This method is used only in Ethereum
  storeTransferData = async (from: any, to: any, token: any, amount: any, gas: number, hash: string, status: string, data: string, message: string, symbol: any) => {
    try {
      let res = Object.assign({
        hash,
        from,
        to,
        token,
        value: amount,
        gas,
        status,
        data: data,
        message,
        symbol,
        // transactionFee: `${txnFee} ether`,
        timeStamp: Math.ceil((new Date() as any) / 1000),
      });
      let localData = await activityManager.get(this.getAccountAddress(), [this.networkProvider.chainId]);

      if (localData) {
        let isExists = (localData);
        isExists.push(res);
        activityManager.set(this.getAccountAddress(), [this.networkProvider.chainId], isExists);
      } else {
        let temp = [];
        temp.push(res);
        activityManager.set(this.getAccountAddress(), [this.networkProvider.chainId], temp);
      }
    } catch (error) {
      console.error(error)
    }
  }

  importToken = async (
    tokenAddress: string | undefined,
    type = "ETHEREUM_MAINNET",
    user_address: any
  ) => {
    try {
      let abi = ABI;
      let contractInstance = new this.web3.eth.Contract(abi as any, tokenAddress);
      let tokenName = await contractInstance.methods.name().call();
      let tokenSymbol = await contractInstance.methods.symbol().call();
      let tokenDecimal = await contractInstance.methods.decimals().call();
      let tokenBalance = await contractInstance.methods
        .balanceOf(user_address)
        .call();
      tokenBalance = fromExponential(tokenBalance / 10 ** Number(tokenDecimal));
      return {
        status: true,
        tokenAddress,
        tokenSymbol,
        tokenDecimal,
        tokenName,
        tokenBalance,
      };
    } catch (error) {
      return {
        status: false,
        tokenAddress: "",
        tokenSymbol: "",
        tokenDecimal: "",
        tokenName: "",
        tokenBalance: 0,
      };
    }
  };

  // importCollectible = async (
  //   tokenAddress: string | undefined,
  //   type = "ETHEREUM_MAINNET",
  //   user_address: any,
  //   tokenId: any
  // ) => {
  //   try {
  //     let contractInstance = new this.web3.eth.Contract(
  //       ERC721_ABI as any,
  //       tokenAddress
  //     );
  //     let tokenOwner = await contractInstance.methods.ownerOf(tokenId).call();
  //     if (!(tokenOwner == user_address)) {
  //       return {
  //         tokenBalance: 0,
  //       };
  //     }
  //     let tokenBalance = await contractInstance.methods
  //       .balanceOf(user_address)
  //       .call();
  //     let tokenName = await contractInstance.methods.name().call();
  //     let tokenSymbol = await contractInstance.methods.symbol().call();
  //     return {
  //       tokenBalance,
  //       tokenName,
  //       tokenSymbol,
  //       tokenType: 'COLLECTIBLE'
  //     };
  //   } catch (error) {
  //     return {
  //       tokenBalance: 0,
  //     };
  //   }
  // };

  isValidAddress = async (address: string) => {
    return this.web3.utils.isAddress(address);
  };

  // getNonce = async (address: string) => {
  //   const nonce = await this.web3.eth.getTransactionCount(address, "latest");
  //   return nonce;
  // };

  // ethToWei = async (amount: import("bn.js")) => {
  //   return this.web3.utils.toWei(amount, "ether");
  // };

  // estimateGas = async (from: any, to: any, amount: string | number, tokenAddress: string | undefined, tokenType = 'TOKEN', tokenId: any) => {
  //   try {
  //     let contractInstance = tokenType === 'TOKEN' ? new this.web3.eth.Contract(ABI as any, tokenAddress, {
  //       from: from,
  //     }) : new this.web3.eth.Contract(ERC721_ABI as any, tokenAddress, {
  //       from: from,
  //     });;

  //     let amountBN: any = this.web3.utils.toBN(amount);
  //     let amountExp: string = fromExponential(amountBN as string);
  //     let gasTransaction = Object.assign({
  //       from: from,
  //       to: tokenAddress,
  //       data: tokenType === 'TOKEN' ? await contractInstance.methods.transfer(to, amountExp).encodeABI() :
  //         await contractInstance.methods
  //           .safeTransferFrom(
  //             from,
  //             to,
  //             tokenId
  //           )
  //           .encodeABI(),
  //     });

  //     let estimateGas = await this.web3.eth.estimateGas(gasTransaction);

  //     return estimateGas;
  //   } catch (error) {
  //     throw error;
  //   }
  // };

  generateData = async (from: any, to: any, amount: any, tokenAddress: string | undefined, tokenId: any, tokenType: string) => {
    try {
      let contractInstance = new this.web3.eth.Contract((tokenType === "COLLECTIBLE" ? ERC721_ABI : ABI) as any, tokenAddress, { from: from, });
      let data = tokenType !== 'COLLECTIBLE' ? await contractInstance.methods.transfer(to, amount).encodeABI() :
        await contractInstance.methods.safeTransferFrom(from, to, tokenId).encodeABI();
      return data
    } catch (error) {
    }
  }

  // transfer = async (
  //   from: any,
  //   to: string | number | import("bn.js"),
  //   amount: any,
  //   onSuccess: (arg0: string) => void,
  //   onFailed: (arg0: Error) => void,
  //   onReceipt: (arg0: TransactionReceipt) => void,
  //   tokenAddress: string | undefined,
  //   maxFeePerGas: number,
  //   gasLimit: number,
  //   priorityFee: any,
  //   tokenType: string,
  //   tokenId: any,
  //   tokenSymbol: any
  // ) => {
  //   tokenAddress = _.isEmpty(tokenAddress) ? "ethereum" : tokenAddress;
  //   let contractInstance: any; // TODO: Add appropriate type

  //   if (tokenAddress !== "ethereum" && tokenType !== 'COLLECTIBLE')
  //     contractInstance = new this.web3.eth.Contract(ABI as any, tokenAddress, { from: from, });
  //   if (tokenAddress !== 'ethereum' && tokenType === 'COLLECTIBLE')
  //     contractInstance = new this.web3.eth.Contract(ERC721_ABI as any, tokenAddress, { from: from, });

  //   let transaction = Object.assign({
  //     type: '0x2',
  //     gas: this.web3.utils.toHex(gasLimit), // gas limit for sending a transaction
  //     // maxPriorityFeePerGas: this.web3.utils.toHex(
  //     //   this.web3.utils.toWei(priorityFee, "gwei")
  //     // ),
  //     // maxFeePerGas: this.web3.utils.toHex(
  //     //   this.web3.utils.toWei(maxFeePerGas, "gwei")
  //     // ), // Gas price --> each gas price in wei, if user gives in gwei we need to mulitply by 10 ** 9 = per gas in wei
  //   });

  //   tokenAddress === "ethereum"
  //     ? (transaction = Object.assign(transaction, {
  //       to: this.web3.utils.toHex(to),
  //       // from: this.web3.utils.toHex(from),
  //       value: amount,
  //       // maxPriorityFeePerGas: this.web3.utils.toWei(priorityFee, "gwei"),
  //       // maxFeePerGas: this.web3.utils.toWei(maxFeePerGas, "gwei"), // Gas price --> each gas price in wei, if user gives in gwei we need to mulitply by 10 ** 9 = per gas in wei
  //     }))
  //     : Object.assign(transaction, {
  //       from: from,
  //       to: tokenAddress,
  //       data: tokenType !== 'COLLECTIBLE' ? await contractInstance.methods
  //         .transfer(
  //           to,
  //           amount
  //         )
  //         .encodeABI() : await contractInstance.methods
  //           .safeTransferFrom(
  //             from,
  //             to,
  //             tokenId
  //           )
  //           .encodeABI(),
  //     });
  //   let txnFee = fromExponential(gasLimit * maxFeePerGas * 10 ** -9);
  //   // this.web3.utils.toBN()
  //   // 1.5 gwei * 21000 gas * 10**-9 = total gas price in eth

  //   const signedTx: any = await this.web3.eth.accounts.signTransaction(
  //     transaction,
  //     this.account.privateKey
  //   );

  //   this.web3.eth
  //     .sendSignedTransaction(signedTx.rawTransaction, (error, hash) => {
  //       if (!error) {
  //         let res = Object.assign(transaction, {
  //           hash,
  //           from,
  //           token: tokenAddress,
  //           status: "pending",
  //           transactionFee: `${txnFee} ether`,
  //           timeStamp: Math.ceil((new Date() as any) / 1000),
  //           tokenType: tokenAddress === 'ethereum' ? this.networkProvider.symbol : tokenType === 'COLLECTIBLE' ? 'COLLECTIBLE' : 'TOKEN',
  //           value: amount,
  //           symbol: tokenSymbol
  //         });

  //         let localData = localStorage.getItem(
  //           `TRANSACTIONS-${this.account.address}-${this.networkProvider.key}`
  //         );
  //         if (localData) {
  //           let isExists = JSON.parse(localData);
  //           isExists.push(res);
  //           localStorage.setItem(
  //             `TRANSACTIONS-${this.account.address}-${this.networkProvider.key}`,
  //             JSON.stringify(isExists)
  //           );
  //         } else {
  //           localStorage.setItem(
  //             `TRANSACTIONS-${this.account.address}-${this.networkProvider.key}`,
  //             JSON.stringify([res])
  //           );
  //         }


  //         onSuccess(hash);
  //       } else {
  //         let res = Object.assign(transaction, {
  //           hash,
  //           from,
  //           token: tokenAddress,
  //           status: "failed",
  //           message: error.toString(),
  //           timeStamp: Math.ceil((new Date() as any) / 1000),
  //           tokenType: tokenAddress === 'ethereum' ? this.networkProvider.symbol : tokenType === 'COLLECTIBLE' ? 'COLLECTIBLE' : 'TOKEN',
  //           value: amount,
  //           symbol: tokenSymbol
  //         });

  //         let localData = localStorage.getItem(
  //           `TRANSACTIONS-${this.account.address}-${this.networkProvider.key}`
  //         );
  //         if (localData) {
  //           let isExists = JSON.parse(localData);
  //           isExists.push(res);
  //           localStorage.setItem(
  //             `TRANSACTIONS-${this.account.address}-${this.networkProvider.key}`,
  //             JSON.stringify(isExists)
  //           );
  //         } else {
  //           localStorage.setItem(
  //             `TRANSACTIONS-${this.account.address}-${this.networkProvider.key}`,
  //             JSON.stringify([res])
  //           );
  //         }

  //         onFailed(error);
  //       }
  //     })
  //     .on("receipt", (payload) => {
  //       onReceipt(payload);
  //     });
  // };

  // storeToken(address: any) {
  //   let tokens = localStorage.getItem("tokens") || "";
  //   localStorage.setItem("tokens", `${tokens},${address}`);
  // }

  // toWei(amount: import("bn.js"), symbol: string) {
  //   if (symbol === "ETH") {
  //     return this.web3.utils.toWei(amount);
  //   } else {
  //     return amount;
  //   }
  // }

  // clearWallet = () => {
  //   try {
  //     this.web3.eth.accounts.wallet.clear();
  //   } catch (error) {
  //   }
  // };

  getExplorerUrl = () => {
    if (!this.networkProvider) return "";
    return `${this.networkProvider.explorerUrl}address/${this.account?.address}`;
  };

  // // =========== Required functions to implement Wallet ==========

  // splitSign(sign: string | any[], nonce: any) {
  //   sign = sign.slice(2);
  //   var r = `0x${sign.slice(0, 64)}`;
  //   var s = `0x${sign.slice(64, 128)}`;
  //   var v = this.web3.utils.toDecimal(`0x${sign.slice(128, 120)}`);
  //   return [v, r, s, nonce];
  // }

  // removeToken = (tokenAddress: any) => {
  //   try {
  //     const tokenStorageKey = `${this.networkProvider.key}-TOKEN-${this.account?.address}`;
  //     let localData = localStorage.getItem(tokenStorageKey);
  //     let data = [];
  //     if (localData) {
  //       data = JSON.parse(localData);
  //       let index = data.findIndex((ele: { tokenAddress: any; }) => ele.tokenAddress === tokenAddress);
  //       if (index >= 0) {
  //         data.splice(index, 1);
  //         localStorage.setItem(tokenStorageKey, JSON.stringify(data));
  //         return
  //       }
  //     }
  //   } catch (error) {
  //   }
  // }

  // getSymbolByAddress = (type = 'TOKEN', address: any) => {
  //   try {
  //     const tokenStorageKey = `${this.networkProvider.key}-TOKEN-${this.account?.address}`;
  //     const collectibleStorageKey = `${this.networkProvider.key}-COLLECTIBLE-${this.account?.address}`;
  //     if (type === 'TOKEN') {
  //       let data: string|null = localStorage.getItem(tokenStorageKey);
  //       let json: any = JSON.parse(data as string)
  //       return this.getSymbol(json, address)
  //     } else if (type == 'COLLECTIBLE') {
  //       let data = localStorage.getItem(collectibleStorageKey);
  //       let json: any = JSON.parse(data as string)
  //       return this.getSymbol(json, address)
  //     }
  //   } catch (error) {
  //   }
  // }

  // getSymbol = (data: any[], address: any) => {
  //   return data.find((ele: { tokenAddress: any; }) => (ele.tokenAddress === address))?.tokenSymbol || this.networkProvider.symbol;
  // }

  // fetchTransactionLog = async (address: any, networkKey: any, start: any) => {
  //   const response = await axios.get(`https://walletqa.guardiannft.org:4000/blockchain/${networkKey}/transaction_logs?from=${address}&start_block=${start}`, {
  //     headers: {
  //       Authorization: `Bearer ${Auth.getToken()}`
  //     }
  //   })
  //   const data = response.data.data
  //   return data;
  // }

  getAllTokens = async (address: any) => {
    try {
      const data: any = await Moralis.EvmApi.token.getWalletTokenBalances({
        address,
        chain: this.networkProvider.chainId
      });
      let temp = [];
      let i = 0, res = data.jsonResponse;
      while (i < res.length) {
        let obj = {};
        if (_.isEmpty(res[i].metadata)) {
          obj = {
            tokenAddress: res[i].token_address,
            tokenPrice: res[i].token_price || "",
            tokenBalance: res[i].balance,
            tokenName: res[i].name,
            tokenSymbol: res[i].symbol,
            tokenType: "TOKEN",
            tokenDecimal: res[i].decimals
          }
        } else {
          let metadata = JSON.parse(res[i].metadata);
          obj = {
            tokenAddress: res[i].token_address,
            tokenPrice: res[i].token_price || "",
            tokenBalance: res[i].balance,
            tokenName: res[i].name,
            tokenSymbol: res[i].symbol,
            tokenType: "TOKEN",
            tokenDecimal: res[i].decimals
          };
        }
        temp.push(obj)
        i++;
      }
      return temp;
    } catch (error) {
      return [];
    }
  }

  getAllNFT = async (address: any) => {
    // if (this.networkProvider.key === "GUARDIAN_TESTNET") {
    //   try {
    //     const decoder = new InputDataDecoder(abi);
    //     const contract_address = "0x26852e5797f5380AbbFc577ff558D29052005cFe";
    //     const owner = this.getAccountAddress();
    //     const txns = await axios.get(`https://qaexplorer.guardiannft.org/api?module=account&action=tokentx&address=${owner}&contractaddress=${contract_address}`)
    //     let temp = [];
    //     let i = 0, res = txns.data.result;
    //     while (i < res.length) {
    //       const txHash = res[i].hash
    //       const contractInstance = new this.web3.eth.Contract(abi as any, contract_address);
    //       const data = await this.web3.eth.getTransaction(txHash)
    //       const decoded = decoder.decodeData(data.input);
    //       if (decoded.inputs.length === 5) {
    //         const tldId = await this.web3.utils.hexToNumberString(decoded.inputs[2]._hex);
    //         const sldId = await contractInstance.methods.getDomainId(decoded.inputs[1], tldId).call();
    //         const tokenUri = await contractInstance.methods.tokenURI(sldId).call();
    //         const tokenMetadata = await axios.get(tokenUri)
    //         const base = tokenMetadata.data.image;
    //         const originalBase = base.replace('data:image/svg+xml;base64,', '');
    //         const svg = base64.decode(originalBase);
    //         const originalSVG = svg.replace(/\n/g, "");

    //         let obj = {
    //           tokenAddress: res[i].to,
    //           tokenId: sldId || "",
    //           tokenUri: tokenUri || "",
    //           tokenBalance: res[i].amount || "",
    //           tokenSymbol: res[i].tokenSymbol || "",
    //           tokenType: "COLLECTIBLE",
    //           tokenName: res[i].tokenName,
    //           tokenDescription: res[i].description || "",
    //           tokenImage: originalSVG
    //         };
    //         temp.push(obj)
    //       }
    //       i++;
    //     }
    //     return temp;
    //   } catch (error) {
    //     console.error("error", error)
    //   }
    // }
    try {
      const data: any = await Moralis.EvmApi.nft.getWalletNFTs({
        address,
        chain: this.networkProvider.chainId
      });
      let temp = [];
      let i = 0, res = data.jsonResponse.result;
      while (i < res.length) {
        let obj = {};
        if (_.isEmpty(res[i].metadata)) {
          obj = {
            tokenAddress: res[i].token_address,
            tokenId: res[i].token_id,
            tokenUri: res[i].token_uri,
            tokenBalance: res[i].amount,
            tokenName: res[i].name,
            tokenSymbol: res[i].symbol,
            tokenType: "COLLECTIBLE",
            tokenImage: "nft_not_found"
          }
        } else {
          let metadata = JSON.parse(res[i].metadata);
          obj = {
            tokenAddress: res[i].token_address,
            tokenId: res[i].token_id,
            tokenUri: res[i].token_uri,
            tokenBalance: res[i].amount,
            tokenSymbol: res[i].symbol,
            tokenType: "COLLECTIBLE",
            tokenName: metadata.name,
            tokenDescription: metadata.description,
            tokenImage: metadata?.asset || metadata.image
          };
        }
        temp.push(obj)
        i++;
      }
      return temp;
    } catch (error) {
      return [];
    }
  }

  // getActivities = async () => {
  //   try {
  //     const address = this.getAccountAddress();
  //     let block = localStorage.getItem(`BLOCK-${address}-${this.networkProvider.key}`);
  //     let existingActivities = localStorage.getItem(`TRANSACTIONS-${address}-${this.networkProvider.key}`)
  //     var { data } = await this.getActivitiesFromEtherscan(block);
  //     if(!existingActivities) existingActivities = "[]";
  //     var deposits = [];
  //     let latestBlock = data.result.length > 0 ? Math.max(...data.result.map((ele: { blockNumber: any; }) => ele.blockNumber)) : undefined;
  //     latestBlock = latestBlock ? Number(latestBlock) + 1 : undefined
  //     for (let x = 0; x < data.result.length; x++) {
  //       let result = data.result[x]
  //       let toAddress = result.to ? this.web3.utils.toChecksumAddress(result.to) : "";
  //       if (address === toAddress) {
  //         deposits.push(result);
  //       }
  //     }
  //     if (deposits.length <= 0) return existingActivities;
  //     let existingActivitiesObj: any[] = JSON.parse(existingActivities)
  //     let res: any[] = [];
  //     res = deposits.filter(el => {
  //       return !existingActivitiesObj.find((element: { hash: any; }) => {
  //         return element.hash === el.hash;
  //       });
  //     });
  //     // if(!_.isEmpty(res)) existingActivities.push(res);
  //     let final = existingActivitiesObj.concat(res);
  //     if (latestBlock) this.storingLatestBlock(address, latestBlock.toString())
  //     localStorage.setItem(`TRANSACTIONS-${address}-${this.networkProvider.key}`, JSON.stringify(final))
  //     return final;
  //   } catch (error) {
  //     return {}
  //   }
  // }

  getActivitiesFromMoralis = async (start_block: any) => {
    return await axios.post(`https://deep-index.moralis.io/api/v2/${this.getAccountAddress()}}?chain=${this.networkProvider.chainId}&from_block=${start_block}`, { headers: { "X-Api-Key": MORALIS } });
  }

  getActivitiesFromEtherscan = async (start_block: string | null) => {
    return await axios.post(`${this.networkProvider.explorerApi}?module=account&action=txlist&startblock=${start_block}&address=${this.getAccountAddress()}&tag=latest`);
  }
  deployAccount = () => {
    return
  }
  isEnoughBalance = async () => {
    return
  }
}
