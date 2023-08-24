import {
  StyleSheet,
  View,
  Image as RNImage,
  TouchableHighlight,
  TouchableOpacity,
  Linking,
  TextInput,
  Image,
  Modal,
  ImageBackground,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SvgUri, SvgXml } from "react-native-svg";
import { Button } from "../Button";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import AnimatedLottieView from "lottie-react-native";
import DocumentPicker from "react-native-document-picker";
import RNFS from "react-native-fs";
import RNFetchBlob from "rn-fetch-blob";
import { RootState } from "../../lib/wallet-sdk/store";
import { changeAccount, updateWallet } from "../../lib/wallet-sdk/coreSlice";
import Clipboard from "@react-native-clipboard/clipboard";
import { Text, textVariants } from "../Text";
import storage from "../../lib/wallet-sdk/storage/storage";
import { Wallet } from "../../lib/wallet-sdk/wallet";
import { useAlert } from "../../hooks/useAlert";
import {
  updateDisplayName,
  updateImportAccounts,
  updateMetadata,
} from "../../lib/wallet-sdk/authSlice";
import { Auth } from "../../lib/wallet-sdk/Auth";
import Reset from "../../../assets/vector/edit.png";
import Right from "../../../assets/vector/right.png";
import Background from "../../../assets/vector/background_one.png";
import { userManager } from "../../lib/wallet-sdk/storage/user-manager";
import LinearGradient from "react-native-linear-gradient";
import Edit from "../../../assets/vector/edit.svg";
import Share from "../../../assets/vector/share.svg";
import Copy from "../../../assets/vector/copy.svg";
import Delete from "../../../assets/vector/delete.svg";
import QR from "../../../assets/vector/qr.svg";
import DownBtn from "../../../assets/vector/DownButton.svg";
import QrModal from "../QrModal";

