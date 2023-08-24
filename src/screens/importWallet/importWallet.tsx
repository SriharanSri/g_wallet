import AnimatedLottieView from "lottie-react-native";
import React, { useContext, useEffect, useState } from "react";
import {
  Image,
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
import { Text, textVariants } from "../../components/Text";
import { Dropdown } from "react-native-element-dropdown";
import DocumentPicker from "react-native-document-picker";
import RNFS from "react-native-fs";
import { downloadFile } from "../../lib/utils";
import Toast from "react-native-toast-message";
import { LoadingIndicatorContext } from "../../App";
import { CommonActions } from "@react-navigation/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useAlert } from "../../hooks/useAlert";
import { updateImportAccounts } from "../../lib/wallet-sdk/authSlice";
import { userManager } from "../../lib/wallet-sdk/storage/user-manager";
import { Button } from "../../components/Button";

export const ImportWallet = ({ navigation, route }: any) => {
  const { toast } = useAlert();
  const { setLoading } = useContext(LoadingIndicatorContext);
  const [importType, setImportType] = useState<
    "NONE" | "PRIVATEKEY" | "KEYSTORE"
  >("NONE");
  const [importExpanded, setImportExpanded] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [password, setPassword] = useState("");
  const [fileName, setFilename] = useState<any>(null);
  const [encryptedJson, setEncryptedJson] = useState<any>(null);

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
    three: ["#cc2751", "#df8128"],
    four: ["#ce2b4f", "#5d14a6"],
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
    setLoading(true);
    try {
      const ukey = (await SecureStorage.getItem("ukey")) ?? "";
      const [pk, newWallet] = wallet.importFromPrivateKey(
        privateKey.trim(),
        ukey
      );
      let instance = newWallet.walletInst.web3.eth.accounts.wallet;
      let len = instance.length;
      let user = (await userManager.get(await Auth.getUserStorageKey()))
        .importedAccounts;
      console.log("len last data is", instance[len - 1].address, user);
      let existsData: any =
        (await userManager.get(await Auth.getUserStorageKey()))
          .importedAccounts || [];
      console.log("exists data", existsData);
      existsData.push({
        [instance[len - 1].address]: `Imported Account ${len - 1}`,
      });
      auth.saveUserRecords({
        loginId: await Auth.getLoginId(),
        loginType: await Auth.getLoginType(),
        importedAccounts: existsData,
      });
      dispatch(updateImportAccounts(existsData));
      dispatch(
        updateWallet({
          wallet: newWallet,
        })
      );
      // console.log(newWallet)
      navigation.goBack();
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
    let instance = newWallet.walletInst.web3.eth.accounts.wallet;
    let len = instance.length;
    let user = (await userManager.get(await Auth.getUserStorageKey()))
      .importedAccounts;
    console.log("len last data is", instance[len - 1].address, user);
    let existsData: any =
      (await userManager.get(await Auth.getUserStorageKey()))
        .importedAccounts || [];
    console.log("exists data", existsData);
    existsData.push({
      [instance[len - 1].address]: `Imported Account ${len - 1}`,
    });
    auth.saveUserRecords({
      loginId: await Auth.getLoginId(),
      loginType: await Auth.getLoginType(),
      importedAccounts: existsData,
    });
    dispatch(updateImportAccounts(existsData));
    dispatch(
      updateWallet({
        wallet: newWallet,
      })
    );
    navigation.goBack();
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      keyboardVerticalOffset={Platform.OS === "android" ? 35 : 70}
      behavior="height"
    >
      <ScrollView style={globalStyles.screen}>
        <AuthHeader showBack onBackPress={() => navigation.goBack()} />
        <AnimatedLottieView
          style={componentStyle.lottie}
          source={require("./Wallet.json")}
          autoPlay
          loop
        />
        <View>
          <Spacer height={30} />
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

            <Spacer height={20} />
            <View
              style={{
                flex: 1,
                width: "90%",
                borderRadius: 20,
                marginHorizontal: "auto",
                backgroundColor: "#ffffff40",
                paddingHorizontal: 20,
                paddingVertical: 15,
              }}
            >
              <TouchableOpacity
                onPress={() => setImportExpanded(!importExpanded)}
              >
                {importType === "NONE" && (
                  <Text variant="regular" fontSize={15}>
                    Import Method
                  </Text>
                )}
                {importType === "PRIVATEKEY" && <Text>Private Key</Text>}
                {importType === "KEYSTORE" && <Text>Keystore</Text>}
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
            <View>
              <TextInput
                value={privateKey}
                onChangeText={(value) => setPrivateKey(value)}
                placeholder="Enter Private Key"
                placeholderTextColor={"#fff"}
                style={{
                  backgroundColor: "#ffffff20",
                  color: "white",
                  fontFamily: textVariants["regular"],
                  fontSize: 15,
                  height: 75,
                  textAlign: "center",
                  paddingHorizontal: 20,
                }}
              />
              <Spacer height={30} />
              <Button
                styles={{ marginHorizontal: 70 }}
                variant="four"
                onPress={importAccountWithPK}
                title="Import Account"
              />
            </View>
          )}
          {importType === "KEYSTORE" && (
            <>
              <View
                style={{
                  backgroundColor: "#ffffff20",
                  padding: 16,
                  marginHorizontal: 35,
                  borderRadius: 50,
                  height: 47,
                }}
              >
                <Text variant="regular" fontSize={14} color="#fff">
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
                      <Text>Upload</Text>
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
                  padding: 16,
                  color: "#fff",
                  marginHorizontal: 35,
                  borderRadius: 50,
                  fontFamily: textVariants["regular"],
                  fontSize: 14,
                  height: Platform.OS === "ios" ? 50 : undefined,
                }}
              />
              <Spacer height={20} />
              <Button
                styles={{ marginHorizontal: 70 }}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
const componentStyle = StyleSheet.create({
  lottie: {
    width: 280,
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
