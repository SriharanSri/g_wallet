import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image as RNImage,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Pressable,
  RefreshControl,
  Linking,
  SafeAreaView,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
// import { updateName } from "../../lib/wallet-sdk/authSlice";
import { SvgUri, SvgXml } from "react-native-svg";
import { globalStyles } from "../../styles/global.style";
import HomeHeader from "../../components/Home/homeHeader";
import BalanceCard from "../../components/Home/balanceCard";
import AddContact from "../../components/Home/addContact";
import TabNavigation from "../../components/TabNavigation";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import * as Keychain from "react-native-keychain";
import { RootState } from "../../lib/wallet-sdk/store";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "../../components/RequestAccountModal";
import { WalletConnect } from "../../lib/WalletConnect";
import { useModal } from "react-native-modalfy";
import { addSession } from "../../lib/wallet-sdk/walletConnectSlice";
import { useWalletConnect } from "../../hooks/useWalletConnect";
import ReleaseVersion from "../../components/ReleaseVersion";
import AnimatedLottieView from "lottie-react-native";
import { CHAT_ENABLED } from "@env";
import LinearGradient from "react-native-linear-gradient";

// import { ScrollView } from "react-native-gesture-handler";

export const HomeScreen = ({ navigation, route }: any) => {
  const [refreshing, setRefreshing] = useState(false);
  const buttonVariants = {
    four: ["#ff6f2b", "#d83d3d", "#ce2b4f"],
  };
  return (
    <View style={globalStyles.screen}>
      {CHAT_ENABLED === "true" && (
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: Platform.OS === "ios" ? 70 : 30,
            right: 15,
            zIndex: 1,
          }}
          onPress={() => navigation.navigate("Message")}
        >
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            colors={buttonVariants["four"]}
            style={styles.addContact}
          >
            <View>
              <AnimatedLottieView
                style={styles.lottie}
                source={require("../../../assets/lottie/chat.json")}
                autoPlay
                loop
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}
      <SafeAreaView>
        <HomeHeader />
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
              }}
              tintColor={"#fff"}
            />
          }
        >
          <BalanceCard />
          <AddContact />
          <TabNavigation
            refreshing={refreshing}
            setRefreshing={setRefreshing}
            data={route.params}
          />
          <ReleaseVersion />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
const styles = StyleSheet.create({
  addContact: {
    // backgroundColor: "#6b5969",
    width: 50,
    height: 50,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
    opacity: 0.95,
  },
  lottie: {
    width: 35,
    alignSelf: "center",
    alignItems: "center",
    // heigh: 35,
  },
});
