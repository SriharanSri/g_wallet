import { Image, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { globalStyles } from "../../styles/global.style";
import { textVariants } from "../Text";
import axios from "axios";
import { ApiUrl, Header_Front } from "../../lib/getFront-api/getFrontapi";

const GetFrontProfile = ({ navigation, route }: any) => {
  const params = route.params;
  const [token, setToken] = useState(
    params?.params?.accountTokens[0].accessToken
  );
  const [balance, setBalance] = useState(null);
  const [holding, setHolding] = useState(null);
  const [transferHistory, setTransferHistory] = useState(null);
  const userID = "7652B44F-9CDB-4519-AC82-4FA5500F7455";
  useEffect(() => {
    getBalanceOf();
    getHoldings();
    getTransfer();
  }, []);
  const getBalanceOf = async () => {
    const balanceResponse = await axios.post(
      ApiUrl.Balanace_Get,
      { type: params?.params?.brokerType, authToken: token },
      { headers: Header_Front }
    );
    setBalance(balanceResponse?.data);
  };
  const getHoldings = async () => {
    const response = await axios.get(
      ApiUrl.Holdings_portfolio + "?UserId=" + userID,
      { headers: Header_Front }
    );
    setHolding(response?.data?.content);
  };
  const getTransfer = async () => {
    const response = await axios.post(
      ApiUrl.Transfer_History,
      {
        type: params?.params?.brokerType,
        authToken: token,
        // "9q+Zot0v+Dv4FIq89sN9/g==.YjxUYEdld5CP36cWWo5FhKR01uQ7nCPXZiFPCgr7Va1P4fwjnKViWMr+baU0hxqTN8pgP+m5b2G9JaOTqi1UkArvOHME5DDyvl3qKCN2bg+k6A9v9cHD55FGn1z5ATRw4TOaeE0DyvoglaJu4TYrA+akfOOMQQLsnwV81AhZpe7WiDXMAf1pRgtR6Ig5TJ3C8Pm4VZIkdpj+3PZmzOiGluL+GmgVI1+GelslZfuay2x+tf8uCSzG953DutjPIUnb61SfeiwJrxVeY2exUBT1HnGolvoBYHx/gJlT4UvYJ+ydkdb84JplMnOgpQmuuyTXl0GYwj3qv29sascyLhHMkh7cpDhYoJmSKhHzcDVhxbMieOSwTGoUg5o8+YoS6rth",
      },
      { headers: Header_Front }
    );
    setTransferHistory(response?.data?.content);
  };
  // console.log("balan", balance?.content?.balances[0]?.cash);
  // console.log("params", params?.params?.accountTokens[0]);
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#1b0719",
        height: "100%",
        width: "100%",
        paddingHorizontal: 10,
      }}
    >
      <View style={{ padding: 20 }}>
        <Text
          style={{
            color: "#fff",
            fontSize: 22,
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          Portfolio & history
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Image
            source={{
              uri: `data:image/jpeg;base64,${params?.params?.brokerBrandInfo?.brokerLogo}`,
            }}
            style={{ height: 25, width: 25 }}
          />
          <Text
            style={{
              color: "#fff",
              fontFamily: textVariants["medium"],
              fontSize: 14,
              marginLeft: 10,
            }}
          >
            {params?.params?.brokerName}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 10,
            marginTop: 5,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontFamily: textVariants["medium"],
              fontSize: 16,
            }}
          >
            {balance?.content?.balances[0]?.cash}{" "}
            {balance?.content?.balances[0]?.currencyCode}
            {/* {balance?.content?.cryptocurrencyPositions[0]?.amount}
            {balance?.content?.cryptocurrencyPositions[0]?.symbol} */}
          </Text>
        </View>
      </View>
      <View
        style={{
          marginTop: 8,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            color: "#fff",
            fontFamily: textVariants["medium"],
            fontSize: 12,
            marginLeft: 10,
          }}
        >
          {params?.params?.brokerType}
        </Text>
        <Text
          style={{
            color: "#fff",
            fontFamily: textVariants["medium"],
            fontSize: 12,
            marginLeft: 10,
          }}
        >
          Available Balance
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <Text style={styles.text}>Available Balance :</Text>
        <Text style={styles.text}>
          {balance?.content?.balances[0]?.cash}{" "}
          {balance?.content?.balances[0]?.currencyCode}
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <Text style={styles.text}>Crypto Currencies Value :</Text>
        <Text style={styles.text}>{holding?.cryptocurrenciesValue} USD</Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        <Text style={styles.text}>Crypto Value :</Text>
        <Text style={styles.text}>
          {holding?.cryptocurrencyPositions[0]?.amount}{" "}
          {holding?.cryptocurrencyPositions[0]?.symbol}
        </Text>
      </View>
      <View style={{ padding: 20 }}>
        <Text
          style={{
            color: "#fff",
            fontSize: 22,
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          Transfer history
        </Text>
      </View>

      {transferHistory &&
        transferHistory?.transfers.length > 0 &&
        transferHistory.transfers.map((data: any, i: any) => {
          return (
            <View key={i}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 20,
                }}
              >
                <Text style={styles.text}>Transaction Type</Text>
                <Text style={styles.text}>{data?.type}</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                <Text style={styles.text}>ID</Text>
                <Text style={styles.text}>{data?.id}</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                <Text style={styles.text}>Chain</Text>
                <Text style={styles.text}>{data?.chain}</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                <Text style={styles.text}>Amount</Text>
                <Text style={styles.text}>{data?.amount}</Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 10,
                  alignItems: "center",
                }}
              >
                <Text style={styles.text}>Target Address</Text>
                <Text style={[styles.text, { fontSize: 7 }]}>
                  {data?.targetAddress}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                <Text style={styles.text}>Transfer Fee</Text>
                <Text style={styles.text}>{data?.transferFee}</Text>
              </View>
            </View>
          );
        })}
    </View>
  );
};

export default GetFrontProfile;

const styles = StyleSheet.create({
  text: {
    color: "#fff",
    fontFamily: textVariants["medium"],
    fontSize: 12,
  },
});
