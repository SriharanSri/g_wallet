/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */
import "../shim";

import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { createContext, useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";

import { Colors } from "react-native/Libraries/NewAppScreen";
import { Provider, useSelector } from "react-redux";
import HomeHeader from "./components/Home/homeHeader";
import { ROUTES } from "./routes";
import { HomeScreen } from "./screens/home";
import { CreateWallet } from "./screens/importWallet/createWallet";
import { OtpScreen } from "./screens/otp";
import Settings from "./screens/settings";
import { SigninScreen } from "./screens/signin";
import { EmailScreen } from "./screens/signin/EmailScreen";
import { MobileScreen } from "./screens/signin/MobileScreen";
import { encode, decode } from "base-64";
import { WalletConnectScreen } from "./screens/WalletConnect";
import { createModalStack, ModalProvider } from "react-native-modalfy";
import { RequestAccountModal } from "./components/RequestAccountModal";
// import { RequestAccountModalUI } from './components/RequestAccountModal';
import { SignMessageModal } from "./components/SignMessageModal";
// import { SignMessageModal } from './components/SignMessageModal';
import { SendTransactionModal } from "./components/SendTransactionModal";
import Toast from "react-native-toast-message";
import { WalletConnectSesssion } from "./screens/WalletConnect/sessions";
import { LoadingIndicator } from "./components/LoadingIndicator";
import { ScreenWrapper } from "./components/ScreenWrapper";
import ConfirmTransaction from "./components/ConfirmTransaction";
import Recovery from "./screens/recovery";
import { ImportWallet } from "./screens/importWallet/importWallet";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Scanner from "./components/Scanner";
import Transfer from "./components/Transfer";
import ContactList from "./components/AddContactModal/ContactList";
import { NetworkSwitchModal } from "./components/NetworkSwitchModal";
import ChatContactList from "./components/Chat/chatContactList";
import ChatScreen from "./components/Chat/chatScreen";
import { BackupRecoveryKeyshareScreen } from "./screens/BackupRecoveryKeyshare";
import { store } from "./lib/wallet-sdk/store";
import GetFront from "./components/Settings/getFront";
import GetFrontProfile from "./components/GetFrontProfile";

const modalConfig = {
  RequestAccountModal,
  SignMessageModal,
  SendTransactionModal,
  NetworkSwitchModal,
};
const defaultOptions = { backdropOpacity: 0.6 };

const Stack = createStackNavigator();
const stack = createModalStack(modalConfig, defaultOptions);
export const LoadingIndicatorContext = createContext({
  loading: false,
  setLoading: null,
});
const STATUSBAR_HEIGHT = StatusBar.currentHeight;
const APPBAR_HEIGHT = Platform.OS === "ios" ? 44 : 56;
// AsyncStorage.clear()
// AsyncStorage.removeItem("WALLET_CONNECT_SESSION");
const MyStatusBar = ({ backgroundColor, ...props }) => (
  <View style={[styles.statusBar, { backgroundColor }]}>
    <SafeAreaView>
      <StatusBar translucent backgroundColor={backgroundColor} {...props} />
    </SafeAreaView>
  </View>
);
const App = () => {
  const [loading, setLoading] = useState(false);
  // AsyncStorage.clear();
  const isDarkMode = useColorScheme() === "dark";

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  if (!global.btoa) {
    global.btoa = encode;
  }

  if (!global.atob) {
    global.atob = decode;
  }

  if (!global.window) {
    global.window = global;
  }

  return (
    <>
      <SafeAreaProvider>
        <MyStatusBar backgroundColor="#1b0719" barStyle="light-content" />
        <SafeAreaView style={backgroundStyle}>
          <LoadingIndicatorContext.Provider value={{ loading, setLoading }}>
            {loading && <LoadingIndicator />}
            {/* <StatusBar barStyle={"light-content"} backgroundColor={"#1b0719"} /> */}

            <View style={styles.page}>
              <Provider store={store}>
                <ModalProvider stack={stack}>
                  <NavigationContainer theme={DarkTheme}>
                    <ScreenWrapper>
                      <Stack.Navigator
                        initialRouteName="Signin"
                        screenOptions={{ headerShown: false }}
                      >
                        <Stack.Screen name="Home" component={HomeScreen} />
                        <Stack.Screen
                          name="BackupRecoveryKeyshare"
                          component={BackupRecoveryKeyshareScreen}
                        />
                        <Stack.Screen name="Signin" component={SigninScreen} />
                        <Stack.Screen name="Recovery" component={Recovery} />
                        <Stack.Screen name="Scanner" component={Scanner} />
                        <Stack.Screen name="GetFront" component={GetFront} />
                        <Stack.Screen
                          name="GetFrontProfile"
                          component={GetFrontProfile}
                        />
                        <Stack.Screen
                          name="CreateWallet"
                          component={CreateWallet}
                        />
                        <Stack.Screen name="Settings" component={Settings} />
                        <Stack.Screen
                          name="RequestAccountModal"
                          component={RequestAccountModal}
                        />
                        <Stack.Screen
                          name="HomeHeader"
                          component={HomeHeader}
                        />
                        <Stack.Screen
                          name="WalletConnect"
                          component={WalletConnectScreen}
                        />
                        <Stack.Screen
                          name={ROUTES.WALLETCONNECT_SESSION}
                          component={WalletConnectSesssion}
                        />

                        <Stack.Screen
                          name={ROUTES.MOBILE_LOGIN_SCREEN}
                          component={MobileScreen}
                        />
                        <Stack.Screen
                          name={ROUTES.EMAIL_LOGIN_SCREEN}
                          component={EmailScreen}
                        />
                        <Stack.Screen
                          name={ROUTES.OTP_SCREEN}
                          component={OtpScreen}
                        />
                        <Stack.Screen
                          name="Confirmations"
                          component={ConfirmTransaction}
                        />
                        <Stack.Screen
                          name="ImportWallet"
                          component={ImportWallet}
                        />
                        <Stack.Screen name="Transfer" component={Transfer} />
                        <Stack.Screen
                          name="ContactList"
                          component={ContactList}
                        />
                        <Stack.Screen
                          name="Message"
                          component={ChatContactList}
                        />
                        <Stack.Screen
                          name="ChatScreen"
                          component={ChatScreen}
                        />
                      </Stack.Navigator>
                    </ScreenWrapper>
                  </NavigationContainer>
                </ModalProvider>
              </Provider>
            </View>
            <Toast />
          </LoadingIndicatorContext.Provider>
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
};

const styles = StyleSheet.create({
  statusBar: {
    height: STATUSBAR_HEIGHT,
  },
  appBar: {
    backgroundColor: "#1b0719",
    height: APPBAR_HEIGHT,
  },
  page: {
    height: Dimensions.get("window").height,
    width: Dimensions.get("window").width,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "400",
  },
  highlight: {
    fontWeight: "700",
  },
});

export default App;
