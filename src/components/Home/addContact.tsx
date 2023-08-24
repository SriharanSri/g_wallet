import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { SvgUri, SvgXml } from "react-native-svg";
import ModalView from "../AddContactModal";
import { contactManager } from "../../lib/wallet-sdk/storage/contact-manager";
import { useSelector } from "react-redux";
import { RootState } from "../../lib/wallet-sdk/store";
import { NewContactType } from "../../lib/wallet-sdk/types/contact-type";
import { Auth } from "../../lib/wallet-sdk/Auth";
import { textVariants, Text } from "../Text";
import { useNavigation } from "@react-navigation/native";
import PlusSvg from "../../../assets/vector/plus.svg";

const AddContact = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [show, setShow] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [address, setAddress] = useState<string>("");
  const navigation: any = useNavigation();

  const modalHandle = (open: boolean) => {
    setModalVisible(open);
  };

  const [newContact, setNewContact] = useState([]);
  const { wallet } = useSelector((state: RootState) => state.coreReducer);

  useEffect(() => {
    getAddresses();
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const getAddresses = async () => {
    const addressesString = await contactManager.get(
      `${await Auth.getLoginId()}_${await Auth.getLoginType()}`
    );
    setNewContact(addressesString);
    // const addressesString = localStorage.getItem(`ADDRESSBOOK-${keyInfra.uKey}`)
    // const data: AddressBookType[] = JSON.parse(addressesString || "[]")
    // return data.reverse()
  };

  return (
    <View style={styles.contact}>
      <View
        style={[
          styles.cardhearder,
          { justifyContent: "space-between", marginBottom: 10 },
        ]}
      >
        <Text variant="regular" style={{ opacity: 1 }}>
          Contacts
        </Text>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("ContactList");
          }}
        >
          <Text variant="light" fontSize={12} opacity={1}>
            See all
          </Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            height: expanded ? "auto" : 72,
            overflow: "hidden",
          }}
        >
          <View style={{ width: 70, marginBottom: 10, alignItems: "center" }}>
            <TouchableOpacity onPress={() => modalHandle(true)}>
              <View style={styles.addContact}>
                <SvgXml xml={PlusSvg} />
              </View>
            </TouchableOpacity>
            <Text
              numberOfLine={1}
              fontSize={10}
              style={{ width: "100%" }}
              textAlign="center"
              opacity={0.8}
            >
              Add New
            </Text>
          </View>
          {newContact &&
            newContact.map((contact) => (
              <TouchableOpacity
                key={contact.name}
                onPress={() => {
                  navigation.navigate("Transfer", {
                    address: contact?.address,
                    name: contact?.name,
                  });
                }}
              >
                <View
                  style={{ width: 70, marginBottom: 10, alignItems: "center" }}
                >
                  <View style={styles.addContact}>
                    <Text>
                      {contact.name[0].toUpperCase()}
                      {contact.name[1].toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    numberOfLine={1}
                    fontSize={10}
                    style={{ width: "100%" }}
                    textAlign="center"
                  >
                    {contact.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          {/* <Text
            style={{ fontFamily: textVariants["regular"] }}
            onPress={() => {
              navigation.navigate("ContactList");
            }}
          >
            Show more...
          </Text> */}
        </View>
        {/* <FlatList
          
          data={newContact}
          renderItem={({ item }) => {
            return (
              <>
                <View style={styles.addContact}>
                  <Text>
                    {item.name[0].toUpperCase()}{item.name[1].toUpperCase()}
                  </Text>
                </View>
                <Text>
                  {item.name}
                </Text>
              </>
            );
          }}
        /> */}
        {/* <View style={styles.col4}>
          <TouchableOpacity
            style={[styles.addContact]}
            onPress={() => modalHandle(true)}
          >
           
          </TouchableOpacity>

          <ModalView modalVisible={modalVisible} modalHandle={modalHandle} onSuccess={() => getAddresses()} />
          <Text variant="medium" fontSize={12}>Add New</Text>
        </View> */}
        <ModalView
          modalVisible={modalVisible}
          modalHandle={modalHandle}
          onSuccess={() => getAddresses()}
        />
      </View>
    </View>
  );
};

export default AddContact;

const styles = StyleSheet.create({
  contact: {
    backgroundColor: "#eaeaea26",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 27,
    marginVertical: 20,
    marginHorizontal: 10,
  },
  addContact: {
    backgroundColor: "#6b5969",
    width: 45,
    height: 45,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  cardhearder: {
    flexDirection: "row",
    alignItems: "center",
  },
  col4: {
    maxWidth: "25%",
    maxHeight: 80,
    alignItems: "center",
    marginHorizontal: 8,
    marginVertical: 6,
  },
});
