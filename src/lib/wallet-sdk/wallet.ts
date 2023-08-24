/* eslint-disable no-unused-vars */
import _ from "lodash";
import { EthereumWallet } from "./EthereumWallet";
// import { StarknetWallet } from "./StarknetWallet";
import downloader from "downloadjs";
import moment from "moment";
import ABI from "./Abi.json";
import ERC721_ABI from "./ERC721_ABI.json";
import fromExponential from "from-exponential";
// import { Auth } from "./Auth";
import storage, { Storage } from "./storage/storage";
import { Auth } from "./Auth";
import { collectiblesManager } from "./storage/collectibles-manager";
import { http } from "./config";
import { tokensManager } from "./storage/tokens-manager";
import { ImportTokenFormType } from "./types/token-type";
import { ImportCollectibleFormType } from "./types/collectible-type";
import { activityManager } from "./storage/activity-manager";
import { transactionManager } from "./storage/transaction-manager";

export class Wallet {

  static defaultBCNetwork = async () => {
    return (await Wallet.isEthereumBC()) ? "0x5" : "0x534e5f474f45524c49";
  }

  static AddressType = {
    ENSDomain: "ensDomain",
    GNSDomain: "gnsDomain",
    UnstoppableDomain: "unstoppableDomain",
    EthAddress: "eth_address",
  };

  static NETWORK_STORAGE_KEY = "network"
  static ACCOUNT_SELECTION_STORAGE_KEY = "account_index"
  networkProvider: any;
  symbol: any;
  uKey: any;
  walletInst: any;
  totalValue: number;
  walletPassword: any;
  localStorage: Storage = storage;

  constructor(networkName) {
    this.networkProvider;
    this.symbol = null;

    this.setProvider(networkName);

    this.uKey = null;

    // Wallet
    this.walletInst = null;
    this.totalValue = 0;
    this.walletPassword = null;
    this.setWalletInstance(this.networkProvider);
  }

  updateUKey = (uKey) => {
    this.walletInst.uKey = uKey
  }

  toCompatibleAmount = (amount) => {
    return this.walletInst.toCompatibleAmount(amount);
  }

  getAccountAddress = () => {
    return this.walletInst?.account?.address;
  };

  displayAddress = () => {
    let address = this.getAccountAddress();

    if (!address) return "";
    let prefix = address.substring(0, 4);
    let sufix = address.substring(
      address.length - 4
    );

    return `${prefix}...${sufix}`;
  };

  static displayAddressWithEllipsis = (address, length = 4) => {
    if (!address) return "";
    let prefix = address.substring(0, length);
    let sufix = address.substring(address.length - length);

    return `${prefix}...${sufix}`;
  };

  // TODO: Revisit
  changeAccount = (account) => {
    this.walletInst.account = account;
  };

  web3Provider = () => {
    return this.walletInst.web3
  }

  hexChainId = async () => {
    return await this.walletInst.hexChainId();
  }

  removeAccount = async (remAccount) => {
    await this.walletInst.removeAccount(remAccount);
    return this
  }

  // Ethereum only function. Move to EthereumWallet.js
  getTrasactionReceipt = (hash) => {
    return this.walletInst.web3.eth.getTrasactionReceipt(hash);
  };

  walletName = () => {
    return this.walletInst.walletName();
  };

  // Abstract
  setProvider = async (networkName) => {
    let network = await Wallet.getNetworkProviders();
    this.networkProvider = (await Wallet.getNetworkProviders()).get(networkName);
    this.symbol = this.networkProvider?.symbol;
    this.walletInst?.setProvider(this.networkProvider);
  };

  updateProvider = async (network) => {
    this.networkProvider = network
    this.symbol = this.networkProvider?.symbol;
    this.walletInst?.updateProvider(this.networkProvider);
  };