const AccountSettings = () => {
  const { toast } = useAlert();
  const navigation: any = useNavigation();
  const { wallet, networkProvider } = useSelector(
    (state: RootState) => state.coreReducer
  );
  const { displayName, mailName, auth, metadata, importedAccount } =
    useSelector((state: RootState) => state.authReducer);
  const { walletConnectSession } = useSelector(
    (state: RootState) => state.walletConnectReducer
  );
  const [walletAccounts, setWalletAccounts] = useState<any>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [edit, setEdit] = useState(false);
  const [editAccount, setEditAccount] = useState(false);
  const [showQrIndex, setShowQrIndex] = useState<number | null>(null);
  const [accountIndex, setAccountIndex] = useState("");
  const [editingAccName, setEditingAccName] = useState("");
  const [val, setVal] = useState(displayName);
  const dispatch = useDispatch();
  const [loginId, setLoginId] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [uri, setUri] = useState(metadata);
  const [qrVisible, setQrVisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const [deleteAccount, setDeleteAccount] = useState("");

  useEffect(() => {
    const accounts = wallet.getAcctAddresses();
    console.log("import account **", importedAccount);
    // console.log("accounts is *****", Object.keys(accounts))
    // return
    // return
    setWalletAccounts(accounts);
    setSelectedAccount(wallet.walletInst?.account?.address);
    getLoginId();
  }, [wallet]);

  const getLoginId = async () => {
    setLoginId(await Auth.getLoginId());
  };

  const pickFile = async () => {
    try {
      const response = await DocumentPicker.pickSingle({ mode: "import" });
      // const encryptedAccount = await RNFS.readFile(response.uri);
      setUri({ uri: response.uri });
      let base64 = await RNFetchBlob.fs.readFile(response.uri, "base64");
      dispatch(
        updateMetadata({
          ...metadata,
          profile_image: `data:image/jpg;base64,${base64}`,
        })
      );
      await auth.saveUserRecords({
        displayName: await Auth.getDisplayUserName(),
        loginId: await Auth.getLoginId(),
        loginType: await Auth.getLoginType(),
        metadata: { profile_image: `data:image/jpg;base64,${base64}` },
      });
      toast({
        position: "bottom",
        type: "success",
        title: "Profile Image Changed Successfully",
      });
      console.log("Image Stored Successfully");
      // setFilename(response.name);
    } catch (error) {
      console.log("error in pick", error);
    }
  };

  const changeAccountHandler = async (account: string, index: number) => {
    console.log("currentWallet");
    try {
      const currentWallet =
        wallet.walletInst.wallet || wallet.walletInst.web3.eth.accounts?.wallet;
      console.log(currentWallet);
      const selectedAccount = currentWallet[account];
      wallet.changeAccount(selectedAccount);
      dispatch(changeAccount(selectedAccount));
      // debugger
      walletConnectSession.map((session) => {
        session.walletConnectClient.updateSession({
          ...session.walletConnectClient.session,
          accounts: [account],
        });
      });
      await storage.setItem(
        Wallet.ACCOUNT_SELECTION_STORAGE_KEY,
        index.toString()
      );
    } catch (error) {
      console.log(error);
    }
  };

  const updateRecords = async () => {
    console.log("update records called", {
      loginId: await Auth.getLoginId(),
      loginType: await Auth.getLoginType(),
      displayName: val,
      metadata: {},
    });
    await auth.saveUserRecords({
      loginId: await Auth.getLoginId(),
      loginType: await Auth.getLoginType(),
      displayName: val,
    });
    dispatch(updateDisplayName(val));
    setEdit((e) => !e);
  };

  const copyToClipboard = (item: any) => {
    Clipboard.setString(item);
    toast({
      position: "bottom",
      type: "success",
      title: "Address Copied",
    });
    // Toast.showWithGravity("Address Copied ", Toast.SHORT, Toast.BOTTOM);
  };

  const handleRemoveAccount = async () => {
    console.log("delete acc", deleteAccount);
    if (deleteAccount) {
      const currentWallet =
        wallet.walletInst.wallet || wallet.walletInst.web3.eth.accounts?.wallet;
      if (deleteAccount === wallet.getAccountAddress()) {
        wallet.changeAccount(currentWallet[0]);
        dispatch(changeAccount(currentWallet[0]));
        walletConnectSession.map((session) => {
          session.walletConnectClient.updateSession({
            ...session.walletConnectClient.session,
            accounts: [currentWallet[0].address],
          });
        });
      }
      console.log(currentWallet);
      const selectedAccount = currentWallet[deleteAccount];
      console.log("Selected Account ====>", selectedAccount);
      // if (!selectedAccount) {
      //   console.log(importedAccount);
      //   return;
      // }
      const updatedWallet = await wallet.removeAccount(selectedAccount);
      let user: any = (await userManager.get(await Auth.getUserStorageKey()))
        .importedAccounts;
      console.log("user data", user);
      user = user.map((ele) => {
        ele[deleteAccount] ? delete ele[deleteAccount] : "";
        return ele ? ele : undefined;
      });
      user = user.filter((ele) => Object.keys(ele).length > 0);
      console.log("final data", user);
      setDeleteAccount("");
      await auth.saveUserRecords({
        loginId: await Auth.getLoginId(),
        loginType: await Auth.getLoginType(),
        importedAccounts: user,
      });
      dispatch(updateImportAccounts(user));
      dispatch(updateWallet({ wallet: updatedWallet }));
      setModalVisible(false);
      toast({
        position: "bottom",
        type: "success",
        title: "Account removed successfully",
      });
    }

    // Toast.showWithGravity("Address Copied ", Toast.SHORT, Toast.BOTTOM);
  };

  const openExplorer = (_address: string) => {
    const composedUrl = `${networkProvider.explorerUrl}address/${_address}`;
    Linking.openURL(composedUrl);
  };

  const updateImportAccountsData = async (selectedAddres: string) => {
    setEditAccount(false);
    setAccountIndex(null);
    let user: any = (await userManager.get(await Auth.getUserStorageKey()))
      .importedAccounts;
    user = user.map((ele, i) => {
      ele[selectedAddres] ? (ele[selectedAddres] = editingAccName) : "";
      return ele;
    });
    setEditingAccName("");
    console.log("user is", user);
    await auth.saveUserRecords({
      loginId: await Auth.getLoginId(),
      loginType: await Auth.getLoginType(),
      importedAccounts: user,
    });
    dispatch(updateImportAccounts(user));
  };

  const handleShowDropdown = (index) => {
    setEditAccount(false);
    setAccountIndex(null);
    setShowDropdown((prev) => (prev === index ? null : index));
  };

  const reset = async () => {
    console.log("reset called");
    await userManager.remove(await Auth.getUserStorageKey(), []);
    console.log(
      "data is",
      await userManager.get(await Auth.getUserStorageKey())
    );
  };

  const buttonVariants = {
    // three: ["#DF8128", "#D63E43", "#CC2751"],
    one: ["#3a2660", "#935838", "#cb7525"],
    two: ["#d47822", "#e08028", "#d63e43"],
    three: ["#d84f3a", "#DF8128"],
    four: ["#CE2B4F", "#5D14A6"],
    cancel: ["#8E7378", "#8E7378", "#8E7378"],
  };
  const qrModalHandle = (open: boolean) => {
    setShowQrIndex(null);
  };

  return (
    <View>
      {/* <Text>Hello world</Text> */}
      {/* Profile */}
      <View style={componentStyle.profile}>
        <View>
          <TouchableOpacity onPress={pickFile}>
            <RNImage
              source={{
                uri: (metadata as any).profile_image
                  ? (metadata as any).profile_image
                  : "https://walletqa.guardiannft.org/button-white.png?imwidth=256",
              }}
              style={componentStyle.logo}
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: "#544553",
                borderRadius: 35,
              }}
            >
              <Image
                source={Reset}
                style={[
                  componentStyle.logo,
                  { marginHorizontal: 0, width: 13, height: 13 },
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>
        <View style={{ marginLeft: 10 }}>
          {edit ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                value={val}
                onChangeText={(val) => setVal(val)}
                style={[componentStyle.inputTransfer]}
              />

              <TouchableOpacity
                onPress={updateRecords}
                style={componentStyle.edit}
              >
                <Image
                  source={Right}
                  style={[
                    componentStyle.logo,
                    { marginHorizontal: 10, width: 15, height: 15 },
                  ]}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text variant="medium" fontSize={18}>
                {displayName.length <= 18
                  ? displayName
                  : displayName.substring(0, 18) + "..."}
              </Text>
              <TouchableOpacity
                style={componentStyle.edit}
                onPress={() => setEdit((e) => !e)}
              >
                <Image
                  source={Reset}
                  style={[
                    componentStyle.logo,
                    { marginHorizontal: 10, width: 20, height: 20 },
                  ]}
                />
              </TouchableOpacity>
            </View>
          )}

          <Text
            variant="medium"
            fontSize={15}
            style={{ opacity: 0.7, marginTop: 3 }}
          >
            {loginId}
          </Text>
        </View>
      </View>
      {/* account detsils */}
      <View style={componentStyle.settings}>
        {importedAccount &&
          importedAccount.length > 0 &&
          importedAccount.map((ele: any, index: any) =>
            Object.keys(ele).map((element, i) => {
              return (
                <View key={element}>
                  <TouchableHighlight
                    key={element}
                    underlayColor={"#ffffff10"}
                    onPress={() => changeAccountHandler(element, index)}
                  >
                    <View style={[componentStyle.padH, { marginVertical: 10 }]}>
                      <View
                        style={[
                          componentStyle.dflex,
                          { justifyContent: "space-between" },
                        ]}
                      >
                        {/* <View style={componentStyle.activebtn}></View> */}
                        <View style={[componentStyle.dflex]}>
                          {selectedAccount === element && (
                            <View style={componentStyle.activebtn}></View>
                          )}
                          {selectedAccount !== element && (
                            <View style={componentStyle.disablebtn}></View>
                          )}
                          {index === accountIndex && editAccount ? (
                            <TextInput
                              value={editingAccName}
                              style={[
                                componentStyle.inputTransfer,
                                {
                                  flex: 0.85,
                                  marginLeft: 10,
                                  // elevation: 50,
                                },
                              ]}
                              onChangeText={(val) => setEditingAccName(val)}
                            />
                          ) : (
                            <Text
                              style={{
                                color: "#fff",
                                fontFamily: textVariants["medium"],
                                fontSize: 15,
                                marginLeft: 10,
                                flex: 0.8,
                              }}
                            >
                              {ele[element].length <= 18
                                ? ele[element]
                                : ele[element].substring(0, 18) + "..."}
                            </Text>
                          )}
                        </View>
                        <QrModal
                          address={element}
                          qrVisible={showQrIndex === index}
                          qrModalHandle={qrModalHandle}
                        />
                        <View>
                          {showDropdown === index ? (
                            <TouchableOpacity
                              onPress={() => handleShowDropdown(index)}
                              style={componentStyle.downBtn}
                            >
                              <SvgXml width={15} height={15} xml={DownBtn} />
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              onPress={() => handleShowDropdown(index)}
                              style={componentStyle.downBtn}
                            >
                              <SvgXml
                                width={15}
                                height={15}
                                xml={DownBtn}
                                style={{ transform: [{ rotate: "180deg" }] }}
                              />
                            </TouchableOpacity>
                          )}
                        </View>
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
                        {element}
                      </Text>
                    </View>
                  </TouchableHighlight>
                  {showDropdown === index && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-around",
                        marginHorizontal: 20,
                        paddingVertical: 10,
                      }}
                    >
                      {index !== 0 && !editAccount && (
                        <TouchableOpacity
                          onPress={() => {
                            console.log("index", index);
                            setEditingAccName(ele[element]);
                            setEditAccount((e) => !e);
                            setAccountIndex(index);
                          }}
                          style={componentStyle.cardbg}
                        >
                          <LinearGradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            colors={buttonVariants["three"]}
                            style={componentStyle.cardbg}
                          >
                            <SvgXml width={22} height={22} xml={Edit} />
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                      {index !== 0 && editAccount && index === accountIndex && (
                        <TouchableOpacity
                          onPress={() => {
                            updateImportAccountsData(element);
                          }}
                          style={componentStyle.edit}
                        >
                          <LinearGradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            colors={buttonVariants["cancel"]}
                            style={componentStyle.cardbg}
                          >
                            <Image
                              source={Right}
                              style={[
                                componentStyle.logo,
                                { marginHorizontal: 10, width: 15, height: 15 },
                              ]}
                            />
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => openExplorer(element)}
                        style={componentStyle.cardbg}
                      >
                        <LinearGradient
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          colors={buttonVariants["three"]}
                          style={componentStyle.cardbg}
                        >
                          <SvgXml width={16} height={16} xml={Share} />
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          copyToClipboard(element);
                        }}
                        style={componentStyle.cardbg}
                      >
                        <LinearGradient
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          colors={buttonVariants["three"]}
                          style={componentStyle.cardbg}
                        >
                          <SvgXml width={16} height={16} xml={Copy} />
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setShowQrIndex(index);
                        }}
                        style={componentStyle.cardbg}
                      >
                        <LinearGradient
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          colors={buttonVariants["three"]}
                          style={componentStyle.cardbg}
                        >
                          <SvgXml width={18} height={18} xml={QR} />
                        </LinearGradient>
                      </TouchableOpacity>
                      {index !== 0 && (
                        <TouchableOpacity
                          onPress={() => {
                            setDeleteAccount(element);
                            setModalVisible(true);
                          }}
                          style={componentStyle.cardbg}
                        >
                          <LinearGradient
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            colors={buttonVariants["three"]}
                            style={componentStyle.cardbg}
                          >
                            <SvgXml width={18} height={18} xml={Delete} />
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  <View style={componentStyle.hr}></View>
                </View>
              );
            })
          )}
        <View>
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
          >
            <ImageBackground
              source={Background}
              // resizeMode="cover"
              style={componentStyle.layout}
            >
              <View style={componentStyle.centeredView}>
                <View style={componentStyle.modalView}>
                  <View>
                    <AnimatedLottieView
                      style={componentStyle.lottie}
                      source={require("../../../assets/lottie/error.json")}
                      autoPlay
                      loop
                    />
                  </View>
                  <Text
                    variant="regular"
                    fontSize={14}
                    style={{ lineHeight: 20, marginHorizontal: 19 }}
                  >
                    Note: This account will be removed from your wallet. Please
                    make sure you have the private key for this imported account
                    before continuing.
                  </Text>
                  <Text style={componentStyle.modalText}>
                    Do you really want delete this account?
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
                      onPress={() => handleRemoveAccount()}
                    />
                  </View>
                </View>
              </View>
            </ImageBackground>
          </Modal>
        </View>
        <View style={[componentStyle.padH, { marginVertical: 15 }]}>
          <Button
            styles={{ marginHorizontal: 30 }}
            title="Import Account"
            variant="two"
            expanded
            onPress={() => {
              wallet.getAccountAddress();
              navigation.navigate("ImportWallet");
            }}
          />
        </View>
      </View>
    </View>
  );
};

