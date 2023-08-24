import React, { Component, useEffect, useRef } from "react";
import {
  Platform,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  FlatList,
} from "react-native";
import { Text, textVariants } from "../Text";
import { globalStyles } from "../../styles/global.style";
import Chat from "../../lib/chat-sdk/chat";
import { useState } from "react";
import { Button } from "../Button";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../lib/wallet-sdk/store";
import { chatManager } from "../../lib/wallet-sdk/storage/chat-manager";
import SenderMeassage from "./SenderMessage";
import ReceiverMessage from "./ReceiverMessage";
import { SvgUri, SvgXml } from "react-native-svg";
import send from "../../../assets/vector/Send.svg";
import privacy from "../../../assets/vector/chatprivacy.svg";
import { useNavigation } from "@react-navigation/native";
import { Wallet } from "../../lib/wallet-sdk/wallet";
import { updateMessages } from "../../lib/wallet-sdk/chatSlice";
import { Auth } from "../../lib/wallet-sdk/Auth";

const ChatScreen = ({ route }: any) => {
  const { wallet } = useSelector((state: RootState) => state.coreReducer);
  const { chatConfig, messages: reduxMessages } = useSelector(
    (state: RootState) => state.chatReducer
  );
  const navigation: any = useNavigation();
  const dispatch = useDispatch();
  const { to, name } = route.params;
  const [newMessage, setNewMessage] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const scrollViewRef = useRef(null);
  const socketRef = useRef(null);
  const [online, setOnline] = useState(false);
  const [userPubKey, setUserPubKey] = useState("");
  const [showMesage, setShowMesage] = useState(false);

  useEffect(() => {
    // TODO: connect only if socket is disconnected
    // socket.connect();
    // to --> check
    checkPubKeyForRecipient();
    console.log(wallet.walletInst.account.address, to, "----->.....");
    getMessage();
  }, []);

  useEffect(() => {
    getMessage();
  }, [reduxMessages]);

  const checkPubKeyForRecipient = async () => {
    let toUserPubKey = await Auth.getPubKey(to);
    console.log("toUserPubKey :", to, toUserPubKey);
    if (!toUserPubKey) {
      chatConfig.pubKeyCheck(to);
      chatConfig.getPubkey(async (res) => {
        console.log("Getpub key res", res?.pubKey);
        if (res?.pubKey) {
          setUserPubKey(toUserPubKey);
          await Auth.setPubKey(res?.pubKey, to);
          setShowMesage(false);
          return;
        } else {
          setShowMesage(true);
          return;
        }
      });
    }
    setUserPubKey(toUserPubKey);
    setShowMesage(false);
  };

  const getMessage = async () => {
    try {
      let chat_data = await chatManager.get(
        wallet.walletInst.account.address,
        []
      );
      setAllMessages(chat_data?.[to] || []);
      chatConfig.isOnline([to]);
      chatConfig.isOnlineResponse((res) => {
        setOnline(res ? res[0].status : false);
      });
    } catch (error) {
      console.log("err..", error);
    }
  };

  const storeData = async (type: "receive" | "send", messageData: any) => {
    try {
      // key is recipient
      // addres is sender address
      let key =
        type === "receive" ? messageData["sender"] : messageData["recipient"];
      let address = wallet.walletInst.account.address;
      await chatManager.set(key, [address], messageData);
      type === "send" && setNewMessage("");
      let chat_data = await chatManager.get(key, []);
      console.log("chat_data....");
      dispatch(updateMessages(chat_data));
      getMessage();
    } catch (error) {
      console.log("errror in catch", error);
    }
  };

  // sample structure written in chat-manger.ts
  const sendMessage = async () => {
    if (newMessage.trim() === "") return;
    console.log(
      "Send message: ",
      userPubKey
        ? await chatConfig._encryptMessage(newMessage, userPubKey)
        : newMessage
    );
    await chatConfig.sendMessage(
      {
        sender: wallet.walletInst.account.address,
        recipient: to,
        content: newMessage,
      },
      userPubKey
    );
    console.log("Store Message Called :");
    storeData("send", {
      sender: wallet.walletInst.account.address,
      recipient: to,
      content: userPubKey
        ? (await chatConfig._encryptMessage(newMessage, userPubKey))
            .encryptedData
        : newMessage,
      rawMessage: userPubKey ? newMessage : undefined,
      timestamp: Date.now(),
    });
  };
  const keyboardVerticalOffset = Platform.OS === "android" ? 40 : 0;
  return (
    <KeyboardAvoidingView
      behavior="height"
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={{ height: "100%" }}>
        <View style={{ backgroundColor: "#251723" }}>
          <View style={styles.wpad}>
            <View style={[styles.header]}>
              <TouchableOpacity
                style={{ width: 30 }}
                onPress={() => navigation.goBack()}
              >
                <SvgUri
                  width={20}
                  height={20}
                  uri="https://walletalpha.guardianlink.io/back.svg"
                />
              </TouchableOpacity>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={styles.profile}>
                  <Text variant={"medium"}>
                    {name[0].toUpperCase()}
                    {name[1].toUpperCase()}
                  </Text>
                </View>
                <View>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text>{name}</Text>
                    {online === true && (
                      <View style={[styles.activebtn, { marginTop: 3 }]}></View>
                    )}
                  </View>
                  <Text
                    numberOfLine={1}
                    variant={"regular"}
                    fontSize={10}
                    textAlign="center"
                    opacity={0.7}
                    style={{ marginTop: 5 }}
                  >
                    {Wallet.displayAddressWithEllipsis(to, 12)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        <View
          style={{
            flex: 1,
          }}
        >
          <FlatList
            ref={scrollViewRef}
            onContentSizeChange={() =>
              scrollViewRef.current.scrollToEnd({ animated: true })
            }
            ListHeaderComponent={
              <View>
                {showMesage && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      justifyContent: "flex-start",
                      backgroundColor: "#fff1",
                      paddingVertical: 7,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      marginHorizontal: 20,
                      marginVertical: 10,
                    }}
                  >
                    <SvgXml
                      width={10}
                      height={10}
                      xml={privacy}
                      style={{ marginRight: 5, marginTop: 3 }}
                    />

                    <Text
                      fontSize={10}
                      variant="light"
                      color="#fcd178"
                      style={{ opacity: 0.7, lineHeight: 14 }}
                    >
                      Messages to this address are not end-to-end encrypted
                      until the address has signed into chat.
                    </Text>
                  </View>
                )}
              </View>
            }
            data={allMessages}
            renderItem={(item) => {
              return (
                <View
                  key={item.index}
                  style={[styles.wpad, { marginVertical: 0 }]}
                >
                  {wallet.walletInst.account.address === item.item.recipient ? (
                    <ReceiverMessage
                      message={item.item.content}
                      timestamp={item.item.timestamp}
                      checksum={item.item.checksum}
                    />
                  ) : (
                    <SenderMeassage
                      message={item.item.content}
                      timestamp={item.item.timestamp}
                      rawMessage={item.item.rawMessage}
                    />
                  )}
                </View>
              );
            }}
          />
        </View>
        <View
          style={{
            // position: "absolute",
            // bottom: 0,
            // width: "100%",
            paddingHorizontal: 10,
            paddingVertical: Platform.OS === "ios" ? 80 : 10,
            backgroundColor: "#10040e",
          }}
        >
          <View style={styles.buttonGroup}>
            {/* <Button title="Transfer" variant="one" expanded />
                        <Button title="Request" variant="two" expanded /> */}
            <TextInput
              //   value={form.tokenName}
              placeholder="Message"
              placeholderTextColor={"#ffffff60"}
              style={styles.textPlace}
              editable={true}
              onChangeText={(val) => setNewMessage(val)}
              value={newMessage}
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={{
                right: 15,
                alignSelf: "center",
                position: "absolute",
                padding: 10,
              }}
            >
              <SvgXml width={20} height={20} xml={send} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  activebtn: {
    width: 6,
    height: 6,
    backgroundColor: "#0ef20e",
    borderRadius: 30,
    marginHorizontal: 10,
  },
  disablebtn: {
    width: 8,
    height: 8,
    backgroundColor: "#321b2b",
    borderRadius: 30,
    marginHorizontal: 10,
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

  profile: {
    backgroundColor: "#180812",
    width: 45,
    height: 45,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#3f333d",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  wpad: {
    marginHorizontal: 20,
  },
  lottie: {
    width: 180,
    alignSelf: "center",
    // heigh: 300
  },

  buttonGroup: {
    flexDirection: "row",
    height: 50,
  },
  textPlace: {
    backgroundColor: "#3f333d",
    color: "#fff",
    flex: 1,
    borderRadius: 50,
    paddingLeft: 20,
    paddingRight: 60,
    marginHorizontal: 10,
  },
  time: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },

  menuHr: {
    backgroundColor: "#aa9fa87d",
    flex: 1,
    height: 0.5,
    marginVertical: 5,
  },
});
