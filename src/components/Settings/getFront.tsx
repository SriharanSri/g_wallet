import { Alert, StyleSheet, View, TextInput, Image } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import WebView from "react-native-webview";
import axios from "axios";
import { FrontApi } from "@front-finance/api";
import { Button } from "../Button";
import FrontFinance from "@front-finance/frontfinance-rn-sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import AnimatedLottieView from "lottie-react-native";

import { Text } from "../Text";

const GetFront = () => {
  const [iframeLink, setIframeLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [inputAddress, setInputAddress] = useState("");
  const navigation: any = useNavigation();
  useEffect(() => {
    getAuthLink();
  }, []);

  const getAuthLink = useCallback(async () => {
    setError(null);
    setIframeLink(null);
    const api = new FrontApi({
      baseURL: "https://integration-api.getfront.com",
      headers: {
        accept: "application/json",
        "X-Client-Secret":
          "sk_prod_45f48isy.eqg3ecj3s9leyjcwuvqivp7xpbivpp9pkqdo5sgttjqcqown734st1yi3upsh8p5",
        "X-Client-Id": "ca0204c8-fc3d-49b6-8fb8-08db6e74d131",
      },
    });

    // this request should be performed from the backend side
    const response = await api.managedAccountAuthentication.v1CataloglinkList({
      userId: "7652B44F-9CDB-4519-AC82-4FA5500F7455", // insert your unique user identifier here
      callbackUrl: "http://localhost:8081/",
    });

    const data = response.data;
    if (response.status !== 200 || !data?.content) {
      const error = (data && data.message) || response.statusText;
      console.error("Error!", error);
      setError(error);
    } else if (!data.content.iFrameUrl) {
      setError("Iframe url is empty");
    } else {
      setIframeLink(data.content.url);
    }
  }, []);
  const storeAsync = async (value) => {
    try {
      const oldValue = await AsyncStorage.getItem("getfront").then((val) =>
        JSON.parse(val ?? "[]")
      );
      let array: any = oldValue;
      await array.push(value);
      const jsonValue = JSON.stringify(array);
      await AsyncStorage.setItem("getfront", jsonValue);
      console.log("set", jsonValue);
    } catch (e) {
      console.log("error===>", e);
    }
  };
  console.log("token", accessToken);
  console.log("payload", payload);

  return (
    <View style={{ backgroundColor: "white", flex: 1 }}>
      {iframeLink && !accessToken && (
        <FrontFinance
          url={iframeLink}
          onReceive={(payload) => {
            setAccessToken(payload?.accountTokens[0]?.accessToken);
            setPayload(payload);
            storeAsync(payload);
          }}
          onError={(err) => console.log(err)}
        />
      )}
      {accessToken && (
        <View
          style={{
            flex: 1,
            padding: 20,
            justifyContent: "center",
            // alignItems: "center",
          }}
        >
          <AnimatedLottieView
            style={styles.lottie}
            source={require("../../../assets/lottie/success.json")}
            autoPlay
            loop
          />
          <Text color="#000" style={{ fontSize: 20, textAlign: "center" }}>
            Successfully linked account
          </Text>
          <Button
            title={"Go Home"}
            variant="two"
            expanded
            onPress={() => navigation.navigate("Home")}
          />
          {/* <View style={styles.row}>
            <Text style={{ fontSize: 20, color: "black" }}>From : </Text>
            <Image
              source={{
                uri: `data:image/jpeg;base64,${payload?.brokerBrandInfo.brokerLogo}`,
              }}
              style={{ height: 25, width: 25 }}
            />
            <Text style={{ fontSize: 15, color: "black" }}>
              {payload?.accountTokens[0].account.accountId}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={{ fontSize: 20, color: "black" }}>To : </Text>
            <TextInput
              placeholderTextColor={"black"}
              placeholder="Enter Address"
              style={{ width: "80%" }}
              onChangeText={(val) => console.log("val", val)}
            />
          </View> */}
        </View>
      )}
    </View>
  );
};

export default GetFront;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lottie: {
    width: 350,
    alignSelf: "center",
    height: 350,
  },
});
