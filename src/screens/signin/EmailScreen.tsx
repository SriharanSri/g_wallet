import React, { useContext, useState } from "react";
import {
  StyleSheet,
  View,
  Text as ErrText,
  ImageBackground,
  Keyboard,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import { AuthHeader } from "../../components/AuthHeader";
import bgBlur from "../../../assets/image/bgBlur.png";
import { Spacer } from "../../components/Spacer";
import { Text, textVariants } from "../../components/Text";
import { TextInput } from "../../components/TextInput";
import { globalStyles } from "../../styles/global.style";
import { EmailVerificationStatus } from "./types";
import AnimatedLottieView from "lottie-react-native";
import { RootState } from "../../lib/wallet-sdk/store";
import { useDispatch, useSelector } from "react-redux";
import { Auth } from "../../lib/wallet-sdk/Auth";
import { userAuthenticated } from "../../lib/wallet-sdk/authSlice";
import SecureStorage from "react-native-encrypted-storage";
import storage from "../../lib/wallet-sdk/storage/storage";
import { LoadingIndicatorContext } from "../../App";
import { useAlert } from "../../hooks/useAlert";
import { usePrepareWallet } from "../../hooks/usePrepareWallet";
import { Button } from "../../components/Button";

const FIVE_MINUTES_IN_MILLISECONDS = 300000;

export const EmailScreen = ({ navigation }: any) => {
  const { checkMetadataAndNavigate } = usePrepareWallet();
  const { toast } = useAlert();
  const [email, setEmail] = useState("");
  const [emailValidError, setEmailValidError] = useState("");
  const [isDisabled, setIsDisabled] = useState(true);
  const [isMailSent, setIsMailSent] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { auth, authenticated } = useSelector(
    (state: RootState) => state.authReducer
  );
  const { keyInfra } = useSelector((state: RootState) => state.coreReducer);
  const { loading, setLoading } = useContext(LoadingIndicatorContext);
  const dispatch = useDispatch();
  const buttonVariants = {
    // three: ["#df8128", "#d63e43", "#cc2751"],
    three: ["#cc2751", "#df8128"],
    four: ["#ce2b4f", "#5d14a6"],
  };
  let emailVerificationTimer: NodeJS.Timer | null;
  const handleValidEmail = (val: string) => {
    let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;

    if (val.length === 0) {
      setEmailValidError("Please enter a mail");
      setIsDisabled(true);
    } else if (reg.test(val) === false) {
      setIsDisabled(true);
      setEmailValidError("enter valid email address");
    } else if (reg.test(val) === true) {
      setEmailValidError("");
      setIsDisabled(false);
    }
  };
  const waitAndVerify = (): Promise<EmailVerificationStatus> => {
    return new Promise((resolve, reject) => {
      emailVerificationTimer = setInterval(async () => {
        const response = (await auth.verifyLogin(
          Auth.LoginType.EMAIL,
          email,
          await auth.getToken(),
          true,
          "auth"
        )) as EmailVerificationStatus;
        if (response.status) {
          resolve(response);
          clearInterval(emailVerificationTimer!);
        }
      }, 3000);
      setTimeout(() => {
        reject("Authentication timeout. Try login again.");
        clearInterval(emailVerificationTimer!);
        setIsMailSent(false);
        setLoading(false);
      }, FIVE_MINUTES_IN_MILLISECONDS);
    });
  };

  const sendVerificationMail = async () => {
    try {
      setLoading(true);
      let response = await auth.emailLogin(email, Auth.LoginType.EMAIL);
      if (response.status === true) {
        setIsMailSent(true);
        modalHandle(true);
        setLoading(false);
        toast({
          position: "bottom",
          type: "success",
          title: "Mail verification sent ",
        });

        // Toast.showWithGravity(
        //   "Mail verification sent ",
        //   Toast.SHORT,
        //   Toast.BOTTOM
        // );
      }
    } catch (e: any) {
      toast({
        position: "bottom",
        type: "error",
        title: "Unable to send verification mail. Try login again.",
      });
      setLoading(false);
      // Toast.showWithGravity(
      //   "Unable to send verification mail. Try login again.",
      //   Toast.SHORT,
      //   Toast.BOTTOM
      // );
    }
  };
  const handleEmailLogin = async () => {
    try {
      await sendVerificationMail();
      const token = await auth.getToken();
      if (!token) {
        toast({
          position: "bottom",
          type: "error",
          title: "Unable to send verification mail. Try login again.",
        });
        setLoading(false);
        console.log("Error is send verificaiton mail  ===> ", token);
        console.error("Unable to send email");
        return;
      }
      const validated = await waitAndVerify();
      if (validated?.status) {
        setLoading(true);
        let hashified = keyInfra.hashify(validated?.data.ukey).toString();
        await SecureStorage.setItem("ukey", hashified);
        keyInfra.setUkey(hashified);
        await storage.setItem("authToken", validated?.token);

        dispatch(
          userAuthenticated({
            displayName: await Auth.getDisplayUserName(),
            uKey: hashified,
            mailName: email,
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
          title: "Mail Verified",
        });
        setLoading(false);
        checkMetadataAndNavigate();
        setIsMailSent(false);
      } else {
        toast({
          position: "bottom",
          type: "error",
          title: "Unable to verify email.",
        });
        setLoading(false);
      }

      // Toast.showWithGravity("Mail Verified", Toast.SHORT, Toast.BOTTOM);
    } catch (error: any) {
      console.log(error, "err");
    }
  };

  // const handleEmailLogin = async () => {
  //   try {
  //     await sendVerificationMail();
  //     const token = await auth.getToken();
  //     if (!token) {
  //       Toast.show({
  //         position: "bottom",
  //         type: "error",
  //         text1: "Unable to send verification mail. Try login again.",
  //       });
  //       console.error("Unable to send email");
  //       return;
  //     }
  //     const validated = await waitAndVerify();
  //     if (validated?.status === true) {
  //       const username = "keyData";
  //       const password = validated?.token;

  //       let hashified = keyInfra.hashify(validated?.data.ukey).toString();
  //       await SecureStorage.setItem("ukey", hashified);
  //       keyInfra.setUkey(hashified);
  //       dispatch(updateKeyInfra(hashified));
  //       await Keychain.setGenericPassword(username, password)
  //         .then((result) => {
  //           setIsMailSent(false);

  //           dispatch(
  //             userAuthenticated({
  //               displayName: email,
  //               uKey: password,
  //             })
  //           );
  //           navigation.navigate("CreateWallet");
  //         })
  //         .catch((error) => {
  //           console.error("Error storing in key store", error);
  //         });
  //     }
  //     Toast.show({
  //       position: "bottom",
  //       type: "success",
  //       text1: "Mail Verified",
  //     });
  //   } catch (error: any) {
  //     console.log(error, "err");
  //   }
  // };
  const modalHandle = (open: boolean) => {
    setModalVisible(open);
  };
  return (
    <>
      {!isMailSent ? (
        <View style={globalStyles.screen}>
          <AuthHeader
            showBack
            onBackPress={() => {
              Keyboard.dismiss();
              navigation.goBack();
            }}
          />
          <View style={componentStyle.body}>
            <View style={{ marginHorizontal: 20 }}>
              <Text fontSize={18} variant={"light"}>
                Let's start with
              </Text>
              <Spacer height={5} />
              <Text fontSize={22} variant={"medium"} letterSpacing={0.8}>
                Login via Email
              </Text>
            </View>
            <Spacer height={40} />
            <TextInput
              onChangeText={(value) => {
                setEmail(value);
                handleValidEmail(value);
              }}
              placeholder="Enter email address"
              styles={{
                backgroundColor: "#433041",
                borderRadius: 0,
                paddingHorizontal: 20,
                height: 85,
                fontFamily: textVariants["light"],
                fontSize: 17,
              }}
            />
            {emailValidError ? (
              <ErrText
                style={{
                  marginTop: 10,
                  color: "red",
                  fontSize: 16,
                  marginLeft: 15,
                }}
              >
                {emailValidError}
              </ErrText>
            ) : null}
            <Spacer height={40} />
            <Button
              title="Login"
              variant="three"
              onPress={() => {
                handleEmailLogin();
              }}
              // disabled={emailValidError ? true : false}
              disabled={isDisabled}
              styles={{ opacity: isDisabled ? 0.4 : 1, marginHorizontal: 60 }}
            />
          </View>
        </View>
      ) : (
        <View style={styles.centeredView}>
          <View style={styles.centeredView}>
            <ImageBackground
              source={bgBlur}
              resizeMode="cover"
              style={styles.image}
            >
              <ErrText style={styles.text1}>Almost there…</ErrText>
              <AnimatedLottieView
                style={componentStyle.lottie}
                source={require("./success.json")}
                autoPlay
                loop
              />
              <ErrText
                style={{
                  color: "#fff",
                  textAlign: "center",
                  marginHorizontal: 30,
                  fontSize: 16,
                  lineHeight: 23,
                  fontFamily: textVariants["regular"],
                  marginBottom: 30,
                  // width: "80%",
                }}
              >
                A confirmation email has been sent to {email}. Check inbox and
                click the link to proceed.
              </ErrText>
              <TouchableOpacity
                style={{ marginHorizontal: 30 }}
                onPress={() => {
                  setIsMailSent(!isMailSent);
                }}
              >
                <LinearGradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  colors={buttonVariants["three"]}
                  style={styles.button}
                >
                  <ErrText style={styles.buttonTitle}>Cancel</ErrText>
                </LinearGradient>
              </TouchableOpacity>
            </ImageBackground>
          </View>
        </View>
      )}
    </>
  );
};

const componentStyle = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    justifyContent: "space-between",
  },
  lottie: {
    width: 150,
    alignSelf: "center",
  },
  hide: {
    opacity: 0,
  },
  body: {
    marginTop: 50,
    // marginHorizontal: 15,
  },
});
const styles = StyleSheet.create({
  image: {
    flex: 1,
    // justifyContent: "center",
  },
  centeredView: {
    flex: 1,
  },
  text1: {
    color: "#fff",
    fontSize: 20,
    textAlign: "center",
    fontFamily: textVariants["medium"],
    marginTop: "30%",
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
    borderRadius: 50,

    // position: "absolute",
    // opacity: 0.2,
  },
  button: {
    // flex: 1,
    borderRadius: 30,
    textTransform: "lowercase",
    marginHorizontal: 50,
    marginTop: 15,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonTitle: {
    color: "white",
    fontSize: 14,
    paddingVertical: 12,
    marginHorizontal: 10,
    textAlign: "center",
    fontFamily: textVariants["medium"],
  },
  layoutHeader: {
    backgroundColor: "#ffffff20",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 25,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  nameHolder: {
    paddingVertical: 20,
    paddingHorizontal: 25,
  },
  text: {
    color: "#fff",
    fontSize: 20,
  },
});
