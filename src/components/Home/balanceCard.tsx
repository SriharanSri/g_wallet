import { StyleSheet, TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import { SvgUri, SvgXml } from "react-native-svg";
import { Spacer } from "../Spacer";
import LinearGradient from "react-native-linear-gradient";
import { Button } from "../Button";
import { RootState } from "../../lib/wallet-sdk/store";
import { useSelector } from "react-redux";
import { Wallet } from "../../lib/wallet-sdk/wallet";
import Clipboard from "@react-native-clipboard/clipboard";
import QrModal from "../QrModal";
import { Text } from "../Text";
import { WalletConnectScreen } from "../../screens/WalletConnect";
import { useNavigation } from "@react-navigation/native";
import { useAlert } from "../../hooks/useAlert";
import CopySvg from "../../../assets/vector/copy.svg";
import BuySvg from "../../../assets/vector/buy.svg";

const BalanceCard = () => {
  const { toast } = useAlert();
  const { wallet, networkProvider, balanceInUsd, balance } = useSelector(
    (state: RootState) => state.coreReducer
  );
  const navigation: any = useNavigation();
  const [qrVisible, setQrVisible] = useState(false);

  const qrModalHandle = (open: boolean) => {
    setQrVisible(open);
  };

  const buttonVariants = {
    four: ["#1e15f3", "#bd2b65db", "#ff6f2b", "#d83d3d", "#ce2b4f"],
  };
  const [modalVisible, setModalVisible] = useState(false);

  const copyToClipboard = () => {
    console.warn(wallet.getAccountAddress());
    Clipboard.setString(wallet.getAccountAddress());
    toast({
      position: "bottom",
      type: "success",
      title: "Address Copied",
    });
    // Toast.showWithGravity("Address Copied ", Toast.SHORT, Toast.BOTTOM);
  };

  const floorDecimal = (figure: string): string => {
    const rExp: RegExp = /\d+\.0*\d{3}/;
    let formated: RegExpExecArray | null = rExp.exec(figure);
    return formated == null ? figure : formated[0];
  };
  return (
    <View>
      <LinearGradient
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        colors={buttonVariants["four"]}
        style={styles.card}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={styles.cardhearder}>
            <TouchableOpacity
              onPress={copyToClipboard}
              style={[
                styles.cardbg,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 20,
                  width: 170,
                },
              ]}
            >
              <SvgXml
                width={17}
                height={17}
                xml={CopySvg}
                style={[styles.logo, { marginRight: 10 }]}
              />
              <Text variant="regular" color={"#fff"} style={{ maxWidth: 100 }}>
                {Wallet.displayAddressWithEllipsis(wallet.getAccountAddress())}
              </Text>
            </TouchableOpacity>
            {/* <TouchableOpacity
              onPress={openExplorer}
              style={[styles.cardbg, { marginHorizontal: 10 }]}
            >
              <SvgUri
                width={17}
                height={17}
               
                style={[styles.logo, { marginHorizontal: 10 }]}
              />
            </TouchableOpacity> */}
          </View>
          <View style={{ flexDirection: "row" }}>
            {/* <TouchableOpacity
              onPress={() => {
                qrModalHandle(true);
              }}
              style={[styles.cardbg, { width: 40, justifyContent: "center" }]}
            >
              <SvgUri
                width={14}
                height={14}
               
                style={[styles.logo, { marginHorizontal: 10 }]}
              />
            </TouchableOpacity> */}
            <View
              style={[
                styles.cardbg,
                { width: 40, justifyContent: "center", marginLeft: 10 },
              ]}
            >
              <WalletConnectScreen />
            </View>
          </View>
        </View>

        <View>
          <Spacer height={50} />
          <Text
            variant="medium"
            fontSize={13}
            color={"#fff"}
            style={{ opacity: 0.8 }}
          >
            Your Wallet Balance
          </Text>
          <Spacer height={10} />
          <Text variant="bold" fontSize={30}>
            {floorDecimal(balance.toString())} {networkProvider.symbol}
          </Text>

          <Text variant="medium" fontSize={15}>
            ${floorDecimal(balanceInUsd.toString())} USD
          </Text>
        </View>
      </LinearGradient>
      <View style={[styles.buttonGroup, { marginHorizontal: 10 }]}>
        <Button
          onPress={() => {
            qrModalHandle(true);
          }}
          title="Deposit"
          variant="one"
          expanded
          icon="https://walletqa.guardiannft.org/home/buy.svg"
        />

        <Button
          onPress={() => {
            navigation.navigate("Transfer", { address: "", name: "" });
          }}
          title="Transfer"
          variant="two"
          expanded
          icon="https://walletqa.guardiannft.org/home/buy.svg"
        />
      </View>
      <QrModal qrVisible={qrVisible} qrModalHandle={qrModalHandle} />
    </View>
  );
};

export default BalanceCard;

const styles = StyleSheet.create({
  logo: {
    height: 45,
    width: 45,
    resizeMode: "contain",
    borderRadius: 25,
  },
  card: {
    height: 223,
    borderRadius: 37,
    marginTop: 20,
    marginBottom: 10,
    padding: 20,
    marginHorizontal: 10,
  },
  cardhearder: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardbg: {
    backgroundColor: "#ffffff4f",
    borderRadius: 37,
    padding: 10,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
  },
  buttonGroup: {
    flexDirection: "row",
  },
  button: {
    flex: 1,
    borderRadius: 50,
    paddingVertical: 12,
    marginHorizontal: 10,
    textTransform: "lowercase",
  },

  tabArea: {
    backgroundColor: "#d4d6db33",
    minHeight: 60,
    width: "95%",
    margin: 10,
    borderRadius: 35,
    justifyContent: "center",
  },
});
