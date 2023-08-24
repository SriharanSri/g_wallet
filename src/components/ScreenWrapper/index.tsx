import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useContext, useEffect, useRef, useState } from "react";
import React, {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  updateImportAccounts,
  userAuthenticated,
} from "../../lib/wallet-sdk/authSlice";
import { RootState } from "../../lib/wallet-sdk/store";
import { Spacer } from "../Spacer";
import { Text } from "../Text";
import SecureStorage from "react-native-encrypted-storage";
import {
  changeNetwork,
  setCollectibles,
  setTokens,
  updateBalance,
  updateWallet,
} from "../../lib/wallet-sdk/coreSlice";
import { DEFAULT_NETWORK, ENABLE_BALANCE_UPDATE } from "@env";
import { Wallet } from "../../lib/wallet-sdk/wallet";
import { Auth } from "../../lib/wallet-sdk/Auth";
import storage from "../../lib/wallet-sdk/storage/storage";
import { LoadingIndicatorContext } from "../../App";
import { ImportTokenFormType } from "../../lib/wallet-sdk/types/token-type";
import { tokensManager } from "../../lib/wallet-sdk/storage/tokens-manager";
import { ImportCollectibleFormType } from "../../lib/wallet-sdk/types/collectible-type";
import { collectiblesManager } from "../../lib/wallet-sdk/storage/collectibles-manager";
import { activityManager } from "../../lib/wallet-sdk/storage/activity-manager";
import { useAlert } from "../../hooks/useAlert";
import { userManager } from "../../lib/wallet-sdk/storage/user-manager";
import Chat from "../../lib/chat-sdk/chat";
import RNfs from "react-native-fs";
import {
  updateChatConfig,
  updateMessages,
} from "../../lib/wallet-sdk/chatSlice";
import ChatConfig from "../../lib/chat-sdk/chat";
import { io } from "socket.io-client/dist/socket.io";
import { contactManager } from "../../lib/wallet-sdk/storage/contact-manager";
import { CHAT_API } from "@env";
import { chatManager } from "../../lib/wallet-sdk/storage/chat-manager";

