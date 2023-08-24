import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  ScrollView,
  Modal,
  ImageBackground,
} from "react-native";
import React, { useEffect, useState } from "react";
import { RootState } from "../../lib/wallet-sdk/store";
import { useSelector } from "react-redux";
import { Wallet } from "../../lib/wallet-sdk/wallet";
import { useNavigation } from "@react-navigation/native";
import { Text, textVariants } from "../Text";
import { globalStyles } from "../../styles/global.style";
import { contactManager } from "../../lib/wallet-sdk/storage/contact-manager";
import { Auth } from "../../lib/wallet-sdk/Auth";
import { SvgUri, SvgXml } from "react-native-svg";
import Search from "../../../assets/vector/search.png";
import Clipboard from "@react-native-clipboard/clipboard";
import { useAlert } from "../../hooks/useAlert";
import { Button } from "../Button";
import Background from "../../../assets/vector/background_one.png";
import CopySvg from "../../../assets/vector/copy.svg";
import AnimatedLottieView from "lottie-react-native";

const ChatContactList = () => {
  const { toast } = useAlert();
  const navigation: any = useNavigation();
  const { wallet } = useSelector(
    (state: RootState) => state.coreReducer
  );

  const { chatConfig } = useSelector(
    (state: RootState) => state.chatReducer
  );

  const [list, setList] = useState([]);
  const [signMessageModal, setSignMessageModal] = useState(true);

  const points = [
    "Guadrian wallet wants you to sign in with your web3 account"
  ];

  useEffect(() => {
    getSignMessage()
  }, [])

  const copyToClipboard = (item: any) => {
    Clipboard.setString(item);
    toast({
      position: "bottom",
      type: "success",
      title: "Address Copied",
    });
    // Toast.showWithGravity("Address Copied ", Toast.SHORT, Toast.BOTTOM);
  };
  const searchAddress = (search: string) => {
    if (search) {
      let pattern = new RegExp(search, "i");
      let res = list.filter((ele) => {
        return pattern.test(ele.name) || pattern.test(ele.address);
      });
      res && setList(res);
      return;
    }
    getContacts();
    // console.log(res)
  };

  const getSignMessage = async () => {
    console.log("sign message")
    let isSigned = await Auth.getIsSigned(wallet.walletInst.account.address);
    console.log("issigned", isSigned)
    if(!isSigned) {
      setSignMessageModal(false)
      // redirect
      // navigation.navigate('', {})
      chatConfig.pubKeyCheck(wallet.walletInst.account.address);
      chatConfig.getPubkey((res) => {
          console.log("_pubKey res", res?.pubkey)
      })
    }
  }

  const setSignMessage = async () => {
    console.log("sign messaged");
    let sign = await wallet.walletInst.signMessage('Encrypt all the chat messages');
    console.log("sign message", sign)
    chatConfig.updatePubKey(wallet.walletInst.account.address, sign);
    chatConfig.getPubkey(async (res) => {
      console.log("Getpub key res", res?.pubKey)
      if(res?.pubKey) {
          await Auth.setPubKey(res?.pubKey, wallet.walletInst.account.address);
      }
  });
    await Auth.setIsSigned(true, '');
    setSignMessageModal(true)
  }

  const getContacts = async () => {
    try {
      const data = await contactManager.get(
        `${await Auth.getLoginId()}_${await Auth.getLoginType()}`
      );
      if (data) {
        for (let i = 0; i < data.length; i++) {
          console.log(data[i].address)
          chatConfig.joinChat(wallet.walletInst.account.address, data[i].address);
        }
      }

      data && setList(data)
      return data;
    } catch (error) {
      console.log("error", error)
    }
  };
  useEffect(() => {
    getContacts();
  }, []);
  const handleBack = () => {
    navigation.goBack();
  };
  return (
    <View style={globalStyles.screen}>
      <View style={styles.wpad}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={{ width: 30 }}>
            <SvgUri
              width={20}
              height={20}
              uri="https://walletalpha.guardianlink.io/back.svg"
            />
          </TouchableOpacity>
          <Text
            variant="medium"
            style={{ color: "#fff", fontSize: 16, marginLeft: 20 }}
          >
            Chat
          </Text>
        </View>
      </View>
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 10,
            marginHorizontal: 15,
          }}
        >
          <TextInput
            onChangeText={(val) => {
              searchAddress(val);
            }}
            // value={toAddress}
            placeholder="Search Contacts"
            placeholderTextColor={"#a59fa4"}
            style={[styles.inputTransfer]}
          />
          <TouchableOpacity
            style={{ right: 0, alignSelf: "center", position: "absolute" }}
          >
            <Image
              source={Search}
              style={[
                {
                  marginHorizontal: 20,
                  width: 20,
                  height: 20,
                  resizeMode: "contain",
                },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={!signMessageModal}
      >
        <ImageBackground
          source={Background}
          // resizeMode="cover"
          style={styles.layout}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    marginHorizontal: 10,
                  }}
                >
                  <AnimatedLottieView
                    style={{
                      width: 35,
                      height: 40,
                    }}
                    source={require("./Warning.json")}
                    autoPlay
                    loop
                  />
                </View>
                <View style={{ paddingHorizontal: 10 }}>
                  <Text
                    style={{
                      color: "#D37624",
                      fontSize: 17,
                      ...styles.modalText,
                    }}
                  >
                    Signature request
                  </Text>
                </View>
              </View>
              <View
                style={{
                  paddingVertical: 6,
                }}
              >
                <Text
                  variant="medium"
                  fontSize={13}
                  style={{
                    textAlign: "left",
                    color: "white",
                  }}
                >
                  You are signing:
                </Text>
              </View>
              <View
                style={{
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  paddingHorizontal: 25,
                  paddingVertical: 6,
                }}
              >
                {points &&
                  points.map((ele, i) => {
                    return (
                      <Text
                        variant="regular"
                        fontSize={13}
                        key={i}
                        style={{
                          color: "#BEC0C4",
                          marginBottom: 10,
                          lineHeight: 20,
                        }}
                      >
                        {"\u2B24" + " "}
                        {ele}
                      </Text>
                    );
                  })}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  paddingVertical: 6,
                }}
              >
                <Button
                  styles={{ marginHorizontal: 60 }}
                  title="Reject"
                  variant="two"
                  expanded
                  onPress={() => setSignMessageModal(true)}
                />
              </View>
              <View
                style={{
                  flexDirection: "row",
                  paddingVertical: 6,
                }}
              >
                <Button
                  styles={{ marginHorizontal: 60 }}
                  title="Sign"
                  variant="two"
                  expanded
                  onPress={() => setSignMessage()}
                />
              </View>
            </View>
          </View>
        </ImageBackground>
      </Modal>

      <ScrollView>
        <View>
          {list.length > 0 ? (
            list.map((ele, i) => (
              <TouchableOpacity
                key={ele.address}
                onPress={() => {
                  navigation.navigate("ChatScreen", { to: ele.address, name: ele.name })
                }}
              >
                <View style={styles.contactView}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={styles.profile}>
                      <Text variant={"medium"}>
                        {ele.name[0].toUpperCase()}
                        {ele.name[1].toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text>
                        
                        {ele.name.length <= 20
                          ? `${ele.name}`
                          : ele.name.substr(0, 20) + "..."}
                        {/* {`${ele.status} - isOnline`} */}
                        {ele.status === true && <View style={styles.activebtn}></View>}
                      </Text>
                      <Text
                        numberOfLine={1}
                        variant={"regular"}
                        fontSize={10}
                        textAlign="center"
                        opacity={0.7}
                        style={{ marginTop: 5 }}
                      >
                        {Wallet.displayAddressWithEllipsis(ele.address, 12)}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row" }}>
                    <TouchableOpacity
                      onPress={() => {
                        copyToClipboard(ele.address);
                      }}
                      style={styles.cardbgnew}
                    >
                      <SvgXml
                        width={13}
                        height={13}
                        xml={CopySvg}
                        style={[styles.logo, { marginHorizontal: 10 }]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ alignItems: "center" }}>
              <Text variant="light" opacity={0.6}>
                No contacts
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};
export default ChatContactList;
const styles = StyleSheet.create({
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
  cardbgnew: {
    backgroundColor: "#58374f",
    borderRadius: 37,
    width: 32,
    height: 32,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#675462",
    borderWidth: 1,
    marginHorizontal: 5,
  },

  contactView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#322332",
    marginHorizontal: 15,
    marginVertical: 5,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
  },
  centeredView: {
    // flex: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 30 : 0,
  },
  newView: {
    flex: 1,
    justifyContent: "center",
    // alignItems: "center",
  },
  dropdown: {
    height: 45,
    backgroundColor: "#d4d6db33",
    paddingHorizontal: 25,
    borderRadius: 30,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#fff",
  },
  selectedTextStyle: {
    fontSize: 14,
    borderRadius: 15,
    color: "#fff",
    fontFamily: textVariants["regular"],
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 12,
  },
  card: {
    // height: 223,
    // borderRadius: 37,
    marginVertical: 20,
    padding: 20,
    marginHorizontal: 0,
  },
  cardhearder: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardbg: {
    backgroundColor: "#ffffff4f",
    borderRadius: 37,
    padding: 10,
    height: 55,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    height: 45,
    width: 45,
    resizeMode: "contain",
    borderRadius: 25,
  },
  layout: {
    height: "100%",
    flex: 1,
    justifyContent: "center",
  },
  input: {
    height: 45,
    backgroundColor: "#eaeaea63",
    width: "50%",
    borderRadius: 50,
    paddingHorizontal: 15,
    // letterSpacing: 1,
    marginHorizontal: 5,
    fontFamily: textVariants["regular"],
    fontSize: 14,
    color: "#fff",
  },
  inputTransfer: {
    height: 45,
    backgroundColor: "#544553",
    width: "100%",
    borderRadius: 30,
    // letterSpacing: 1,
    marginHorizontal: "auto",
    marginVertical: 20,
    paddingLeft: 25,
    paddingRight: 65,
    fontFamily: textVariants["regular"],
    fontSize: 14,
    color: "#Fff",
  },
  selectInput: {
    backgroundColor: "red",
  },
  buttonGroup: {
    flexDirection: "row",
    margin: 20,
    marginHorizontal: 80,
  },
  transferHeading: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    opacity: 0.8,
    fontFamily: textVariants["regular"],
  },
  textWarn: {
    color: "#ffc107",
    textAlign: "center",
    fontSize: 14,
    opacity: 0.8,
    fontFamily: textVariants["regular"],
    marginBottom: 10,
  },
  textSuc: {
    color: "green",
    textAlign: "center",
    fontSize: 16,
    opacity: 0.8,
    fontFamily: textVariants["regular"],
  },
  addContact: {
    // backgroundColor: "#6b5969",
    width: 45,
    height: 45,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
    opacity: 0.95,
  },
  profile: {
    backgroundColor: "#1c0a18",
    width: 45,
    height: 45,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
  },
  wpad: {
    marginHorizontal: 20,
  },
  lottie: {
    width: 180,
    alignSelf: "center",
    // heigh: 300
  },
});
