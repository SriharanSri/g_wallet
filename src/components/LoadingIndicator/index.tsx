import React, { ActivityIndicator, StyleSheet, View } from "react-native";
import { globalStyles } from "../../styles/global.style";
import { Text } from "../Text";
import AnimatedLottieView from "lottie-react-native";
import Loader from "../../../assets/lottie/loader.json";

export const LoadingIndicator = () => {
  return (
    <View style={[globalStyles.screen, styles.loadingScreen]}>
      {/* <ActivityIndicator size={"large"} color="#fff" />
      <Text style={{ color: "#fff", marginTop: 20, fontSize: 20 }}>
        Loading...
      </Text> */}

      <AnimatedLottieView
        style={{ height: 70, width: 70 }}
        source={require("./load.json")}
        autoPlay={true}
        loop={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    position: "absolute",
    flex: 1,
    backgroundColor: "#00000090",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  lottie: {
    width: 50,
    alignSelf: "center",
    height: 50,
  },
});
