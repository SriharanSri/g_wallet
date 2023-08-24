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
import React, { useContext, useEffect, useState } from "react";
import LinearGradient from "react-native-linear-gradient";
import { RootState } from "../../lib/wallet-sdk/store";
import { useSelector } from "react-redux";
import { Wallet } from "../../lib/wallet-sdk/wallet";
import { useNavigation } from "@react-navigation/native";
import { Text, textVariants } from "../Text";
import { globalStyles } from "../../styles/global.style";
import { LoadingIndicatorContext } from "../../App";
import { contactManager } from "../../lib/wallet-sdk/storage/contact-manager";
import { Auth } from "../../lib/wallet-sdk/Auth";
import ModalView from "../AddContactModal";
import { SvgUri, SvgXml } from "react-native-svg";
import { AuthHeader } from "../AuthHeader";
import Search from "../../../assets/vector/search.png";
import Clipboard from "@react-native-clipboard/clipboard";
import { useAlert } from "../../hooks/useAlert";
import { Button } from "../Button";
import Background from "../../../assets/vector/background_one.png";
import PlusSvg from "../../../assets/vector/plus.svg";
import CopySvg from "../../../assets/vector/copy.svg";
import DeleteSvg from "../../../assets/vector/delete.svg";
import AnimatedLottieView from "lottie-react-native";
import Icon from "react-native-vector-icons/AntDesign";

const ContactList = ({ route }: any) => {
  const { toast } = useAlert();
  const navigation: any = useNavigation();
  const buttonVariants = {
    four: ["#ff6f2b", "#d83d3d", "#ce2b4f"],
  };
  const { wallet, networkProvider, balance, balanceInUsd } = useSelector(
    (state: RootState) => state.coreReducer
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [list, setList] = useState([]);
  const { setLoading } = useContext(LoadingIndicatorContext);
  const [amount, setAmount] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [address, setAddress] = useState("");

  const [addressType, setAddressType] = useState<
    "eth_address" | "ensDomain" | "bnsDomain"
  >("eth_address");

  const modalHandle = (open: boolean) => {
    setModalVisible(open);
  };

  const removeContacts = async (deleteAddress: string) => {
    // let deleteAddress = "0x3dc7fc39CC5Ee01253F709A5d5Cff98aA69Ee367";
    let key = `${await Auth.getLoginId()}_${await Auth.getLoginType()}`;
    let existingData = await contactManager.get(key);
    console.log(existingData);
    if (existingData) {
      console.log("in if condition", existingData);
      let index = existingData.findIndex(
        (ele) => ele.address.toLowerCase() === deleteAddress.toLowerCase()
      );
      existingData.splice(index, 1);
      // existingData = JSON.stringify(existingData);
      console.log("final existingData is", existingData);
      await contactManager.set(key, existingData);
      getContacts();
      setDeleteModal(false);
      return;
    }
    setDeleteModal(false);
    return;
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
  const getContacts = async () => {
    const data = await contactManager.get(
      `${await Auth.getLoginId()}_${await Auth.getLoginType()}`
    );
    data && setList(data);
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
              uri="https://walletqa.guardiannft.org/back.svg"
            />
          </TouchableOpacity>
          <Text
            variant="medium"
            style={{ color: "#fff", fontSize: 16, marginLeft: 20 }}
          >
            Contacts
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

      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 60,
          right: 25,
          zIndex: 1,
          alignItems: "center",
        }}
        onPress={() => modalHandle(true)}
      >
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={buttonVariants["four"]}
          style={styles.addContact}
        >
          <View>
            <SvgXml xml={PlusSvg} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
      <ScrollView>
        <View>
          {list.length > 0 ? (
            list.map((ele, i) => (
              <TouchableOpacity
                key={ele.address}
                onPress={() => {
                  navigation.navigate("Transfer", {
                    address: ele?.address,
                    name: ele?.name,
                  });
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
                          ? ele.name
                          : ele.name.substr(0, 20) + "..."}
                      </Text>
                      <Text
                        numberOfLine={1}
                        variant={"regular"}
                        fontSize={10}
                        textAlign="center"
                        opacity={0.7}
                        style={{ marginTop: 5 }}
                      >
                        {/* {ele.address} */}
                        {Wallet.displayAddressWithEllipsis(ele.address, 12)}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row" }}>
                    <TouchableOpacity
                      key={ele.address}
                      onPress={() => {
                        navigation.navigate("ChatScreen", {
                          to: ele.address,
                          name: ele.name,
                        });
                      }}
                      style={styles.cardbgnew}
                    >
                      <Icon name="message1" size={14} color="#fff" />
                    </TouchableOpacity>
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
                    <TouchableOpacity
                      onPress={() => {
                        setDeleteModal(true);
                        setAddress(ele.address);
                      }}
                      style={styles.cardbgnew}
                    >
                      <SvgXml
                        width={13}
                        height={13}
                        xml={DeleteSvg}
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
      <Modal animationType="slide" transparent={true} visible={deleteModal}>
        <ImageBackground source={Background} style={styles.layout}>
          <View style={styles.newView}>
            <View style={styles.modalView}>
              <View>
                <AnimatedLottieView
                  style={styles.lottie}
                  source={require("../../../assets/lottie/delete.json")}
                  autoPlay
                  loop
                />
              </View>
              <Text style={styles.modalText}>
                Do you really want to delete this contact?
              </Text>
              <View style={{ flexDirection: "row" }}>
                <Button
                  title="No"
                  variant="cancel"
                  expanded
                  onPress={() => setDeleteModal(false)}
                />
                <Button
                  title="Yes"
                  variant="two"
                  expanded
                  onPress={() => {
                    removeContacts(address);
                  }}
                />
              </View>
            </View>
          </View>
        </ImageBackground>
      </Modal>
      <ModalView
        modalVisible={modalVisible}
        modalHandle={modalHandle}
        onSuccess={() => getContacts()}
      />
    </View>
  );
};
export default ContactList;
const styles = StyleSheet.create({
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
