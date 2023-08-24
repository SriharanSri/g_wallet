import AnimatedLottieView from "lottie-react-native";
import React, { useContext, useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import { SvgUri } from "react-native-svg";
import { AuthHeader } from "../../components/AuthHeader";
import { Spacer } from "../../components/Spacer";
import { GOOGLE_SIGNIN } from "@env";
import * as Keychain from "react-native-keychain";
import Warning from "../../../assets/vector/warning-pop.png";
import Background from "../../../assets/vector/background_one.png";
import { globalStyles } from "../../styles/global.style";
import { useModal } from "react-native-modalfy";
import Toast from "react-native-toast-message";
import { Auth } from "../../lib/wallet-sdk/Auth";
import { Text } from "../../components/Text";
import { useAlert } from "../../hooks/useAlert";
import { LoadingIndicatorContext } from "../../App";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../lib/wallet-sdk/store";
import { userAuthenticated } from "../../lib/wallet-sdk/authSlice";
import SecureStorage from "react-native-encrypted-storage";
import storage from "../../lib/wallet-sdk/storage/storage";
import { setTokens, updateKeyInfra } from "../../lib/wallet-sdk/coreSlice";
import ReleaseVersion from "../../components/ReleaseVersion";
import { usePrepareWallet } from "../../hooks/usePrepareWallet";
import { Button } from "../../components/Button";

export const SigninScreen = ({ navigation }: any) => {
  const { checkMetadataAndNavigate } = usePrepareWallet();
  const [isDisclaimerAccepted, setIsDisclaimerAccepted] =
    useState<boolean>(true);
  const { loading, setLoading } = useContext(LoadingIndicatorContext);
  const dispatch = useDispatch();
  const modal = useModal();
  const { toast } = useAlert();
  const { auth, authenticated } = useSelector(
    (state: RootState) => state.authReducer
  );
  const { keyInfra } = useSelector((state: RootState) => state.coreReducer);
  const points = [
    "Do not close the wallet while transaction is being processed",
    "Do not clear the data/cache of your wallet",
  ];
  useEffect(() => {
    checkDisclaimerStatus();
  }, []);
  const checkDisclaimerStatus = async () => {
    const status = await Auth.isDisclaimerAccepted();
    console.log("status is", status);
    setIsDisclaimerAccepted(status);
  };
  const setDisclaimerAccepted = () => {
    Auth.setDisclaimerStatus(true);
    setIsDisclaimerAccepted(true);
  };
  function goto(route: "email" | "mobile") {
    navigation.navigate(`${route}_login_screen`);
  }
  const googleLogin = async () => {
    Linking.addEventListener("url", async (event) => {
      if (event.url) {
        setLoading(true);
        let value = event?.url?.replace("guardianwallet:", "");
        // const stringToArr = async () => {
        let arr = value.split(",").map((x) => x.trim());
        let [authToken, loginType, loginId] = arr;
        // return obj;

        let validated = await auth.verifyLogin(
          loginType,
          loginId,
          authToken,
          true
        );

        if (!validated.status) {
          return;
        }
        let hashified = keyInfra.hashify(validated?.data.ukey).toString();
        await SecureStorage.setItem("ukey", hashified);
        keyInfra.setUkey(hashified);
        await auth.setToken(authToken);
        await auth.setLoginDetails({
          login_id: loginId,
          login_type: Auth.LoginType.GOOGLE,
        });
        await auth.saveUserRecords({
          loginId: loginId,
          loginType: Auth.LoginType.OTP,
          displayName: loginId,
          metadata: {},
        });
        dispatch(updateKeyInfra(hashified));

        dispatch(
          userAuthenticated({
            displayName: await Auth.getDisplayUserName(),
            uKey: hashified,
            mailName: loginId,
            metadata: validated.data.metadata,
          })
        );

        await auth.saveUserRecords({
          displayName: await Auth.getDisplayUserName(),
          loginId: await Auth.getLoginId(),
          loginType: await Auth.getLoginType(),
          metadata: validated.data.metadata,
        });

        toast({
          position: "bottom",
          type: "success",
          title: "Login Success",
        });
        setLoading(false);
        checkMetadataAndNavigate();
      } else {
        toast({
          position: "bottom",
          type: "error",
          title: "Unable to verify email.",
        });
        setLoading(false);
      }

      Linking.removeAllListeners("url");
      // toast({ title: decodeURI(event.url.replace("guardianwallet:", "")) });
    });
    Linking.openURL(GOOGLE_SIGNIN);
  };
  return (
    <ScrollView style={globalStyles.screen}>
      <AuthHeader />
      <AnimatedLottieView
        style={componentStyle.lottie}
        source={require("./login.json")}
        autoPlay
        loop
      />
      <Spacer height={20} />
      <Text
        style={[
          componentStyle.greet,
          { fontFamily: "HelveticaNeueLTPro-MdEx" },
        ]}
      >
        hello,
      </Text>
      <Text
        style={[
          componentStyle.greet,
          { fontFamily: "HelveticaNeueLTPro-HvEx" },
        ]}
        onPress={() => {
          // GoogleSignin.signOut();
        }}
      >
        Ready to explore the crypto world
      </Text>
      <Modal
        animationType="slide"
        transparent={true}
        visible={!isDisclaimerAccepted}
      >
        <ImageBackground
          source={Background}
          // resizeMode="cover"
          style={componentStyle.layout}
        >
          {/* <Disclaimer onClose={setDisclaimerAccepted} /> */}
          <View style={componentStyle.centeredView}>
            <View style={componentStyle.modalView}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginVertical: 15,
                  paddingHorizontal: 20,
                }}
              >
                <AnimatedLottieView
                  style={{
                    width: 40,
                    height: 40,
                  }}
                  source={require("./Warning.json")}
                  autoPlay
                  loop
                />
                <Text
                  style={{
                    color: "#D37624",
                    fontSize: 16,
                    lineHeight: 20,
                    marginLeft: 5,
                    // ...componentStyle.modalText,
                  }}
                >
                  Before takeoff, a few important notes!
                </Text>
              </View>

              <View
                style={{
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  paddingHorizontal: 25,
                  paddingVertical: 6,
                }}
              >
                <Text
                  variant="medium"
                  fontSize={13}
                  style={{
                    textAlign: "left",
                    color: "white",
                    marginBottom: 15,
                  }}
                >
                  While using Guardian Wallet Alpha:
                </Text>
                {points &&
                  points.map((ele, i) => {
                    return (
                      <Text
                        variant="regular"
                        fontSize={13}
                        key={i}
                        style={{
                          color: "#BEC0C4",
                          marginBottom: 10,
                          lineHeight: 20,
                        }}
                      >
                        {"\u2B24" + " "}
                        {ele}
                      </Text>
                    );
                  })}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  paddingVertical: 6,
                  // width: 220,
                  // height: 150,
                }}
              >
                <Button
                  styles={{ marginHorizontal: 60 }}
                  title="Close"
                  variant="two"
                  expanded
                  onPress={() => setDisclaimerAccepted()}
                />
              </View>
            </View>
          </View>
        </ImageBackground>
      </Modal>
      <Spacer height={40} />
      <View style={{ marginHorizontal: 10 }}>
        {Platform.OS === "ios" ? (
          <View>
            <Button
              title="Email"
              variant="one"
              onPress={() => goto("email")}
              expanded
            />
          </View>
        ) : (
          <View style={componentStyle.buttonGroup}>
            <Button
              title="Email"
              variant="one"
              onPress={() => goto("email")}
              expanded
            />
            <Button
              title="Google"
              variant="two"
              expanded
              // disabled={true}
              // styles={{ opacity: 0.2 }}
              onPress={() => googleLogin()}
            />
          </View>
        )}

        <View style={componentStyle.mobileButtonContaienr}>
          <Button
            title="Mobile"
            variant="three"
            onPress={() => goto("mobile")}
            expanded
          />
        </View>
      </View>
      <Text
        onPress={() => {
          // modal.openModal("RequestAccountModalUI");
          Linking.openURL(
            "https://docs-wallet-guardianlink.gitbook.io/guardian-wallet/"
          );
        }}
        // onPress={() => {
        //   checkUserStatus();
        // }}
        style={componentStyle.wallet}
      >
        What is Guardian Wallet?
      </Text>
      <ReleaseVersion />
    </ScrollView>
  );
};

