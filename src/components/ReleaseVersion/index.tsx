import { StyleSheet, Text, View } from "react-native";
import React from "react";

const ReleaseVersion = () => {
  return (
    <View>
      <Text style={styles.version}>Version: alpha-v0.0.1</Text>
    </View>
  );
};

export default ReleaseVersion;

const styles = StyleSheet.create({
  version: {
    fontFamily: "HelveticaNeueLTPro-Ex",
    color: "#808080",
    fontSize: 13,
    marginTop: 10,
    lineHeight: 26,
    textAlign: "center",
  },
});
