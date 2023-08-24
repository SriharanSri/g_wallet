// import { addAccount, updateWallet } from "@/apps/coreSlice";
// import { RootState } from "@/apps/store";
// import Auth from "@/lib/Auth";
// import { useRouter } from "next/router";
// import { FormEvent, useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { toast } from "@components/popup";
// import Web3 from "web3";
// import Lottie from "react-lottie";

import {
  Linking,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useContext } from "react";
import { globalStyles } from "../../styles/global.style";
import AnimatedLottieView from "lottie-react-native";
import { Button } from "../Button";
import { useNavigation } from "@react-navigation/native";
import _ from "lodash";
import { FormEvent, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Web3 from "web3";
import {
  updateImportAccounts,
  updateRecovery,
} from "../../lib/wallet-sdk/authSlice";
import { addAccount, updateWallet } from "../../lib/wallet-sdk/coreSlice";
import { RootState } from "../../lib/wallet-sdk/store";
import { Wallet } from "../../lib/wallet-sdk/wallet";
import RecoveryAnimation from "../../../assets/lottie/recovery.json";
import { Auth } from "../../lib/wallet-sdk/Auth";
import SecureStorage from "react-native-encrypted-storage";
import { useAlert } from "../../hooks/useAlert";
import { usePrepareWallet } from "../../hooks/usePrepareWallet";
import { userManager } from "../../lib/wallet-sdk/storage/user-manager";
import { Text, textVariants } from "../Text";
import * as Keychain from "react-native-keychain";
import {
  getRecoveryFromCloudStorage,
  updateToCloudStorage,
} from "../../lib/utils";
import { GOOGLE_SIGNIN_RECOVERY } from "@env";
import { LoadingIndicatorContext } from "../../App";
import {
  writeFile,
  defaultICloudContainerPath,
  PathUtils,
  readFile,
} from "react-native-cloud-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const RecoveryComponent = () => {
  const { toast } = useAlert();
  const dispatch = useDispatch();
  const { logout } = usePrepareWallet();
  const { setLoading } = useContext(LoadingIndicatorContext);
  // const router = useRouter();
  const [recoveryShare, setRecoveryShare] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [loginId, setLoginId] = useState("");
  const { keyInfra, wallet, networkProvider } = useSelector(
    (state: RootState) => state.coreReducer
  );
  const { uKey, auth, recovery } = useSelector(
    (state: RootState) => state.authReducer
  );

  // const { authStream, notifierStream, targetOrigin } = useSelector((state: RootState) => state.streamReducer);
  const navigation: any = useNavigation();
  // const { setNetwork, isExtension, formatUri } = useChromeStorage()

  useEffect(() => {
    setIsValid(recoveryShare !== "");
    return;
  }, [recoveryShare]);

  useEffect(() => {
    Auth.getLoginId().then((loginId: string) => {
      setLoginId(loginId);
    });
  }, []);

  const recoveryUsingCloud = async () => {
    Linking.addEventListener("url", async (event) => {
      if (event.url) {
        setLoading(true);
        Linking.removeAllListeners("url");
        const value = event?.url?.replace("guardianwallet:", "");
        const arr = value.split(",").map((x) => x.trim());
        let [_, __, ___, googleToken] = arr;
        console.log("GOOGLE TOKEN  ========> ", googleToken);
        const recoveryKeyshare = await getRecoveryFromCloudStorage(googleToken);
        if (recoveryKeyshare) {
          await recoverWallet(recoveryKeyshare, "CLOUD");
          setLoading(false);
          return;
        }
        setLoading(false);
        toast({ title: "Recovery not found in drive", type: "error" });
      }
    });
    Linking.openURL(GOOGLE_SIGNIN_RECOVERY);
  };

  const recoverWallet = async (
    recoveryKeyshare: string,
    from: "MANUAL" | "CLOUD"
  ) => {
    if (!isValid && from === "MANUAL") return;

    try {
      const ukey = (await SecureStorage.getItem("ukey")) ?? "";
      keyInfra.setUkey(ukey);
      const pKey = await keyInfra.reconstructKey(recoveryKeyshare);

      if (pKey) {
        const keyShares = keyInfra.splitShare(pKey);
        keyInfra.persistInLocal(keyInfra.encryptShare(keyShares[0], uKey));
        const addedAccount = wallet.walletFromPkey(pKey);

        dispatch(
          updateWallet({
            wallet: wallet,
          })
        );

        wallet.changeAccount(addedAccount);
        dispatch(addAccount(addedAccount));
        toast({
          type: "success",
          title: "Wallet recovered successfully",
        });

        const chainId = Web3.utils.toHex(
          await wallet.walletInst?.web3.eth.getChainId()
        );
        auth.saveUserRecords({
          importedAccounts: [
            { [wallet.getAccountAddress()]: "Primary Account" },
          ],
          loginId: loginId,
          loginType: Auth.getLoginType(),
        });
        dispatch(
          updateImportAccounts([
            { [wallet.getAccountAddress()]: "Primary Account" },
          ])
        );
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
        return;
      }

      toast({
        type: "error",
        title: "Enter valid Recovery Key",
        position: "bottom",
      });
    } catch (error: any) {
      toast({
        type: "error",
        title: error.message,
      });

      console.error(error);
    }
  };

  const verifyRecovery = async (event: FormEvent) => {
    event.preventDefault();
    try {
      let validated = await auth.verifyLogin();

      if (!validated) {
        toast({
          type: "error",
          title: "Invalid session",
          position: "bottom",
        });

        auth.errorSignout();
        navigation.navigate("Signin");
        return;
      }

      const pKey = await keyInfra.reconstructKey(recoveryShare);

      if (Web3.utils.toBN(pKey).toString() === wallet.getPKeyBN()) {
        // toast("Recovery verified successfully", { type: "success" });
        toast({
          type: "success",
          title: "Recovery verified successfully",
          position: "bottom",
        });

        dispatch(updateRecovery(""));

        navigation.navigate("Home");
      } else {
        toast({
          type: "error",
          title: "Please enter valid recovery key",
          position: "bottom",
        });
      }
    } catch (error: any) {
      toast({
        type: "error",
        title: "Invalid Recovery Key",
        position: "bottom",
      });
    }
  };

  const downloadRecovery = () => {
    if (recovery != "" && recovery) {
      Wallet.downloadKeyShare(recovery);
    } else {
      toast({
        type: "error",
        title: "Unable to fetch the Recovery key",
        position: "bottom",
      });
      setTimeout(() => {
        navigation.navigate("Home");
      }, 2000);
    }
  };

  // For signout user and redirect to intial page
  const signoutHandler = async () => {
    await logout();
  };

  const isMobileUser = async () => {
    return Auth.LoginType.OTP != (await Auth.getLoginType());
  };
  const getFromIcloud = async () => {
    const filePathForWrite = PathUtils.join(
      defaultICloudContainerPath,
      "Documents/wallet_recovery_keyshare.txt"
    );
    setLoading(true);

    try {
      const recoveryKeyshare = await readFile(filePathForWrite);
      console.log("content", recoveryKeyshare);
      if (recoveryKeyshare) {
        await recoverWallet(recoveryKeyshare, "CLOUD");
        setLoading(false);
        return;
      }
      setLoading(false);
      toast({ title: "Retrived from iCloud", type: "success" });
    } catch (error) {
      console.log("err..", error);
      toast({ title: "Recovery not found in cloud", type: "error" });
    }
    setLoading(false);
  };
  const handleSignout = async () => {
    setLoading(true);
    await auth.signOut();
    await Keychain.resetGenericPassword();
    await AsyncStorage.clear();
    await SecureStorage.clear();
    navigation.navigate("Signin");
    setLoading(false);

    //Updating new wallet to make sure previous account got removed
    const wallet = new Wallet(networkProvider.key);
    dispatch(updateWallet({ wallet: wallet }));
  };
  return (
    <View style={globalStyles.screen}>
      <View style={componentStyle.centeredView}>
        <AnimatedLottieView
          style={componentStyle.lottie}
          source={RecoveryAnimation}
          autoPlay
          loop
        />
        <View>
          {isMobileUser() ? (
            <Text style={componentStyle.bannerText}>
              Verify with your Recovery key that you downloaded when you first
              login to Guardian Wallet using {loginId}
            </Text>
          ) : (
            <Text style={componentStyle.bannerText}>
              Verify with your Recovery key that was sent to {loginId}
            </Text>
          )}
        </View>

        <TextInput
          placeholderTextColor={"#fff"}
          style={componentStyle.Input}
          placeholder="Enter Recover Key"
          value={recoveryShare}
          onChangeText={(text) => setRecoveryShare(text)}
        ></TextInput>
        <TouchableOpacity
          style={[componentStyle.buttonGroup, { marginTop: 50 }]}
        >
          <Button
            title="Recover Wallet"
            variant="two"
            onPress={() => recoverWallet(recoveryShare, "MANUAL")}
            expanded
          />
        </TouchableOpacity>
        {Platform.OS === "ios" ? (
          <TouchableOpacity
            style={[componentStyle.buttonGroup, { marginTop: 50 }]}
          >
            <Button
              title="Recovery using iCloud"
              variant="two"
              onPress={getFromIcloud}
              expanded
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[componentStyle.buttonGroup, { marginTop: 50 }]}
          >
            <Button
              title="Recovery using cloud"
              variant="two"
              onPress={recoveryUsingCloud}
              expanded
            />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[componentStyle.buttonGroup, { marginTop: 0 }]}
        >
          <Button
            title="Logout"
            variant="one"
            expanded
            onPress={() => handleSignout()}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const componentStyle = StyleSheet.create({
  lottie: {
    width: 180,
    alignSelf: "center",
  },
  buttonGroup: {
    flexDirection: "row",
    margin: 20,
    marginHorizontal: 80,
  },
  Input: {
    backgroundColor: "#d4d6db33",
    paddingVertical: 25,
    paddingHorizontal: 25,
    color: "#fff",
    height: 90,
    fontSize: 17,
  },
  bannerText: {
    color: "#fff",
    textAlign: "center",
    marginHorizontal: 30,
    fontSize: 17,
    lineHeight: 25,
    marginBottom: 30,
    fontFamily: textVariants["medium"],
    // width: "80%",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    // alignItems:"center"
  },
});
