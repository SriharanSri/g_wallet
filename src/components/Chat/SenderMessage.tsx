import React, { Component, useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Image,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
} from "react-native";
import { globalStyles } from "../../styles/global.style";
import { useNavigation } from "@react-navigation/native";
import { SvgUri, SvgXml } from "react-native-svg";
import { Text, textVariants } from "../Text";
import dot from "../../../assets/vector/threedot.svg";
import send from "../../../assets/vector/Send.svg";
import { ScrollView, TextInput } from "react-native-gesture-handler";
import { Button } from "../Button";
import { useSelector } from "react-redux";
import { RootState } from "../../lib/wallet-sdk/store";
const SenderMeassage = ({ route, message, timestamp, checksum, rawMessage }: any) => {
  const [show, setShow] = React.useState(false);
  const { chatConfig } = useSelector(
    (state: RootState) => state.chatReducer
  );

  // if(checksum) {
  //   message = chatConfig._decryptMessage(message, )
  // }

  return (
    <View style={styles.send}>
      <Text variant="light" fontSize={12} style={{ lineHeight: 18 }}>
        {rawMessage? rawMessage : message}
      </Text>
      <View style={styles.time}>
        <Text variant="light" color="#969296" fontSize={9}>
        {timestamp ? new Date(timestamp).toLocaleTimeString() : ''}
        </Text>
        <TouchableOpacity onPress={() => setShow(!show)}>
          {/* <SvgXml width={12} height={12} xml={} /> */}
        </TouchableOpacity>
        {show ? (
          <View style={styles.messageMenu}>
            <View>
              <Text
                textAlign="center"
                variant="regular"
                fontSize={10}
                style={{ marginVertical: 5 }}
              >
                Reply
              </Text>
            </View>
            <View style={styles.menuHr}></View>
            <View>
              <Text
                textAlign="center"
                variant="regular"
                color="red"
                fontSize={10}
                style={{ marginVertical: 5 }}
              >
                Delete
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
};
export default SenderMeassage;
const styles = StyleSheet.create({
  wpad: {
    marginHorizontal: 20,
  },
  lottie: {
    width: 180,
    alignSelf: "center",
    // heigh: 300
  },
  send: {
    backgroundColor: "#3F333D",
    maxWidth: 300,
    minWidth: 100,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 3,
    textAlign: "left",
    alignSelf: "flex-end",
  },
  buttonGroup: {
    flexDirection: "row",
  },
  textPlace: {
    backgroundColor: "#3F333D",
    width: 150,
    // flex:1,
    borderRadius: 50,
    paddingHorizontal: 10,
  },
  time: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
    alignSelf: "flex-end",
  },
  messageMenu: {
    width: 110,
    position: "absolute",
    backgroundColor: "#352731",
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 5,
    zIndex: 1,
    right: -5,
    top: 15,
    justifyContent: "center",
  },
  menuHr: {
    backgroundColor: "#aa9fa87d",
    flex: 1,
    height: 0.5,
    marginVertical: 5,
  },
});
