import {
  Alert,
  Image,
  ImageBackground,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState, useContext } from "react";
import { Button } from "../Button";
import { SvgUri } from "react-native-svg";
import { RootState } from "../../lib/wallet-sdk/store";
import { useDispatch, useSelector } from "react-redux";
import { Auth } from "../../lib/wallet-sdk/Auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { LoadingIndicatorContext } from "../../App";
import { Text, textVariants } from "../Text";
import Clipboard from "@react-native-clipboard/clipboard";
import { downloadFile } from "../../lib/utils";
import SecureStorage from "react-native-encrypted-storage";
import * as Keychain from "react-native-keychain";
import { Wallet } from "../../lib/wallet-sdk/wallet";
import { updateWallet } from "../../lib/wallet-sdk/coreSlice";
import { useAlert } from "../../hooks/useAlert";
import AnimatedLottieView from "lottie-react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Reset from "../../../assets/vector/reset.png";
import Background from "../../../assets/vector/background_one.png";
import WcLogo from "../../../assets/image/wallet_connect.png";
import { ROUTES } from "../../routes";
import ReleaseVersion from "../ReleaseVersion";

const PrivateKey = () => {
  const { toast } = useAlert();
  const { loading, setLoading } = useContext(LoadingIndicatorContext);
  const navigation: any = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [encrypPass, setEncrypPass] = useState("");
  const [typeOFLogin, setTypeOFLogin] = useState("");
  const [showPass, setShowpass] = useState(true);
  const [getFrontData, setGetFrontData] = useState<[]>();
  const [input, setInput] = useState<string>("s");
  const dispatch = useDispatch();
  const { networkProvider, wallet, keyInfra } = useSelector(
    (state: RootState) => state.coreReducer
  );
  const { metadata, auth, authenticated, uKey, displayName } = useSelector(
    (state: RootState) => state.authReducer
  );
  const handlePrivateKey = () => {
    setShowKey(!showKey);
  };
  const handleShowDownload = () => {
    setShowDownload(!showDownload);
  };
  const handleShowReset = () => {
    setShowReset(!showReset);
  };
  const handleShowDelete = () => {
    setShowDelete(!showDelete);
  };
  const checkLogintype = async () => {
    setTypeOFLogin(await Auth.getLoginType());
    // console.log(await Auth.getLoginType(), "getLoginType");
  };
  useEffect(() => {
    checkLogintype();
    getStorageData();
  }, []);
  const handleResendRecoveryShare = async () => {
    if (Auth.LoginType.OTP == typeOFLogin) {
      setLoading(true);
      const recovery = await keyInfra.getRecoveryForMobile(
        wallet.walletInst?.account?.privateKey,
        uKey
      );
      downloadFile("RecoveyKey", recovery, "txt");
      setLoading(false);
      // var path = RNFS.DownloadDirectoryPath + "/RecoveyKey.txt";
      // RNFS.writeFile(path, recovery, "utf8")
      //   .then((success) => {
      //     console.log("FILE WRITTEN!");
      //     Toast.show({
      //       position: "bottom",
      //       type: "success",
      //       text1: "File saved in downloads ",
      //     });
      //   })
      //   .catch((err) => {
      //     console.log(err.message);
      //   });
      // setLoading(false);
      return;
    }
    await keyInfra.resendRecoveryShare(
      wallet.walletInst?.account?.privateKey,
      uKey
    );
    if (Auth.LoginType.OTP != Auth.getLoginType())
      toast({
        position: "bottom",
        type: "success",
        title: "Recovery Key sent to your mail id ",
      });
    // Toast.showWithGravity(
    //   "Recovery Key sent to your mail id ",
    //   Toast.SHORT,
    //   Toast.BOTTOM
    // );
  };

  const handleDownload = async () => {
    // setLoading(true);
    const encWallet = await wallet.encryptedAccount(encrypPass);
    downloadFile("SoftCopy", encWallet, "json");
    setShowDownload(false);
    setLoading(false);
  };
  const copyToClipboard = () => {
    Clipboard.setString(
      wallet.walletInst?.account?.privateKey?.replace(/0x|0X/, "")
    );
    toast({
      position: "bottom",
      type: "success",
      title: "Private key Copied to clipboard",
    });
  };
  const handleDeleteAccout = async () => {
    setLoading(true);
    const result: any = await auth.deleteAccount();
    if (result.status) {
      await handleSignout();
      toast({
        type: "success",
        title: "Account deleted successfully",
      });
    } else {
      setDeleteModalVisible(false);
      toast({
        type: "error",
        title: `Unable to delete the account. ${result.message}`,
      });
      setLoading(false);
    }
  };
  const handleSignout = async () => {
    setLoading(true);
    setModalVisible(false);
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
  const getStorageData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("getfront").then((val) =>
        JSON.parse(val)
      );
      console.log("jsonValue", jsonValue);
      // jsonValue.map((data) => console.log("daughascbhj", data));
      setGetFrontData(jsonValue);
      // return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.log("error", e);
    }
  };
  const goToProfile = (data: any) => {
    // console.log("shjdcfhjk", data);
    navigation.navigate("GetFrontProfile", { params: data });
  };
  console.log("getFront", getFrontData);
  return (
    <View style={{ marginTop: 0 }}>
      <Text style={componentStyle.settingsTitle}> Get Front</Text>
      <View style={componentStyle.settings}>
        <View style={[{ marginVertical: 15 }]}>
          <View
            style={[
              componentStyle.dflex,
              componentStyle.padH,
              { justifyContent: "space-between" },
            ]}
          >
            <Text style={componentStyle.inboxTitle}>Link From Get Front</Text>
            {/* <TouchableOpacity onPress={handleShowDownload}>
              <SvgUri
                width={20}
                height={20}
                uri="https://walletqa.guardiannft.org/signin/download.svg"
                style={[componentStyle.logo, { marginHorizontal: 10 }]}
              />
            </TouchableOpacity> */}
          </View>

          <View
            style={[componentStyle.padH, { marginVertical: 10, marginTop: 25 }]}
          >
            {getFrontData &&
              getFrontData.map((data: any, i) => (
                <>
                  <TouchableOpacity
                    key={i}
                    style={{
                      borderRadius: 10,
                      borderWidth: 0.7,
                      borderColor: "#d4d6db33",
                      padding: 5,
                      marginBottom: 10,
                    }}
                    onPress={() => goToProfile(data)}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 10,
                      }}
                    >
                      <Image
                        source={{
                          uri: `data:image/jpeg;base64,${data?.brokerBrandInfo?.brokerLogo}`,
                        }}
                        style={{ height: 25, width: 25 }}
                      />
                      <Text
                        style={{
                          color: "#fff",
                          fontFamily: textVariants["medium"],
                          fontSize: 15,
                          marginLeft: 10,
                          flex: 0.8,
                        }}
                      >
                        {data?.brokerName}
                      </Text>
                    </View>
                    <Text
                      variant="regular"
                      fontSize={12}
                      style={{
                        color: "#bec0c4",
                        lineHeight: 17,
                        marginTop: 8,
                        marginLeft: 10,
                      }}
                    >
                      {data.accountTokens[0].account.accountId}
                    </Text>
                  </TouchableOpacity>
                </>
              ))}

            <Button
              title={"Get Front"}
              variant="two"
              expanded
              onPress={() => navigation.navigate("GetFront")}
            />
          </View>
        </View>
      </View>
      <Text style={componentStyle.settingsTitle}>Private Key</Text>
      <View style={componentStyle.settings}>
        <View style={[{ marginVertical: 15 }]}>
          <View
            style={[
              componentStyle.dflex,
              componentStyle.padH,
              { justifyContent: "space-between" },
            ]}
          >
            <Text style={componentStyle.inboxTitle}>
              Download Soft Copy (JSON)
            </Text>
            <TouchableOpacity onPress={handleShowDownload}>
              <SvgUri
                width={20}
                height={20}
                uri="https://walletqa.guardiannft.org/signin/download.svg"
                style={[componentStyle.logo, { marginHorizontal: 10 }]}
              />
            </TouchableOpacity>
          </View>

          {showDownload && (
            <View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <TextInput
                  onChangeText={(value) => setEncrypPass(value)}
                  placeholder="Enter the password to encrypt the JSON "
                  style={{
                    // letterSpacing: 0.8,
                    marginLeft: 10,
                    color: "#fff",
                    fontFamily: textVariants["light"],
                    fontSize: 13,
                    opacity: 0.6,
                    height: 70,
                  }}
                  secureTextEntry={showPass}
                  placeholderTextColor={"#fff"}
                />
                {encrypPass?.length > 0 && (
                  <TouchableOpacity
                    style={{
                      right: 20,
                      alignSelf: "center",
                      position: "absolute",
                    }}
                    onPress={() => setShowpass(!showPass)}
                  >
                    <SvgUri
                      width={20}
                      height={20}
                      uri="https://walletqa.guardiannft.org/signin/eye.svg"
                      style={[componentStyle.logo, { marginHorizontal: 10 }]}
                    />
                  </TouchableOpacity>
                )}
              </View>
              <Button
                title="Download"
                variant="two"
                disabled={encrypPass?.length < 6}
                styles={{
                  opacity: encrypPass.length > 5 ? 1 : 0.4,
                  marginHorizontal: 40,
                }}
                onPress={() => {
                  setLoading(true);
                  setTimeout(() => {
                    handleDownload();
                  }, 10);
                }}
                // onPress={handleDownload}
              />
            </View>
          )}
        </View>
        <View style={componentStyle.hr}></View>
        <View style={[componentStyle.padH, { marginVertical: 15 }]}>
          <View
            style={[componentStyle.dflex, { justifyContent: "space-between" }]}
          >
            <Text style={componentStyle.inboxTitle}>Show Private Key</Text>
            <TouchableOpacity onPress={handlePrivateKey}>
              <SvgUri
                width={20}
                height={20}
                uri="https://walletqa.guardiannft.org/signin/eye.svg"
                style={[componentStyle.logo, { marginHorizontal: 10 }]}
              />
            </TouchableOpacity>
          </View>
          {showKey && (
            <View>
              <TouchableOpacity
                onPress={() => {
                  copyToClipboard();
                }}
                // style={[
                //   componentStyle.dflex,
                //   { justifyContent: "space-between" },
                // ]}
              >
                <Text
                  variant="regular"
                  fontSize={12}
                  style={{
                    marginLeft: 10,
                    lineHeight: 18,
                    marginTop: 10,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  {/* TODO: copyhandler */}
                  {wallet.walletInst?.account?.privateKey?.replace(/0x|0X/, "")}
                  <SvgUri
                    width={12}
                    height={12}
                    uri="https://walletqa.guardiannft.org/home/copy.svg"
                    style={{ marginRight: 12 }}
                  />
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <Text style={componentStyle.settingsTitle}>Advanced Settings</Text>
      <View style={componentStyle.settings}>
        <View style={[{ marginVertical: 15 }]}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate(ROUTES.WALLETCONNECT_SESSION);
            }}
          >
            <View
              style={[
                componentStyle.dflex,
                componentStyle.padH,
                { justifyContent: "space-between" },
              ]}
            >
              <Text style={componentStyle.inboxTitle}>
                WalletConnect Sessions
              </Text>
              <Image
                source={WcLogo}
                style={[
                  {
                    marginHorizontal: 10,
                    width: 20,
                    height: 20,
                    resizeMode: "contain",
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>
        <View style={componentStyle.hr}></View>
        <View style={[{ marginVertical: 15 }]}>
          <View
            style={[
              componentStyle.dflex,
              componentStyle.padH,
              { justifyContent: "space-between" },
            ]}
          >
            <Text style={componentStyle.inboxTitle}>Reset Wallet</Text>
            <TouchableOpacity onPress={handleShowReset}>
              <Image
                source={Reset}
                style={[
                  componentStyle.logo,
                  { marginHorizontal: 10, width: 20, height: 20 },
                ]}
              />
            </TouchableOpacity>
          </View>

          {showReset && (
            <View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  variant="light"
                  fontSize={12}
                  opacity={0.7}
                  style={{
                    marginHorizontal: 25,
                    marginVertical: 10,
                    lineHeight: 15,
                  }}
                >
                  Reset wallet action will erase all data on the wallet and
                  restored it to its default settings.
                </Text>
              </View>
              <Button
                title="Reset"
                variant="red"
                styles={{
                  marginHorizontal: 90,
                  borderWidth: 0.5,
                  borderColor: "red",
                  marginTop: 7,
                }}
                onPress={() => setModalVisible(true)}
                // onPress={handleDownload}
              />
            </View>
          )}
        </View>

        {Platform.OS === "ios" && (
          <>
            <View style={componentStyle.hr}></View>
            <View style={[{ marginVertical: 15 }]}>
              <View
                style={[
                  componentStyle.dflex,
                  componentStyle.padH,
                  { justifyContent: "space-between" },
                ]}
              >
                <Text style={componentStyle.inboxTitle}>Delete Account</Text>
                <TouchableOpacity onPress={handleShowDelete}>
                  <Icon
                    name="delete-forever"
                    style={[
                      componentStyle.logo,
                      { marginHorizontal: 10, width: 20, height: 20 },
                    ]}
                    size={22}
                    color="#fff"
                  />
                </TouchableOpacity>
              </View>
              {showDelete && (
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      variant="light"
                      fontSize={12}
                      opacity={0.7}
                      style={{
                        marginHorizontal: 25,
                        marginVertical: 10,
                        lineHeight: 15,
                      }}
                    >
                      Delete account action will erase your account and connot
                      get recover later.
                    </Text>
                  </View>
                  <Button
                    title="Delete"
                    variant="red"
                    styles={{
                      marginHorizontal: 90,
                      borderWidth: 0.5,
                      borderColor: "red",
                      marginTop: 7,
                    }}
                    onPress={() => setDeleteModalVisible(true)}
                  />
                </View>
              )}
            </View>
          </>
        )}
      </View>
      <View style={{ marginHorizontal: 30 }}>
        <View style={[componentStyle.padH, { marginVertical: 10 }]}>
          <Button
            title={`${
              Auth.LoginType.OTP === typeOFLogin ? "Download" : "Resend"
            } Recover Key`}
            variant="two"
            expanded
            onPress={() => handleResendRecoveryShare()}
          />
        </View>

        <ReleaseVersion />
        <View
          style={[componentStyle.padH, { marginVertical: 5, marginBottom: 70 }]}
        >
          {/* <Button
            styles={{
              marginHorizontal: 60,
              borderWidth: 0.5,
              borderColor: "red",
            }}
            title="Reset"
            variant="transparent"
            expanded
            onPress={() => setModalVisible(true)}
          /> */}
          {/* <Button
            title="Reset"
            variant="red"
            expanded
            onPress={() => setModalVisible(true)}
          /> */}
        </View>
      </View>

      <View>
        <Modal animationType="slide" transparent={true} visible={modalVisible}>
          <ImageBackground
            source={Background}
            // resizeMode="cover"
            style={componentStyle.layout}
          >
            <View style={componentStyle.centeredView}>
              <View style={componentStyle.modalView}>
                <View>
                  <View style={{ marginBottom: 20 }}>
                    <AnimatedLottieView
                      style={componentStyle.lottie}
                      source={require("../../../assets/lottie/reset.json")}
                      autoPlay
                      loop
                    />
                  </View>
                </View>
                <Text
                  variant="regular"
                  fontSize={14}
                  style={{ lineHeight: 20, marginHorizontal: 21 }}
                >
                  Note: Before proceeding with the wallet reset, we strongly the
                  "Recovery Key" to restore your wallet.
                </Text>
                <Text style={componentStyle.modalText}>
                  Do you really want reset your wallet?
                </Text>
                <View style={{ flexDirection: "row" }}>
                  <Button
                    title="No"
                    variant="cancel"
                    expanded
                    onPress={() => setModalVisible(false)}
                  />
                  <Button
                    title="Yes"
                    variant="red"
                    expanded
                    onPress={() => handleSignout()}
                  />
                </View>
              </View>
            </View>
          </ImageBackground>
        </Modal>
      </View>
      <View>
        <Modal
          animationType="slide"
          transparent={true}
          visible={deleteModalVisible}
        >
          <ImageBackground
            source={Background}
            // resizeMode="cover"
            style={componentStyle.layout}
          >
            <View style={componentStyle.centeredView}>
              <View style={componentStyle.modalView}>
                <View>
                  <View style={{ marginBottom: 20 }}>
                    <AnimatedLottieView
                      style={componentStyle.lottie}
                      source={require("../../../assets/lottie/delete.json")}
                      autoPlay
                      loop
                    />
                  </View>
                </View>
                <Text
                  variant="regular"
                  fontSize={14}
                  style={{ lineHeight: 20, marginHorizontal: 21 }}
                >
                  Note: Before proceeding with the wallet delete, Please type
                  "permanently delete" to continue
                </Text>
                <View
                  style={[
                    componentStyle.inputTransfer,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 15,
                    },
                  ]}
                >
                  <TextInput
                    onChangeText={(val) => {
                      setInput(val);
                    }}
                    placeholder="Permanently Delete"
                    placeholderTextColor={"#a59fa4"}
                    style={{ color: "#fff", fontSize: 16, paddingRight: 63 }}
                  />
                </View>
                <Text style={componentStyle.modalText}>
                  Do you really want delete your wallet?
                </Text>
                <View style={{ flexDirection: "row" }}>
                  <Button
                    title="No"
                    variant="cancel"
                    expanded
                    onPress={() => setDeleteModalVisible(false)}
                  />
                  <Button
                    title="Yes"
                    variant="red"
                    expanded
                    disabled={input.toLowerCase() !== "permanently delete"}
                    styles={{
                      opacity:
                        input.toLowerCase() === "permanently delete" ? 1 : 0.5,
                    }}
                    onPress={() => handleDeleteAccout()}
                  />
                </View>
              </View>
            </View>
          </ImageBackground>
        </Modal>
      </View>
    </View>
  );
};

export default PrivateKey;
const componentStyle = StyleSheet.create({
  wpad: {
    marginHorizontal: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    // alignItems: "center",
  },
  hr: {
    width: "100%",
    height: 1,
    backgroundColor: "#707070",
    marginVertical: 7,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
  },
  inputTransfer: {
    height: 45,
    backgroundColor: "#8E7378",
    borderRadius: 30,
    paddingHorizontal: 25,
    fontFamily: textVariants["regular"],
    fontSize: 14,
    color: "#Fff",
    width: "100%",
  },
  logo: {
    height: 45,
    width: 45,
    resizeMode: "contain",
    borderRadius: 25,
  },
  profile: {
    marginVertical: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  dflex: {
    flexDirection: "row",
    alignItems: "center",
  },
  activebtn: {
    width: 8,
    height: 8,
    backgroundColor: "#0ef20e",
    borderRadius: 30,
  },
  cardbg: {
    backgroundColor: "#58374f",
    borderRadius: 37,
    height: 35,
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#675462",
    borderWidth: 1,
  },
  settings: {
    backgroundColor: "#d4d6db33",
    borderRadius: 25,
    paddingVertical: 10,
    marginVertical: 10,
  },
  padH: {
    paddingHorizontal: 15,
  },
  settingsTitle: {
    fontFamily: textVariants["medium"],
    color: "#fff",
    opacity: 0.5,
    fontSize: 17,
    marginVertical: 5,
  },
  inboxTitle: {
    fontFamily: textVariants["medium"],
    fontSize: 15,
    marginLeft: 10,
  },
  modalView: {
    margin: 20,
    backgroundColor: "#eaeaea12",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    // elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  modalText: {
    marginBottom: 15,
    marginTop: 20,
    textAlign: "center",
    fontFamily: textVariants["regular"],
  },
  layout: {
    height: "100%",
    flex: 1,
    justifyContent: "center",
  },
  lottie: {
    width: 70,
    alignSelf: "center",
    // heigh: 300
  },
});
