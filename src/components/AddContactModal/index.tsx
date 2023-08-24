import {
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import bgBlur from "../../../assets/image/bgBlur.png";
import IconAntD from "react-native-vector-icons/AntDesign";
import { SvgXml } from "react-native-svg";
import { TextInput } from "react-native-gesture-handler";
import { Button } from "../Button";
import { NewContactType } from "../../lib/wallet-sdk/types/contact-type";
import { contactManager } from "../../lib/wallet-sdk/storage/contact-manager";
import { useSelector } from "react-redux";
import { RootState } from "../../lib/wallet-sdk/store";
import _ from "lodash";
import { Auth } from "../../lib/wallet-sdk/Auth";
import { useNavigation } from "@react-navigation/native";
import { textVariants } from "../Text";
import { useAlert } from "../../hooks/useAlert";
import Scanner from "../Scanner";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import CloseSvg from "../../../assets/vector/close.svg";

const ModalView = ({ modalVisible, modalHandle, onSuccess }: any) => {
  const { toast } = useAlert();
  const navigation: any = useNavigation();
  const [name, setName] = useState("");
  const [publicAddress, setPublicAddress] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const { wallet } = useSelector((state: RootState) => state.coreReducer);

  const saveOnly = async () => {
    try {
      let data =
        (await contactManager.get(
          `${await Auth.getLoginId()}_${await Auth.getLoginType()}`
        )) || [];
      let isValidAddress = await wallet.walletInst?.isValidAddress(
        publicAddress
      );
      let isExists = data.find(
        (ele) => ele.address === publicAddress || ele.name === name
      );
      let isMe = wallet.getAccountAddress() == publicAddress;
      if (!isValidAddress) {
        toast({
          position: "bottom",
          type: "error",
          title: "Invalid address",
        });
        return;
      }
      if (isExists || isMe) {
        toast({
          position: "bottom",
          type: "error",
          title: "Address or Name already exists",
        });
        return;
      }
      let newContact: NewContactType[] = [
        { name: name, address: publicAddress },
      ];
      data = data.concat(newContact);
      data = _.uniqBy(data, (el: NewContactType) => el.name);
      let key = `${await Auth.getLoginId()}_${await Auth.getLoginType()}`;
      await contactManager.set(key, data);
      setPublicAddress("");
      onSuccess();
      modalHandle(false);
    } catch (error) {
      console.log(error.message);
    }
  };

  const saveAndSend = async () => {
    try {
      let data =
        (await contactManager.get(
          `${await Auth.getLoginId()}_${await Auth.getLoginType()}`
        )) || [];
      let isValidAddress = await wallet.walletInst?.isValidAddress(
        publicAddress
      );
      let isExists = data.find(
        (ele) => ele.address === publicAddress || ele.name === name
      );
      let isMe = wallet.getAccountAddress() == publicAddress;
      if (!isValidAddress) {
        toast({
          position: "bottom",
          type: "error",
          title: "Invalid address",
        });
        return;
      }
      if (isExists || isMe) {
        toast({
          position: "bottom",
          type: "error",
          title: "Address or Name already exists",
        });
        return;
      }
      let newContact: NewContactType[] = [
        { name: name, address: publicAddress },
      ];
      data = data.concat(newContact);
      data = _.uniqBy(data, (el: NewContactType) => el.name);
      let key = `${await Auth.getLoginId()}_${await Auth.getLoginType()}`;
      await contactManager.set(key, data);
      setPublicAddress("");
      onSuccess();
      modalHandle(false);
      // setAddress(publicAddress);
      navigation.navigate("Transfer", { address: publicAddress, name: name });
    } catch (error) {
      console.log(error.message);
    }
  };
  console.log("name----> ", name);
  return (
    <View style={styles.centeredView}>
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        {showScanner ? (
          <Scanner
            route={{
              dontNavigate: true,
              goBack: () => {
                setShowScanner(false);
              },
              params: {
                onData: (value) => {
                  console.log("Value returned from scanner ===> ", value);
                  setShowScanner(false);
                  setPublicAddress(() => value.split("ethereum:").pop());
                },
              },
            }}
          />
        ) : (
          <View style={styles.centeredView}>
            <ImageBackground
              source={bgBlur}
              resizeMode="cover"
              style={styles.image}
            >
              <View style={styles.layout}>
                <View style={styles.layoutHeader}>
                  <Text style={styles.text}>Add a New Contact</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setPublicAddress("");
                      modalHandle(false);
                    }}
                  >
                    <SvgXml width={15} height={15} xml={CloseSvg} />
                  </TouchableOpacity>
                </View>
                <View style={styles.nameHolder}>
                  <TextInput
                    onChangeText={(value) => setName(value)}
                    value={name}
                    placeholder="Add Name"
                    placeholderTextColor={"#ffffff60"}
                    style={styles.textPlace}
                  />
                </View>
                <View style={styles.hrLine}></View>
                <View style={styles.nameHolder}>
                  <TextInput
                    value={publicAddress}
                    onChangeText={(value) => setPublicAddress(value)}
                    placeholder="Enter Public Address"
                    placeholderTextColor={"#ffffff60"}
                    style={styles.textPlace}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setShowScanner(true);
                    }}
                    style={{
                      right: 20,
                      position: "absolute",
                      alignItems: "center",
                      top: 0,
                      bottom: 0,
                      flexDirection: "row",
                    }}
                  >
                    <IconAntD name="scan1" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.buttonGroup}>
                <Button
                  title="Save Only"
                  variant="one"
                  onPress={() => {
                    saveOnly();
                  }}
                  expanded
                />
                <Button
                  title="Save & Send"
                  variant="two"
                  expanded
                  onPress={() => {
                    saveAndSend();
                  }}
                />
              </View>
            </ImageBackground>
          </View>
        )}
        <Toast />
      </Modal>
    </View>
  );
};
export default ModalView;

const styles = StyleSheet.create({
  image: {
    flex: 1,
    justifyContent: "center",
  },
  centeredView: {
    flex: 1,
  },

  button1: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
  },

  buttonClose: {
    backgroundColor: "#2196F3",
  },
  buttonGroup: {
    flexDirection: "row",
    margin: 20,
    marginTop: 30,
  },
  layout: {
    width: "90%",
    // height: "40%",
    alignSelf: "center",
    backgroundColor: "#ffffff10",
    borderRadius: 25,

    // position: "absolute",
    // opacity: 0.2,
  },
  layoutHeader: {
    backgroundColor: "#ffffff20",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  nameHolder: {
    paddingVertical: 12,
    paddingHorizontal: 25,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontFamily: textVariants["regular"],
  },
  textPlace: {
    fontSize: 14,
    letterSpacing: 3,
    color: "#fff",
    fontFamily: textVariants["regular"],
    height: 35,
    paddingLeft: 5,
    paddingRight: 30,
  },
  hrLine: {
    backgroundColor: "#d5cbcb40",
    opacity: 0.3,
    height: 1,
  },
});