const componentStyle = StyleSheet.create({
  container: {
    paddingTop: 30,
    paddingHorizontal: 16,
  },
  lottie: {
    width: 400,
    alignSelf: "center",
    // heigh: 300
  },
  greet: {
    color: "white",
    fontSize: 25,
    marginTop: 10,
    lineHeight: 26,
    textAlign: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    // alignItems: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: "#eaeaea12",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    // elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    marginTop: 10,
  },
  wallet: {
    fontFamily: "HelveticaNeueLTPro-HvEx",
    color: "#d6402c",
    fontSize: 15,
    textDecorationLine: "underline",
    marginTop: 10,
    lineHeight: 26,
    textAlign: "center",
  },
  version: {
    fontFamily: "HelveticaNeueLTPro-Ex",
    color: "#808080",
    fontSize: 15,
    marginTop: 10,
    lineHeight: 26,
    textAlign: "center",
  },
  buttonGroup: {
    flexDirection: "row",
  },
  mobileButtonContaienr: {
    flexDirection: "row",
    marginTop: 15,
  },
  spacer: {
    flex: 1,
  },
  button: {
    flex: 1,
    borderRadius: 50,
    paddingVertical: 12,
    marginHorizontal: 10,
    textTransform: "lowercase",
  },
  textWhite: {
    color: "white",
    textAlign: "center",
    fontFamily: "HelveticaNeueLTPro-Ex",
  },
  logo: {
    marginTop: 30,
    marginBottom: 20,
    alignSelf: "center",
  },
  layout: {
    height: "100%",
    flex: 1,
    justifyContent: "center",
  },
});
