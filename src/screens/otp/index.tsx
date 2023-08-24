import React, { FunctionComponent, useContext, useState } from "react";
import { View, StyleSheet, Text, Platform } from "react-native";
import { AuthHeader } from "../../components/AuthHeader";
// import { Text } from "../../components/Text";
import { globalStyles } from "../../styles/global.style";
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from "react-native-confirmation-code-field";
import { Auth } from "../../lib/wallet-sdk/Auth";
import Toast from "react-native-toast-message";
import { RootState } from "../../lib/wallet-sdk/store";
import { useDispatch, useSelector } from "react-redux";
import * as Keychain from "react-native-keychain";
import {
  updateImportAccounts,
  userAuthenticated,
} from "../../lib/wallet-sdk/authSlice";
import SecureStorage from "react-native-encrypted-storage";
import { updateKeyInfra, updateWallet } from "../../lib/wallet-sdk/coreSlice";
import storage from "../../lib/wallet-sdk/storage/storage";
import { LoadingIndicatorContext } from "../../App";
import { textVariants } from "../../components/Text";
import { useAlert } from "../../hooks/useAlert";
import { userManager } from "../../lib/wallet-sdk/storage/user-manager";
import { usePrepareWallet } from "../../hooks/usePrepareWallet";
import * as RNotp from "react-native-otp-verify";
import { has } from "lodash";
import { Button } from "../../components/Button";

export const OtpScreen: FunctionComponent = ({ route, navigation }: any) => {
  const { toast } = useAlert();
  const { loading, setLoading } = useContext(LoadingIndicatorContext);
  const CELL_COUNT = 6;
  const [value, setValue] = useState("");
  const [counter, setCounter] = React.useState(30);
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const { checkMetadataAndNavigate } = usePrepareWallet();
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });
  React.useEffect(() => {
    counter > 0 && setTimeout(() => setCounter(counter - 1), 1000);
    // listenAndFillOtp()
  }, [counter]);

  const listenAndFillOtp = async () => {
    if (Platform.OS === "android") {
      const hash = await RNotp.getHash();
    }
    await RNotp.getOtp();
    try {
      RNotp.addListener((message) => {
        const otp = /(\d{6})/g?.exec(message)[1];
        setValue(otp);
        RNotp.removeListener();
        handleOTPVerify(otp);
      });
    } catch (error) {
      console.error("THIS ERROR IS ", error);
    }
  };

  const { auth, authenticated } = useSelector(
    (state: RootState) => state.authReducer
  );

  const { keyInfra, wallet } = useSelector(
    (state: RootState) => state.coreReducer
  );

  const { mobileNum } = route.params;
  const dispatch = useDispatch();

  const handleOTPVerify = async (otp?: string) => {
    // navigation.navigate("CreateWallet");
    setLoading(true);
    let token = await auth.getToken();
    let validated = await auth.verifyOTP(
      Auth.LoginType.OTP,
      // Auth.getLoginId(),
      mobileNum,
      token,
      otp ?? value,
      true
    );
    if (validated?.status === true) {
      setLoading(true);
      const username = "keyData";
      const password = validated?.token;

      let hashified = keyInfra.hashify(validated?.data.ukey).toString();
      await SecureStorage.setItem("ukey", hashified);
      keyInfra.setUkey(hashified);
      await auth.setToken(password);
      await auth.setLoginDetails({
        login_id: mobileNum,
        login_type: Auth.LoginType.OTP,
      });
      await auth.saveUserRecords({
        loginId: mobileNum,
        loginType: Auth.LoginType.OTP,
        displayName: mobileNum,
        metadata: {},
      });
      dispatch(updateKeyInfra(hashified));

      dispatch(
        userAuthenticated({
          displayName: await Auth.getDisplayUserName(),
          metadata: {},
          uKey: hashified,
          mailName: mobileNum,
        })
      );
      setLoading(false);
      checkMetadataAndNavigate();
    }
    if (validated === false) {
      toast({
        position: "bottom",
        type: "error",
        title: "Unable to verify auth",
      });
      setLoading(false);
      // Toast.showWithGravity("Unable to verify auth", Toast.SHORT, Toast.BOTTOM);
    }
    setLoading(false);
  };
  const resendOTP = async () => {
    setLoading(true);
    try {
      setLoading(true);
      let response = await auth.otpLogin(mobileNum, Auth.LoginType.OTP);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }

    setCounter(30);
  };

  return (
    <View style={globalStyles.screen}>
      {/* <AuthHeader showBack onBackPress={() => navigation.goBack()} /> */}
      <View style={styles.layout}>
        <Text style={styles.verify}>Verify OTP</Text>
        <Text style={styles.sent}>OTP sent to {mobileNum}</Text>
        <CodeField
          ref={ref}
          {...props}
          // Use `caretHidden={false}` when users can't paste a text value, because context menu doesn't appear
          value={value}
          onChangeText={setValue}
          cellCount={CELL_COUNT}
          rootStyle={styles.codeFieldRoot}
          autoComplete="sms-otp"
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          renderCell={({ index, symbol, isFocused }) => (
            <Text
              key={index}
              style={[styles.cell, isFocused && styles.focusCell]}
              onLayout={getCellOnLayoutHandler(index)}
            >
              {symbol || (isFocused ? <Cursor /> : null)}
            </Text>
          )}
        />
        <Button
          title="Verify"
          variant="three"
          onPress={() => handleOTPVerify()}
          disabled={value.length < 6}
          styles={{ opacity: value.length < 6 ? 0.4 : 1 }}
        />
        {counter > 0 && (
          <Text style={styles.resend}>Resend OTP in {counter} seconds</Text>
        )}

        {counter === 0 && (
          <Text onPress={resendOTP} style={styles.resend}>
            Resend OTP
          </Text>
        )}
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  root: { flex: 1, padding: 20 },
  title: { textAlign: "center", fontSize: 20 },
  codeFieldRoot: { margin: 20, fontSize: 20 },
  cell: {
    width: 43,
    height: 43,
    lineHeight: 40,
    fontSize: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255, 0.5)",
    borderRadius: 5,
    textAlign: "center",
    color: "white",
  },
  focusCell: {
    borderColor: "white",
  },
  layout: {
    width: "90%",
    backgroundColor: "#d4d6db33",
    alignSelf: "center",
    borderRadius: 20,
    padding: 15,
    marginTop: "15%",
  },
  verify: {
    fontSize: 20,
    fontFamily: textVariants["medium"],
    color: "#fff",
    textAlign: "center",
    marginTop: 15,
  },
  resend: {
    fontSize: 16,
    fontFamily: textVariants["medium"],
    color: "#fff",
    textAlign: "center",
    marginBottom: 40,
    marginTop: 20,
  },
  sent: {
    fontSize: 16,
    fontFamily: textVariants["regular"],
    color: "#fff",
    textAlign: "center",
    marginTop: 10,
    opacity: 0.7,
  },
});
