import {
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from "react-native";
import React, { useState } from "react";
import Icon from "react-native-vector-icons/AntDesign";
import HomeHeader from "../Home/homeHeader";
import LinearGradient from "react-native-linear-gradient";
import { SelectList } from "react-native-dropdown-select-list";
import { Spacer } from "../Spacer";

const TransferModal = ({ modalVisible, modalHandle }: any) => {
  const buttonVariants = {
    four: ["#1e15f3", "#bd2b65db", "#ff6f2b", "#d83d3d", "#ce2b4f"],
  };
  const [selected, setSelected] = React.useState("");
  const data = [{ key: "1", value: "Ethereum (ETH)" }];
  return (
    <View>
      <Modal animationType="slide" transparent={false} visible={modalVisible}>
        <View style={styles.centeredView}>
          <HomeHeader />
          <LinearGradient
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            colors={buttonVariants["four"]}
            style={styles.card}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => {
                  modalHandle(false);
                }}
              >
                <Icon name="close" size={20} color="#fff" />
              </TouchableOpacity>

              <Text
                style={{
                  color: "#fff",
                  textAlign: "center",
                  fontSize: 18,
                  marginLeft: "22%",
                }}
              >
                Transfer Details
              </Text>
            </View>
            <Spacer height={20} />
            <SelectList
              setSelected={(val) => setSelected(val)}
              data={data}
              save="value"
              search={false}
              placeholder={"Ethereum (ETH)"}
              boxStyles={{
                backgroundColor: "#eaeaea63",
                borderColor: "#eaeaea63",
                borderRadius: 20,
              }}
              dropdownTextStyles={{ color: "#fff" }}
              dropdownItemStyles={
                {
                  // backgroundColor: "#7f848b7d",
                  // borderRadius: 20,
                }
              }
              dropdownStyles={{
                backgroundColor: "#7f848b7d",
                borderRadius: 30,
              }}
            />
            <Spacer />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TextInput
                placeholder="Enter amount in"
                placeholderTextColor={"#fff"}
                style={styles.input}
              />
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "bold" }}>
                GoerliETH
              </Text>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};
export default TransferModal;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    backgroundColor: "#1b0719",
  },
  card: {
    // height: 223,
    // borderRadius: 37,
    marginVertical: 20,
    padding: 20,
    marginHorizontal: 10,
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
  input: {
    // height: 30,
    backgroundColor: "#eaeaea63",
    width: "50%",
    borderRadius: 30,
    // letterSpacing: 1,
    marginHorizontal: 5,
  },
});