  setWalletInstance = async (networkProvider) => {
    // TODO: Refactor later
    // if (networkProvider.key.match(/^STARKNET/)) {
    //   this.walletInst = new StarknetWallet(networkProvider);
    // } else {
    this.walletInst = new EthereumWallet(networkProvider);
    this.networkProvider = (await Wallet.getNetworkProviders()).get(networkProvider);
    this.walletInst.web3.setProvider(this.networkProvider?.url);
    // }
  }

  getPkey = () => {
    return this.walletInst.getPKey();
  }

  getPKeyBN = () => {
    return this.walletInst.getPKeyBN().toString();
  }

  createWallet = async () => {
    try {
      const [pkey, _walletInst] = await this.walletInst.createWallet();
      return [pkey, this];
    } catch (error) {
      console.error(error);
      throw new Error("Unable to create wallet");
    }
  };

  exportWallet = (password) => {
    return this.walletInst.exportWallet(password);
  };

  static downloadKeyShare = (recovery) => {
    let fileName = `Wallet_Recovery_${moment().format("YYYYMMDDHHmmss")}.txt`;
    downloader(recovery, fileName, "text/plain");
  }

  loadWallet(encryptedWallet: any, password: string) {
    this.walletInst.loadWallet(encryptedWallet, password)
  }

  encryptedWallet = (password) => {
    return this.walletInst.encryptedWallet(password)
  };

  encryptedAccount = (password: string) => {
    return this.walletInst.encryptedAccount(password)
  };

  getWallet = () => {
    return this.walletInst.getWallet();
  };

  wallet = () => {
    return this.walletInst.wallet;
  }

  account = () => {
    return this.walletInst.account;
  }

  getAcctAddresses = () => {
    return this.walletInst.getAcctAddresses();
  };

  walletFromPkey = (pKey) => {
    return this.walletInst.walletFromPkey(pKey);
  };

  getAccountFromJson = (json, password) => {
    return this.walletInst.getAccountFromJson(json, password)
  };

  getFromPrivateKey = (privateKey, password) => {
    return this.walletInst.getFromPrivateKey(privateKey, password);
  }

  importAccountFromJson = (json, password) => {
    return [this.walletInst.importAccountFromJson(json, password), this]
  };

  importFromPrivateKey = (privateKey, password) => {
    return [this.walletInst.importFromPrivateKey(privateKey, password), this];
  };

  getBalance = async (type = "ethereum") => {
    try {
      this.totalValue = this.walletInst.getBalance(type);
      return this.totalValue;
    } catch (error) {
      return 0;
    }
  };

  getPrice = async (type: string = "0x1", contractAddresses?: string) => {
    return this.walletInst.getPrice(type, contractAddresses);
  };

  // TODO: This method is only for Ethereum
  getAddressFromEns = async (ensDomain: string) => {
    return await this.walletInst.getAddressFromEns(ensDomain);
  };

  // TODO: This method is only for Ethereum
  getAddressFromGns = async (gnsDomain: string) => {
    return await this.walletInst.getAddressFromGns(gnsDomain);
  };

  // TODO: This method is only for Ethereum
  isEnsDomainExists = async (ensDomain: string) => {
    return await this.walletInst.isEnsDomainExists(ensDomain);
  };

  async sendSignedTransaction() {
    return this.walletInst.sendSignedTransaction();
  }

  signMessage = async (message: any) => {
    return this.walletInst.signMessage(message);
  };

  signEthMessage = async (message: any) => {
    const response = await this.walletInst.web3.eth.sign(message, this.walletInst.account.address)
    return response
  };

  signTransaction = async (transactionHash: any) => {
    return this.walletInst.signTransaction(transactionHash);
  };


