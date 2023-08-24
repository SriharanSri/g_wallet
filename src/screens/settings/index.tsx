import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Image as RNImage,
  Image,
} from "react-native";
import React, { useState } from "react";
import { globalStyles } from "../../styles/global.style";
import { SvgUri } from "react-native-svg";
import { Text, textVariants } from "../../components/Text";
import AccountSettings from "../../components/Settings/accountSettings";
import NetworkSettings from "../../components/Settings/networkSettings";
import PrivateKey from "../../components/Settings/privateKey";
import ReleaseVersion from "../../components/ReleaseVersion";

const Settings = ({ navigation }: any) => {
  const handleBack = () => {
    navigation.goBack();
  };
  return (
    <ScrollView style={globalStyles.screen}>
      <View style={componentStyle.wpad}>
        <View style={componentStyle.header}>
          <TouchableOpacity onPress={handleBack} style={{ width: 30 }}>
            <SvgUri
              width={20}
              height={20}
              uri="https://walletalpha.guardianlink.io/back.svg"
            />
          </TouchableOpacity>
          <Text
            variant={"bold"}
            style={{ color: "#fff", fontSize: 22, marginLeft: 20 }}
          >
            Settings
          </Text>
        </View>
        <AccountSettings />
        {/* <NetworkSettings /> */}
        <PrivateKey />
      </View>
    </ScrollView>
  );
};

export default Settings;

const componentStyle = StyleSheet.create({
  wpad: {
    marginHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 30,
    marginHorizontal: 10,
  },
});
