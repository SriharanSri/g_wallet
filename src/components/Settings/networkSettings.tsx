import { StyleSheet, View } from "react-native";
import React, { useContext, useState } from "react";
import SwitchToggle from "react-native-switch-toggle";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootState } from "../../lib/wallet-sdk/store";
import { updateMetadata } from "../../lib/wallet-sdk/authSlice";
import { LoadingIndicatorContext } from "../../App";
import { Text, textVariants } from "../Text";
import { useAlert } from "../../hooks/useAlert";

const NetworkSettings = () => {
  const { toast } = useAlert()
  const { loading, setLoading } = useContext(LoadingIndicatorContext);
  const { metadata, auth, authenticated, uKey, displayName } = useSelector(
    (state: RootState) => state.authReducer
  );
  const dispatch = useDispatch();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [crashReport, crashREport] = useState(false);
  const handle2FAtoggle = async () => {
    setLoading(true);
    let status = !is2FAEnabled;
    setIs2FAEnabled(status);
    const metadata = JSON.parse(
      (await AsyncStorage.getItem("metadata")) ?? "{}"
    );
    metadata.two_fa = status;
    AsyncStorage.setItem("metadata", JSON.stringify(metadata));
    if (await auth.update2FA(status)) {
      setLoading(true);
      console.log("success");
      toast({
        position: "bottom",
        type: status ? "success" : "error",
        title: "Two factor authentication " + (status ? "enabled" : "disabled"),
      });
      // Toast.showWithGravity(
      //   "Two factor authentication " + (status ? "enabled" : "disabled"),
      //   Toast.SHORT,
      //   Toast.BOTTOM
      // );
      setLoading(false);
      // toast("2FA " + (status ? "enabled" : "disabled"), { type: "success" });
    } else {
      setLoading(true);
      setIs2FAEnabled(!status);
      console.log("fail");
      toast({
        position: "bottom",
        type: "error",
        title: "Unable to update 2FA",
      });
      // Toast.showWithGravity("TUnable to update 2FA", Toast.SHORT, Toast.BOTTOM);
      setLoading(false);
      // toast("Unable to update 2FA", { type: "error" });
    }
    dispatch(updateMetadata(metadata));
    setIs2FAEnabled(!is2FAEnabled);
  };
  return (
    <View style={{ marginTop: 10 }}>
      <Text style={componentStyle.settingsTitle}>Networks & Settings</Text>

      <View style={componentStyle.settings}>
        <View style={[componentStyle.padH, { marginVertical: 15 }]}>
          <View
            style={[componentStyle.dflex, { justifyContent: "space-between" }]}
          >
            <Text style={componentStyle.inboxTitle}>2FA</Text>
            <View>
              <SwitchToggle
                switchOn={is2FAEnabled}
                onPress={handle2FAtoggle}
                circleColorOff="#675462"
                circleColorOn="#bc5741"
                backgroundColorOn="#58374f"
                backgroundColorOff="#58374f"
                containerStyle={{
                  width: 55,
                  height: 25,
                  borderRadius: 25,
                  padding: 3,
                }}
                circleStyle={{
                  width: 23,
                  height: 23,
                  borderRadius: 20,
                }}
              />
            </View>
          </View>
        </View>
        <View style={componentStyle.hr}></View>
        <View style={[componentStyle.padH, { marginVertical: 15 }]}>
          <View
            style={[componentStyle.dflex, { justifyContent: "space-between" }]}
          >
            <Text style={componentStyle.inboxTitle}>Crash Reporting</Text>
            <View>
              <SwitchToggle
                switchOn={crashReport}
                onPress={() => crashREport(!crashReport)}
                circleColorOff="#675462"
                circleColorOn="#bc5741"
                backgroundColorOn="#58374f"
                backgroundColorOff="#58374f"
                containerStyle={{
                  width: 55,
                  height: 25,
                  borderRadius: 25,
                  padding: 3,
                }}
                circleStyle={{
                  width: 23,
                  height: 23,
                  borderRadius: 20,
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default NetworkSettings;

const componentStyle = StyleSheet.create({
  wpad: {
    marginHorizontal: 20,
  },
  hr: {
    width: "100%",
    height: 1,
    backgroundColor: "#707070",
    marginVertical: 7,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
  },
  logo: {
    height: 45,
    width: 45,
    resizeMode: "contain",
    borderRadius: 25,
  },
  profile: {
    marginVertical: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  dflex: {
    flexDirection: "row",
    alignItems: "center",
  },
  activebtn: {
    width: 8,
    height: 8,
    backgroundColor: "#0ef20e",
    borderRadius: 30,
  },
  cardbg: {
    backgroundColor: "#58374f",
    borderRadius: 37,
    height: 35,
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#675462",
    borderWidth: 1,
  },
  settings: {
    backgroundColor: "#d4d6db33",
    borderRadius: 25,
    paddingVertical: 10,
    marginVertical: 10,
  },
  padH: {
    paddingHorizontal: 15,
  },
  settingsTitle: {
    fontFamily: textVariants["medium"],
    color: "#fff",
    opacity: 0.5,
    fontSize: 17,
    marginVertical: 5,
  },
  inboxTitle: {
    fontFamily: textVariants["medium"],
    fontSize: 15,
    marginLeft: 10,
  },
});