  importToken = async (
    tokenAddress,
    type = "ETHEREUM_MAINNET",
    user_address
  ) => {
    try {
      let tokenDetail = await this.walletInst.importToken(tokenAddress, type, user_address);
      return tokenDetail;
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

  importCollectible = async (
    tokenAddress,
    type = "ETHEREUM_MAINNET",
    user_address,
    tokenId
  ) => {
    if (await Auth.getBlockchainType() === "StarkNet") {
      let tokenDetail = await this.walletInst.importCollectible()
      return tokenDetail
    }

    try {
      let tokenDetail = await this.walletInst.importCollectible(tokenAddress, type, user_address, tokenId);
      return tokenDetail;
    } catch (error) {
      return {
        tokenBalance: 0,
      };
    }
  };

  isValidAddress = async (addressType, address) => {
    address = address.trim();

    if (Wallet.AddressType.ENSDomain === addressType) {
      return await this.isEnsDomainExists(address);
    } else if (Wallet.AddressType.GNSDomain === addressType) {
      return true;
    } else if (Wallet.AddressType.EthAddress === addressType) {
      return await this.walletInst.isValidAddress(address)
    } else {
      return false;
    }
  };

  getNonce = async (address) => {
    const nonce = await this.walletInst.web3.eth.getTransactionCount(address, "latest");
    return nonce;
  };

  ethToWei = async (amount) => {
    return this.walletInst.web3.utils.toWei(amount, "ether");
  };

  estimateGas = async (from, to, amount, tokenAddress, tokenType = 'TOKEN') => {
    try {
      let contractInstance = tokenType === 'TOKEN' ? new this.walletInst.web3.eth.Contract(ABI, tokenAddress, {
        from: from,
      }) : new this.walletInst.web3.walletInst.eth.Contract(ERC721_ABI, tokenAddress, {
        from: from,
      });;

      amount = this.walletInst.web3.utils.toBN(amount);
      amount = fromExponential(amount);
      let gasTransaction = Object.assign({
        from: from,
        to: tokenAddress,
        data: tokenType === 'TOKEN' ? await contractInstance.methods.transfer(to, amount).encodeABI() :
          await contractInstance.methods
            .safeTransferFrom(
              from,
              to,
              0
            )
            .encodeABI(),
      });

      let estimateGas = await this.walletInst.web3.eth.estimateGas(gasTransaction);

      return estimateGas;
    } catch (error) {
      throw error;
    }
  };

  transfer = async (
    from,
    to,
    amount,
    onSuccess,
    onFailed,
    onReceipt,
    tokenAddress,
    maxFeePerGas,
    gasLimit,
    priorityFee,
    tokenType,
    tokenId,
    tokenSymbol
  ) => {
    this.walletInst.transfer(
      from,
      to,
      amount,
      onSuccess,
      onFailed,
      onReceipt,
      tokenAddress,
      maxFeePerGas,
      gasLimit,
      priorityFee,
      tokenType,
      tokenId,
      tokenSymbol);
  };

  // Store token
  storeToken(address) {
    let tokens = this.localStorage.getItem("tokens") || "";
    this.localStorage.setItem("tokens", `${tokens},${address}`);
  }

  toWei(amount, symbol) {
    if (symbol === "ETH") {
      return this.walletInst.web3.utils.toWei(amount);
    } else {
      return amount;
    }
  }

  getAllNFT = async (address: any, force: Boolean) => {
    let localNfts = await collectiblesManager.get(address, [this.networkProvider.chainId]) || [];
    if (force) {
      let nfts = await this.walletInst.getAllNFT(address);
      await collectiblesManager.set(address, [this.networkProvider.chainId], nfts);
      return nfts;
    }
    return _.uniqBy(localNfts, (el: ImportCollectibleFormType) => el.tokenAddress);
  }

  // getAllTokens = async (address: any, force: Boolean) => {
  //   let localTokens = force ? null : await tokensManager.get(address, [this.networkProvider.chainId]);

  //   if(!localTokens) {
  //     localTokens = await (async () => {
  //       let tokens = await this.walletInst.getAllTokens(address);
  //       await tokensManager.set(address, [this.networkProvider.chainId], tokens);
  //       return tokens
  //     })();
  //   }

  //   localTokens = _.uniqBy(localTokens, (el: ImportTokenFormType) => el.tokenAddress)
  //   return localTokens;
  // }

  getAllTokens = async (address: any, force: Boolean) => {
    let localTokens = await tokensManager.get(address, [this.networkProvider.chainId]) || [];
    if (force) {
      let tokens = await this.walletInst.getAllTokens(address);
      localTokens = localTokens.concat(tokens);
      localTokens = _.uniqBy(localTokens, (el: ImportTokenFormType) => el.tokenAddress);
      await tokensManager.set(address, [this.networkProvider.chainId], localTokens);
    }
    return _.uniqBy(localTokens, (el: ImportTokenFormType) => el.tokenAddress);
  }

  clearWallet = () => {
    try {
      this.walletInst.web3.eth.accounts.wallet.clear();
    } catch (error) {
    }
  };

  getExplorerUrl = () => {
    return this.walletInst.getExplorerUrl();
  };

  // =========== Required functions to implement Wallet ==========

  splitSign(sign, nonce) {
    sign = sign.slice(2);
    var r = `0x${sign.slice(0, 64)}`;
    var s = `0x${sign.slice(64, 128)}`;
    var v = this.walletInst.web3.utils.toDecimal(`0x${sign.slice(128, 120)}`);
    return [v, r, s, nonce];
  }

  removeToken = async (tokenAddress) => {
    try {
      const tokenStorageKey = `${this.networkProvider.key}-TOKEN-${this.walletInst.getAccountAddress()}`;
      let localData = await this.localStorage.getItem(tokenStorageKey);
      let data = [];
      if (localData) {
        data = JSON.parse(localData);
        let index = data.findIndex(ele => ele.tokenAddress === tokenAddress);
        if (index >= 0) {
          data.splice(index, 1);
          this.localStorage.setItem(tokenStorageKey, JSON.stringify(data));
          return
        }
      }
    } catch (error) {
    }
  }

  getSymbolByAddress = async (type = 'TOKEN', address) => {
    try {
      const tokenStorageKey = `${this.networkProvider.key}-TOKEN-${this.getAccountAddress()}`;
      const collectibleStorageKey = `${this.networkProvider.key}-COLLECTIBLE-${this.getAccountAddress()}`;
      if (type === 'TOKEN') {
        let data = await this.localStorage.getItem(tokenStorageKey);
        data = data ? JSON.parse(data) : []
        return this.getSymbol(data, address)
      } else if (type == 'COLLECTIBLE') {
        let data = await this.localStorage.getItem(collectibleStorageKey);
        data = data ? JSON.parse(data) : []
        return this.getSymbol(data, address)
      }
    } catch (error) {
    }
  }

  getSymbol = (data, address) => {
    return data.find(ele => (ele.tokenAddress === address))?.tokenSymbol || this.networkProvider.symbol;
  }

  static async getCustomNetworkProviders() {
    // if (typeof window !== 'undefined') {
    let networks = await storage.getItem("customNetworks");
    if (networks) return new Map(Object.entries(JSON.parse(networks)));
    // } else {
    //   return new Map();
    // }
  }

  storingLatestBlock = (address, block = null) => {
    this.walletInst.storingLatestBlock(address, block);
  }

  getActivityFromStorage = async () => {
    const address = this.getAccountAddress();
    return await activityManager.get(address, [this.networkProvider.chainId]) || [];
  }

  getActivities = async (force: Boolean) => {
    try {
      const address = this.getAccountAddress();
      let block = await transactionManager.get(address, [this.networkProvider.chainId]) || '0';
      // console.log("block", block)
      let existingActivities: any = await activityManager.get(address, [this.networkProvider.chainId]) || [];
      let latestBlock;
      if (force) {
        var { data } = await this.getActivitiesFromEtherscan(Number(block), address);
        // console.log("existingActivities", data)
        if (!existingActivities) existingActivities = [];
        var deposits = [];
        latestBlock = data.result.length > 0 ? Math.max(...data.result.map(ele => ele.blockNumber)) : undefined;
        latestBlock = latestBlock ? Number(latestBlock) + 1 : undefined
        for (let x = 0; x < data.result.length; x++) {
          let result = data.result[x]
          let toAddress = result.to ? this.walletInst.web3.utils.toChecksumAddress(result.to) : "";
          if (address === toAddress) {
            deposits.push(result);
          }
        }
        if (deposits.length <= 0) return existingActivities;
        // let res: any = [];
        existingActivities = existingActivities.concat(deposits);
        existingActivities = _.uniqBy(existingActivities, (el: any) => el.hash);

        if (latestBlock) this.storingLatestBlock(address, latestBlock)
        await activityManager.set(address, [this.networkProvider.chainId], existingActivities);
      }
      return existingActivities;
    } catch (error) {
      console.log(error)
      return this.getActivityFromStorage()
    }
  }

  getActivitiesFromEtherscan = async (start_block = 0, address) => {
    return await http.post(`${this.networkProvider.explorerApi}?module=account&action=txlist&startblock=${start_block}&address=${address}&tag=latest`);
  }

  static isEthereumBC = async () => {
    // if (typeof window !== 'undefined') {
    return await storage.getItem('chainType') == null || await storage.getItem('chainType') == 'Ethereum'
    // } else {
    //   return true;
    // }
  }

  // TODO: Create type for a network
  static Networks: Map<string, { key: string; name: string; url: string; gasTrackerApi: string; explorerApi: string; explorerUrl: string; symbol: string; currency: string; chainId: string; priceId: string; networkType: string; decimals: number; baseUrl?: undefined; feederGatewayUrl?: undefined; gatewayUrl?: undefined; } | { key: string; name: string; url: string; gasTrackerApi: string; explorerApi: string; explorerUrl: string; symbol: string; currency: string; chainId: string; priceId: string; networkType: string; decimals?: undefined; baseUrl?: undefined; feederGatewayUrl?: undefined; gatewayUrl?: undefined; } | {
    key: string; name: string; url: string; gasTrackerApi: string; explorerApi: string; explorerUrl: string; symbol: string; currency: string; chainId: string; priceId: string;
    // "networkType": "main",
    decimals: number; networkType?: undefined; baseUrl?: undefined; feederGatewayUrl?: undefined; gatewayUrl?: undefined;
  } | { key: string; name: string; explorerUrl: string; baseUrl: string; feederGatewayUrl: string; symbol: string; currency: string; chainId: string; priceId: string; networkType: string; decimals: number; url?: undefined; gasTrackerApi?: undefined; explorerApi?: undefined; gatewayUrl?: undefined; } | { key: string; name: string; explorerUrl: string; symbol: string; currency: string; baseUrl: string; chainId: string; feederGatewayUrl: string; gatewayUrl: string; priceId: string; networkType: string; decimals: number; url?: undefined; gasTrackerApi?: undefined; explorerApi?: undefined; }>;

  static async getNetworkProviders() {
    Wallet.Networks = new Map([
      [
        "0x1",
        {
          "key": "0x1",
          "name": "Main Ethereum Network",
          "url": "https://mainnet.infura.io/v3/2ff47e51ff1f4804865ba892c7efc70c",
          "gasTrackerApi": "https://api.etherscan.io/api",
          "explorerApi": "https://api.etherscan.io/api",
          "explorerUrl": "https://etherscan.io/",
          "symbol": "ETH",
          "currency": "Ethereum (ETH)",
          "chainId": "0x1",
          "priceId": "ethereum",
          "networkType": "main",
          "decimals": 18
        }
      ],
      [
        "0x5",
        {
          "key": "0x5",
          "name": "Goerli Test Network",
          "url": "https://goerli.infura.io/v3/2ff47e51ff1f4804865ba892c7efc70c",
          "gasTrackerApi": "https://api.etherscan.io/api",
          "explorerApi": "https://api-goerli.etherscan.io/api",
          "explorerUrl": "https://goerli.etherscan.io/",
          "symbol": "GoerliETH",
          "currency": "Ethereum (ETH)",
          "chainId": "0x5",
          "priceId": "ethereum",
          "networkType": "",
          "decimals": 18
        }
      ],
      [
        "0x42",
        {
          "key": "0x42",
          "name": "Sepolia Test Network",
          "url": "https://sepolia.infura.io/v3/2ff47e51ff1f4804865ba892c7efc70c",
          "gasTrackerApi": "https://api.etherscan.io/api",
          "explorerApi": "https://api-sepolia.etherscan.io/api",
          "explorerUrl": "https://sepolia.etherscan.io/",
          "symbol": "SepoliaETH",
          "currency": "Ethereum (ETH)",
          "chainId": "0x42",
          "priceId": "ethereum",
          "networkType": "",
          "decimals": 18
        }
      ],
      [
        "0x89",
        {
          "key": "0x89",
          "name": "Polygon Main Network",
          "url": "https://polygon-rpc.com/",
          "gasTrackerApi": "https://api.polygonscan.com/api",
          "explorerApi": "https://api.polygonscan.com/api",
          "explorerUrl": "https://polygonscan.com/",
          "symbol": "MATIC",
          "currency": "MATIC",
          "chainId": "0x89",
          "priceId": "matic-network",
          "networkType": "main",
          "decimals": 18
        }
      ],
      [
        "0x13881",
        {
          "key": "0x13881",
          "name": "Mumbai Test Network",
          "url": "https://rpc-mumbai.maticvigil.com/",
          "gasTrackerApi": "https://api.polygonscan.com/api",
          "explorerApi": "https://api-mumbai.polygonscan.com/api",
          "explorerUrl": "https://mumbai.polygonscan.com/",
          "symbol": "MATIC",
          "currency": "MATIC",
          "chainId": "0x13881",
          "priceId": "matic-network",
          "networkType": "",
          "decimals": 18
        }
      ],
      [
        "0x1a4",
        {
          "key": "0x1a4",
          "name": "Optimism Test Network",
          "url": "https://goerli.optimism.io",
          "gasTrackerApi": "",
          "explorerApi": "",
          "explorerUrl": "https://goerli-optimism.etherscan.io/",
          "symbol": "ETH",
          "currency": "Ethereum (ETH)",
          "chainId": "0x1a4",
          "priceId": "optimism",
          "networkType": ""
        }
      ],
      [
        "0xa",
        {
          "key": "0xa",
          "name": "Optimism Main Network",
          "url": "https://mainnet.optimism.io/",
          "gasTrackerApi": "",
          "explorerApi": "",
          "explorerUrl": "https://optimistic.etherscan.io/",
          "symbol": "ETH",
          "currency": "Ethereum (ETH)",
          "chainId": "0xa",
          "priceId": "optimism",
          "networkType": "main"
        }
      ],
      [
        "0x38",
        {
          "key": "0x38",
          "name": "Binance Main Network",
          "url": "https://bsc-dataseed.binance.org/",
          "gasTrackerApi": "https://api.bscscan.com/api",
          "explorerApi": "https://api.bscscan.com/api",
          "explorerUrl": "https://bscscan.com/",
          "symbol": "BNB",
          "currency": "Binance (BNB)",
          "chainId": "0x38",
          "priceId": "binancecoin",
          "networkType": "main",
          "decimals": 18
        }
      ],
      [
        "0x61",
        {
          "key": "0x61",
          "name": "Binance Test Network",
          "url": "https://bsc-testnet.public.blastapi.io/",
          "gasTrackerApi": "https://api.bscscan.com/api",
          "explorerApi": "https://api-testnet.bscscan.com/api",
          "explorerUrl": "https://testnet.bscscan.com/",
          "symbol": "BNB",
          "currency": "Binance (BNB)",
          "chainId": "0x61",
          "priceId": "binancecoin",
          "networkType": "",
          "decimals": 18
        }
      ],
      [
        "0xa86a",
        {
          "key": "0xa86a",
          "name": "Avalanche Main Network",
          "url": "https://avalanche-mainnet.infura.io",
          "gasTrackerApi": "",
          "explorerApi": "",
          "explorerUrl": "https://snowtrace.io/",
          "symbol": "AVAX",
          "currency": "Avalanche (AVAX)",
          "chainId": "0xa86a",
          "priceId": "avalanche-2",
          "networkType": "main"
        }
      ],
      [
        "0x869",
        {
          "key": "0x869",
          "name": "Avalanche Test Network",
          "url": "https://api.avax-test.network/ext/bc/C/rpc",
          "gasTrackerApi": "",
          "explorerApi": "",
          "explorerUrl": "https://testnet.snowtrace.io/",
          "symbol": "AVAX",
          "currency": "Avalanche (AVAX)",
          "chainId": "0x869",
          "priceId": "avalanche-2",
          "networkType": ""
        }
      ],
      [
        "0xfa0",
        {
          "key": "0xfa0",
          "name": "Guardian Testnet",
          "url": "https://staging.edge.guardianlink.io",
          "gasTrackerApi": "https://qaexplorer.guardiannft.org/api",
          "explorerApi": "https://qaexplorer.guardiannft.org/api",
          "explorerUrl": "https://qaexplorer.guardiannft.org/",
          "symbol": "MATIC",
          "currency": "Matic",
          "chainId": "0xfa0",
          "priceId": "guardian",
          // "networkType": "main",
          "decimals": 18
        }
      ]
      // ], [
      //   "0x534e5f4d41494e",
      //   {
      //     key: "0x534e5f4d41494e",
      //     name: "Starknet Mainnet",
      //     explorerUrl: "https://voyager.online/",
      //     baseUrl: "https://alpha-mainnet.starknet.io",
      //     feederGatewayUrl: "https://alpha-mainnet.starknet.io/feeder_gateway",
      //     symbol: "ETH",
      //     currency: "Ethereum (ETH)",
      //     chainId: "0x534e5f4d41494e",
      //     priceId: "ethereum",
      //     networkType: "main",
      //     decimals: 18
      //   },
      // ], [
      //   "0x534e5f474f45524c49",
      //   {
      //     key: "0x534e5f474f45524c49",
      //     name: "Starknet Goerli Network",
      //     explorerUrl: "https://testnet.starkscan.co/",
      //     symbol: "ETH",
      //     currency: "Ethereum (ETH)",
      //     baseUrl: "https://alpha4.starknet.io",
      //     chainId: "0x534e5f474f45524c49",
      //     feederGatewayUrl: "https://alpha4.starknet.io/feeder_gateway",
      //     gatewayUrl: "https://alpha4.starknet.io/gateway",
      //     priceId: "ethereum",
      //     networkType: "goerli-testnet",
      //     decimals: 18
      //   },
      // ]
    ]);

    let customNetworks = await this.getCustomNetworkProviders();
    var networks = customNetworks ? new Map([...Wallet.Networks, ...customNetworks]) : Wallet.Networks;

    let filteredMap = new Map([])

    // TODO: This is required for non mobile devices.
    // if (typeof window === "undefined") return networks

    const bcSpecNetworks = [...networks].filter(async ([k, v]) => {
      return (await Wallet.isEthereumBC()) ? !(k as string).match(/STARK/i) : (k as string).match(/STARK/i);
    });
    networks = new Map(
      bcSpecNetworks
    );
    for (let k of networks.keys()) {
      if (true) {
        filteredMap.set(k, networks.get(k))
      }
    }
    return filteredMap
  }
}