export const ScreenWrapper = ({ children }: any) => {
  const { toast } = useAlert();
  const [loading, setLoading] = useState(true);
  const internalLoading = useContext(LoadingIndicatorContext);
  const { wallet, keyInfra, networkProvider } = useSelector(
    (state: RootState) => state.coreReducer
  );
  const { auth, authenticated } = useSelector(
    (state: RootState) => state.authReducer
  );

  // const { socket } = useSelector(
  //   (state: RootState) => state.chatReducer
  // );
  // const chat = new Chat(wallet, socket);
  const dispatch = useDispatch();
  const navigation: any = useNavigation();
  var updateBalanceInterval = useRef<undefined | NodeJS.Timer>();

  useEffect(() => {
    if (Platform.OS === "android") {
      const check = PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );

      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("wallet")
      .then(async (response) => {
        await setInitialProvider();
        if (!response) {
          let verifyResponse = await auth.verifyLogin();
          if (verifyResponse.status) {
            let hashified = keyInfra
              .hashify(verifyResponse?.data.ukey)
              .toString();
            await SecureStorage.setItem("ukey", hashified);
            keyInfra.setUkey(hashified);
            let key = await Auth.getUserStorageKey();
            console.log("start wrapper", (await userManager.get(key)).metadata);
            userAuthenticated({
              displayName: await Auth.getDisplayUserName(),
              metadata: (await userManager.get(key)).metadata,
              uKey: hashified,
            });
            setLoading(false);
          } else {
            setLoading(false);

            navigation.navigate("Signin");
            // navigation.navigate("BackupRecoveryKeyshare");
            return;
          }

          let metaData: any;

          try {
            metaData = await keyInfra.getMetaData();
          } catch (e) {
            setLoading(false);
            toast({
              position: "bottom",
              type: "error",
              title: "Storage unreachable",
            });

            auth.errorSignout();
            return;
          }

          if (metaData.data.length === 0) {
            setLoading(false);
            navigation.navigate("CreateWallet", {
              importMode: false,
            });
            return;
          } else {
            const isKeyShareExist = await keyInfra.getFromLocal();
            if (isKeyShareExist) {
              let secret = await keyInfra.reconstructKey();
              if (!secret) {
                setLoading(false);
                toast({
                  position: "bottom",
                  type: "error",
                  title: "Unable to reconstruct the secret",
                });
                auth.errorSignout();
                return;
              }
              let _tWallet = wallet.walletFromPkey(secret);
              dispatch(updateWallet({ wallet: wallet }));
              dispatch(
                updateImportAccounts(
                  (await userManager.get(await Auth.getUserStorageKey()))
                    .importedAccounts
                )
              );
              navigation.reset({
                index: 0,
                routes: [{ name: "Home" }],
              });
            } else {
              setLoading(false);
              navigation.navigate("Recovery");
              return;
            }
          }
          setLoading(false);
          return;
        } else {
          const encryptedWallet = JSON.parse(response);
          const uKey = (await SecureStorage.getItem("ukey")) ?? "";
          const accountIndex = parseInt(
            (await storage.getItem(Wallet.ACCOUNT_SELECTION_STORAGE_KEY)) ?? "0"
          );
          keyInfra.setUkey(uKey);
          const result = await wallet.walletInst.loadWallet(
            encryptedWallet,
            uKey,
            accountIndex
          );
          let key = await Auth.getUserStorageKey();
          dispatch(
            userAuthenticated({
              displayName: await Auth.getDisplayUserName(),
              metadata: (await userManager.get(key)).metadata,
              uKey: uKey,
            })
          );
          dispatch(updateWallet({ wallet: wallet }));
          dispatch(
            updateImportAccounts(
              (await userManager.get(await Auth.getUserStorageKey()))
                .importedAccounts
            )
          );
          navigation.reset({
            index: 0,
            routes: [{ name: "Home" }],
          });
        }

        //Wait for navigation animation
        setTimeout(() => {
          setLoading(false);
        }, 400);
      })
      .catch((err) => {
        setLoading(false);
        console.log(err);
      });
  }, []);

  const connectChat = () => {
    console.log("Screen wrapper", CHAT_API);
    const chat = new ChatConfig(
      wallet,
      io(`${CHAT_API}?sender=${wallet.walletInst.account.address}`)
    );
    chat.connect(async (id) => {
      console.log("Connect id in screenwrapper : ", id, "--->");
      let chat_data = await chatManager.get(wallet.walletInst.account.address);
      dispatch(updateMessages(chat_data));
      const data = await contactManager.get(
        `${await Auth.getLoginId()}_${await Auth.getLoginType()}`
      );
      if (data) {
        for (let i = 0; i < data.length; i++) {
          console.log(data[i].address);
          chat.joinChat(wallet.walletInst.account.address, data[i].address);
        }
      }
      // chat.afterConnect((msg) => {
      //   console.log("after connect", msg)
      // })
    });
    chat.receiveMessages(async (msg) => {
      console.log("reaceived message is message is...", msg);
      let isArray = Array.isArray(msg);
      if (isArray) {
        for (let i = 0; i < msg.length; i++) {
          await storeData("receive", msg[i]);
          chat.updateSync([msg[i]._id]);
        }
        return;
      }
      storeData("receive", msg);
      chat.updateSync([msg._id]);

      // scrollViewRef.current.scrollToEnd({ animated: true })
    });
    dispatch(updateChatConfig(chat));
  };

  const storeData = async (type: "receive" | "send", messageData: any) => {
    try {
      // key is recipient
      // addres is sender address
      console.log("New data", messageData);
      let key =
        type === "receive" ? messageData["sender"] : messageData["recipient"];
      let address = wallet.walletInst.account.address;
      await chatManager.set(key, [address], messageData);
      let data = await chatManager.get(wallet.walletInst.account.address);
      dispatch(updateMessages(data));
      console.log("recevie message anil....");
    } catch (error) {
      console.log("errror in catch", error);
    }
  };

  const setInitialProvider = async () => {
    await wallet.setProvider(
      (await getUserSelectedNetwork()) ?? DEFAULT_NETWORK
    );
    const networks = await Wallet.getNetworkProviders();
    const network = networks.get(
      (await getUserSelectedNetwork()) ?? DEFAULT_NETWORK
    );
    dispatch(changeNetwork(network));
    dispatch(updateWallet({ wallet: wallet }));
  };

  //Listening for network change
  // Changing balance and price call after user changes the network in the wallet
  useEffect(() => {
    if (authenticated) {
      const refreshWallet = async () => {
        if (!wallet.walletInst?.account) return;
        setTimeout(async () => {
          const balance = await wallet.getBalance();
          let usdValue = 0;
          if (balance > 0) {
            const data = await wallet.getPrice(networkProvider.key);
            usdValue = balance * data?.usd || 0;
          }
          dispatch(updateBalance({ balance: balance, balanceInUsd: usdValue }));
          // Turing off loader triggered from network change in home header
          internalLoading.setLoading(false);
          // TODO: Below methods called already in TabNavigation
          // getTokens();
          // getCollectibles();
          monitoringTransaction();
          connectChat();
        }, 0);
        if (updateBalanceInterval.current) {
          clearInterval(updateBalanceInterval.current);
        }
        updateBalanceInterval.current = setInterval(async () => {
          if (ENABLE_BALANCE_UPDATE) {
            const balance = await wallet.getBalance();
            let usdValue = 0;
            if (balance > 0) {
              const data = await wallet.getPrice(networkProvider.key);
              usdValue = balance * data?.usd || 0;
            }
            dispatch(
              updateBalance({ balance: balance, balanceInUsd: usdValue })
            );
            // TODO: Below methods called already in TabNavigation
            // getTokens();
            // getCollectibles();
            monitoringTransaction();
          }
          // updateLatestBlock();
          // trackTransfer()
        }, 70000);
      };
      refreshWallet();
    }
  }, [
    networkProvider,
    authenticated,
    wallet,
    wallet.walletInst,
    wallet.walletInst?.account,
  ]);

  const getTokens = async () => {
    let localData: [ImportTokenFormType] =
      (await tokensManager.get(wallet.getAccountAddress(), [
        wallet.networkProvider.chainId,
      ])) || [];
    // let localData: any = localStorage.getItem(tokenStorageKey);
    if (localData) {
      dispatch(setTokens(localData));
    } else {
      dispatch(setTokens([]));
    }
  };

  const getCollectibles = async () => {
    let localData: [ImportCollectibleFormType] =
      (await collectiblesManager.get(wallet.getAccountAddress(), [
        wallet.networkProvider.chainId,
      ])) || [];
    // let localData: any = localStorage.getItem(tokenStorageKey);
    if (localData) {
      dispatch(setCollectibles(localData));
    } else {
      dispatch(setCollectibles([]));
    }
  };

  const monitoringTransaction = async () => {
    try {
      let data =
        (await activityManager.get(wallet.getAccountAddress(), [
          wallet.networkProvider.chainId,
        ])) || [];
      if (data.length !== 0) {
        let txnList = data;
        for (let i = 0; i < txnList.length; i++) {
          if (txnList[i].status == "pending") {
            let receipt;
            receipt = await wallet.walletInst?.web3.eth.getTransactionReceipt(
              txnList[i].hash
            );
            if (receipt && receipt.status === true) {
              txnList[i].status = "success";
            } else if (receipt && receipt.status === false) {
              txnList[i].status = "pending";
            } else {
            }
          }
        }
        await activityManager.set(
          wallet.getAccountAddress(),
          [wallet.networkProvider.chainId],
          txnList
        );
      }
    } catch (error: any) {}
  };

  const getUserSelectedNetwork = async () => {
    const selectedNetwork = await storage.getItem(Wallet.NETWORK_STORAGE_KEY);
    return selectedNetwork ?? DEFAULT_NETWORK;
  };

  return (
    <View style={{ flex: 1 }}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={"white"} size={"large"} />
          <Spacer height={20} />
          <Text>Preparing your wallet</Text>
        </View>
      )}

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    right: 0,
    left: 0,
    bottom: 0,
    top: 0,
    backgroundColor: "#1b0719",
    position: "absolute",
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
