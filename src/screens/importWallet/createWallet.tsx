import AnimatedLottieView from "lottie-react-native";
import React, { useContext, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView, TextInput } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import { useDispatch, useSelector } from "react-redux";
import { AuthHeader } from "../../components/AuthHeader";
import { updateWallet } from "../../lib/wallet-sdk/coreSlice";
import { RootState } from "../../lib/wallet-sdk/store";
import { Wallet } from "../../lib/wallet-sdk/wallet";
import { globalStyles } from "../../styles/global.style";
import * as Keychain from "react-native-keychain";
import { Auth } from "../../lib/wallet-sdk/Auth";
import SecureStorage from "react-native-encrypted-storage";
import { Spacer } from "../../components/Spacer";
import { textVariants, Text } from "../../components/Text";
import DocumentPicker from "react-native-document-picker";
import RNFS from "react-native-fs";
import { downloadFile, updateToCloudStorage } from "../../lib/utils";
import { LoadingIndicatorContext } from "../../App";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SvgUri } from "react-native-svg";
import { CommonActions } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "../../hooks/useAlert";
import { updateImportAccounts } from "../../lib/wallet-sdk/authSlice";

export const CreateWallet = ({ navigation, route }: any) => {
  const { toast } = useAlert();
  const { setLoading } = useContext(LoadingIndicatorContext);
  const [importMode, setImportMode] = useState(
    route.params ? route.params.importMode : false
  );
  const [importType, setImportType] = useState<
    "NONE" | "PRIVATEKEY" | "KEYSTORE"
  >("NONE");
  const [importExpanded, setImportExpanded] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [password, setPassword] = useState("");
  const [fileName, setFilename] = useState<any>(null);
  const [encryptedJson, setEncryptedJson] = useState<any>(null);
  const { networkProvider } = useSelector(
    (state: RootState) => state.coreReducer
  );

  useEffect(() => {
    console.log();
    getToken();
  }, []);
  const getToken = async () => {
    const token: any = await Keychain.getGenericPassword();
    console.log(token, "Create wallet-token");
  };

  const dispatch = useDispatch();
  const { wallet, keyInfra } = useSelector(
    (state: RootState) => state.coreReducer
  );
  const { uKey, authenticated, auth } = useSelector(
    (state: RootState) => state.authReducer
  );

  const buttonVariants = {
    // three: ["#df8128", "#d63e43", "#cc2751"],
    three: ["#cc2751", "#df8128"],
    four: ["#ce2b4f", "#5d14a6"],
  };

  const createNewWallet = async () => {
    setLoading(true);
    const ukey = (await SecureStorage.getItem("ukey")) ?? "";
    keyInfra.setUkey(uKey);
    wallet.walletInst.uKey = ukey;

    wallet
      .createWallet()
      .then(async (response) => {
        let [pk, newWallet] = response;

        wallet.storingLatestBlock(newWallet.getAccountAddress());
        dispatch(
          updateWallet({
            wallet: newWallet,
          })
        );
        dispatch(
          updateImportAccounts([
            { [newWallet.getAccountAddress()]: "Primary Account" },
          ])
        );
        const recoveryKey = await persistKey(pk, newWallet);
        setLoading(false);
        navigation.navigate("BackupRecoveryKeyshare", { recoveryKey });
      })
      .catch((error) => {
        console.error(error);
        toast({
          position: "bottom",
          type: "error",
          title: `Unable to create wallet ${error}`,
        });
        setLoading(false);
      });
  };
  // Split Privatekey and Presist key share to local storage and send one of the share to user's mail id
  const persistKey = async (pk: any, newWallet: Wallet) => {
    keyInfra.setUkey(uKey);
    let keyShares = keyInfra.splitShare(pk);
    let metaData = { address: newWallet.getAccountAddress() };
    const encryptedKeyshares = await keyInfra.persistKeyShares(
      keyShares,
      metaData
    );
    let recovery = encryptedKeyshares[2];
    let recQuery: any = { ref: "verify" };

    if ((await Auth.getLoginType()) == Auth.LoginType.OTP) {
      toast({
        position: "bottom",
        type: "success",
        title:
          "Wallet created successfully. You have downloaded the recovery key, keep it stored safely.",
      });
    } else {
      toast({
        position: "bottom",
        type: "success",
        title:
          "Wallet created successfully. Recovery key has been sent to your email, keep it stored safely.",
      });
    }
    return recovery;
  };

  const importAccountWithPK = async () => {
    if (!privateKey) {
      toast({
        type: "error",
        title: "Enter valid privatekey",
        position: "bottom",
      });
      return;
    }
    console.log("PRIVATEKEY ======>", privateKey);
    setLoading(true);
    try {
      const ukey = (await SecureStorage.getItem("ukey")) ?? "";
      const [pk, newWallet] = wallet.importFromPrivateKey(
        privateKey.trim(),
        ukey
      );
      dispatch(
        updateWallet({
          wallet: newWallet,
        })
      );
      wallet.storingLatestBlock(newWallet.getAccountAddress());
      if (route.params && route.params.ref === "SETTINGS") {
        navigation.goBack();
        setLoading(false);
        return;
      }
      await persistKey(pk, newWallet);
      const routeResetAction = CommonActions.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
      navigation.dispatch(routeResetAction);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast({ type: "error", title: error.toString(), position: "bottom" });
    }
  };

  const pickFile = async () => {
    const response = await DocumentPicker.pickSingle({ mode: "import" });
    const encryptedAccount = await RNFS.readFile(response.uri);
    setEncryptedJson(JSON.parse(encryptedAccount));
    setFilename(response.name);
  };

  const importAccountWithJSON = async () => {
    if (!encryptedJson) {
      toast({
        type: "error",
        title: "Select valid json file",
        position: "bottom",
      });
      return;
    }
    setLoading(true);
    const ukey = (await SecureStorage.getItem("ukey")) ?? "";
    wallet.walletInst.uKey = ukey;
    const [pk, newWallet] = wallet.importAccountFromJson(
      encryptedJson,
      password
    );
    dispatch(
      updateWallet({
        wallet: newWallet,
      })
    );
    wallet.storingLatestBlock(newWallet.getAccountAddress());
    if (route.params && route.params.ref === "SETTINGS") {
      navigation.goBack();
      setLoading(false);
      return;
    }

    await persistKey(pk, newWallet);
    const routeResetAction = CommonActions.reset({
      index: 0,
      routes: [{ name: "Home" }],
    });
    navigation.dispatch(routeResetAction);
    setLoading(false);
  };

  const signOutHandler = async () => {
    await auth.signOut();
    await Keychain.resetGenericPassword();
    await AsyncStorage.removeItem("wallet");
    await AsyncStorage.clear();
    await SecureStorage.clear();
    //Updating new wallet to make sure previous account got removed
    const wallet = new Wallet(networkProvider.key);
    dispatch(updateWallet({ wallet: wallet }));
  };

  const onBackHandler = async () => {
    await signOutHandler();
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={globalStyles.screen}
      keyboardVerticalOffset={Platform.OS === "android" ? 35 : 70}
      behavior="height"
    >
      <ScrollView>
        <AuthHeader showBack onBackPress={onBackHandler} />
        <AnimatedLottieView
          style={componentStyle.lottie}
          source={require("../../../assets/lottie/Wallet.json")}
          autoPlay
          loop
        />
        {!importMode ? (
          <View>
            <TouchableOpacity onPress={createNewWallet}>
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                colors={buttonVariants["three"]}
                style={componentStyle.button}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {/* <SvgUri
                    uri={"https://walletqa.guardiannft.org/home/plus.svg"}
                    width={15}
                  /> */}
                  <Text
                    variant="medium"
                    fontSize={17}
                    style={{ marginLeft: 10 }}
                  >
                    Create a New Wallet
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setImportMode(true)}>
              <LinearGradient
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                colors={buttonVariants["four"]}
                style={componentStyle.button}
              >
                <Text variant="medium" fontSize={17} style={{ marginLeft: 10 }}>
                  Import an Existing Wallet{" "}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <LinearGradient
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                marginHorizontal: 16,
                padding: 16,
                borderRadius: 20,
                alignItems: "center",
              }}
              colors={buttonVariants["four"]}
            >
              <Text variant="medium" fontSize={18}>
                Import an Existing Wallet{" "}
              </Text>

              <Spacer />
              <View
                style={{
                  flex: 1,
                  width: "90%",
                  borderRadius: 25,
                  marginHorizontal: "auto",
                  backgroundColor: "#ffffff40",
                  paddingHorizontal: 20,
                  paddingVertical: 15,
                  marginVertical: 10,
                }}
              >
                <TouchableOpacity
                  onPress={() => setImportExpanded(!importExpanded)}
                >
                  {importType === "NONE" && (
                    <Text variant="light">Import Method</Text>
                  )}
                  {importType === "PRIVATEKEY" && (
                    <Text variant="medium">Private Key</Text>
                  )}
                  {importType === "KEYSTORE" && (
                    <Text variant="medium">Keystore</Text>
                  )}
                </TouchableOpacity>
                {importExpanded && (
                  <>
                    <TouchableOpacity
                      onPress={() => {
                        setImportExpanded(false);
                        setImportType("PRIVATEKEY");
                      }}
                    >
                      <Spacer />
                      <Text>Private Key</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setImportExpanded(false);
                        setImportType("KEYSTORE");
                      }}
                    >
                      <Spacer />
                      <Text>Keystore</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </LinearGradient>
            <Spacer height={20} />
            {importType === "PRIVATEKEY" && (
              <>
                <TextInput
                  value={privateKey}
                  onChangeText={(value) => setPrivateKey(value)}
                  placeholder="Enter Private Key"
                  placeholderTextColor={"#fff"}
                  style={{
                    backgroundColor: "#ffffff20",
                    color: "white",
                    fontFamily: textVariants["light"],
                    paddingHorizontal: 20,
                    paddingVertical: 20,
                    textAlign: "center",
                  }}
                />
                <Spacer height={20} />
                <Button
                  styles={{ marginHorizontal: 80 }}
                  variant="four"
                  onPress={importAccountWithPK}
                  title="Import Account"
                />
              </>
            )}
            {importType === "KEYSTORE" && (
              <>
                <View
                  style={{
                    backgroundColor: "#ffffff20",
                    padding: 16,
                    marginHorizontal: 16,
                    borderRadius: 50,
                  }}
                >
                  <Text variant="light">
                    {fileName
                      ? Wallet.displayAddressWithEllipsis(fileName, 6)
                      : "Upload the file"}
                  </Text>
                  <View
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                    }}
                  >
                    <LinearGradient
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: "100%",
                        width: 100,
                        borderRadius: 40,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      colors={buttonVariants["three"]}
                    >
                      <TouchableOpacity onPress={pickFile}>
                        <Text variant="medium">Upload</Text>
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>
                </View>
                <Spacer />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor={"#fff"}
                  onChangeText={(value) => setPassword(value)}
                  value={password}
                  style={{
                    backgroundColor: "#ffffff20",
                    paddingHorizontal: 15,
                    height: Platform.OS === "ios" ? 50 : undefined,
                    color: "white",
                    marginHorizontal: 16,
                    borderRadius: 50,
                    fontFamily: textVariants["light"],
                  }}
                />
                <Spacer height={20} />
                <Button
                  styles={{ marginHorizontal: 80 }}
                  variant="four"
                  onPress={
                    importType === "KEYSTORE"
                      ? importAccountWithJSON
                      : importAccountWithPK
                  }
                  title="Import Account"
                />
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
const componentStyle = StyleSheet.create({
  lottie: {
    width: 320,
    alignSelf: "center",
    // heigh: 300
  },
  button: {
    flex: 1,
    borderRadius: 20,
    textTransform: "lowercase",
    marginHorizontal: 25,
    marginTop: 15,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonTitle: {
    color: "white",
    fontSize: 18,
    // paddingVertical: 12,
    // marginHorizontal: 10,
    textAlign: "center",
    fontFamily: "HelveticaNeueLTPro-Ex",
  },
});
