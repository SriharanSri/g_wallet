import React, { useContext, useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import { AuthHeader } from "../../components/AuthHeader";
import { Spacer } from "../../components/Spacer";
import { Text, textVariants } from "../../components/Text";
import { globalStyles } from "../../styles/global.style";
import PhoneInput from "react-native-phone-number-input";
import { Auth } from "../../lib/wallet-sdk/Auth";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../lib/wallet-sdk/store";
import { LoadingIndicatorContext } from "../../App";
import { useAlert } from "../../hooks/useAlert";
import { Button } from "../../components/Button";

export const MobileScreen = ({ navigation }: any) => {
  const { toast } = useAlert();
  const { loading, setLoading } = useContext(LoadingIndicatorContext);
  const dispatch = useDispatch();
  const [value, setValue] = useState("");
  const { auth, authenticated } = useSelector(
    (state: RootState) => state.authReducer
  );
  const [formattedValue, setFormattedValue] = useState<string>();
  // console.log(formattedValue);

  const sendOTP = async () => {
    setLoading(true);
    auth
      .otpLogin(formattedValue, Auth.LoginType.OTP)
      .then((response) => {
        console.log(response, "response");
        if (response?.status === true) {
          toast({
            position: "bottom",
            type: "success",
            title: '"OTP Send to the number"',
          });
          setLoading(false);
          navigation.navigate("otp_screen", { mobileNum: formattedValue });
          // dispatch(
          //   userAuthenticated({
          //     displayName: value,
          //   })
          // );
        }
      })
      .catch((error: Error) => {
        toast({
          position: "bottom",
          type: "error",
          title: `Unable to send OTP. ${error.message}`,
        });
        setLoading(false);
      });
  };

  return (
    <View style={globalStyles.screen}>
      <AuthHeader
        showBack
        onBackPress={() => {
          Keyboard.dismiss();
          navigation.goBack();
        }}
      />
      <View style={[componentStyle.body, { marginHorizontal: 20 }]}>
        <Text fontSize={20} variant={"light"}>
          Let's start with
        </Text>
        <Spacer height={5} />
        <Text fontSize={22} variant={"medium"}>
          Login via Mobile
        </Text>
        <Spacer height={40} />
      </View>
      <View style={componentStyle.phone}>
        <PhoneInput
          countryPickerButtonStyle={{ backgroundColor: "#433041" }}
          defaultValue={value}
          placeholder={"Enter phone number"}
          textInputStyle={{
            color: "#fff",
            fontFamily: textVariants["light"],
            fontSize: 17,
          }}
          codeTextStyle={{
            color: "#fefefe",
            fontFamily: textVariants["medium"],
          }}
          textInputProps={{ maxLength: 10, selectionColor: "#fff" }}
          value={value}
          defaultCode="IN"
          layout="first"
          onChangeText={(text) => {
            text.length <= 10 ? setValue(text) : "";
          }}
          onChangeFormattedText={(text) => {
            setFormattedValue(text);
          }}
          textContainerStyle={{
            backgroundColor: "#433041",
          }}
          containerStyle={{
            width: "100%",
            backgroundColor: "#433041",
          }}
          autoFocus
        />
      </View>
      <Spacer height={50} />
      <Button
        title="Sign In"
        variant="three"
        onPress={
          () => sendOTP()
          // navigation.navigate(ROUTES.OTP_SCREEN)
        }
        disabled={value.length === 10 ? false : true}
        styles={{
          opacity: value.length === 10 ? 1 : 0.4,
          marginHorizontal: 60,
        }}
      />
    </View>
  );
};

const componentStyle = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    justifyContent: "space-between",
  },
  phone: {
    justifyContent: "center",
    alignItems: "center",
  },
  hide: {
    opacity: 0,
  },
  body: {
    marginTop: 50,
  },
});