export default AccountSettings;

const componentStyle = StyleSheet.create({
  profile: {
    marginTop: 20,
    marginBottom: 10,
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
  disablebtn: {
    width: 8,
    height: 8,
    backgroundColor: "#321b2b",
    borderRadius: 30,
  },
  cardbg: {
    // backgroundColor: "#58374F",
    borderRadius: 37,
    width: 40,
    height: 40,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    // borderColor: "#675462",
    // borderWidth: 1,
    marginHorizontal: 5,
  },
  downBtn: {
    // backgroundColor: "#58374F",
    borderRadius: 37,
    width: 35,
    height: 35,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    // borderColor: "#675462",
    // borderWidth: 1,
    marginHorizontal: 5,
  },
  settings: {
    backgroundColor: "#d4d6db33",
    borderRadius: 25,
    paddingVertical: 10,
    overflow: "hidden",
    marginVertical: 10,
  },
  padH: {
    paddingHorizontal: 15,
  },
  hr: {
    width: "100%",
    height: 1,
    backgroundColor: "#707070",
    marginVertical: 7,
  },
  logo: {
    height: 45,
    width: 45,
    resizeMode: "contain",
    borderRadius: 25,
  },
  inputTransfer: {
    height: 35,
    backgroundColor: "#544553",
    width: "70%",
    borderRadius: 30,
    // letterSpacing: 1,
    marginHorizontal: "auto",
    marginVertical: 10,
    paddingLeft: 15,
    paddingRight: 15,
    fontFamily: textVariants["regular"],
    fontSize: 14,
    color: "#Fff",
  },
  edit: {
    backgroundColor: "#544553",
    width: 25,
    height: 25,
    justifyContent: "center",
    borderRadius: 35,
    alignItems: "center",
    marginHorizontal: 10,
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
    width: 80,
    alignSelf: "center",
    // heigh: 300
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    // alignItems: "center",
  },
});
