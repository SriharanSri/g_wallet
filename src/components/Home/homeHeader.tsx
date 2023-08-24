import React, { useContext, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Image as RNImage,
  Button,
  Modal,
  Text,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { SvgUri } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
// import Wallet from "../../lib/wallet-sdk/wallet";
import WalletConnect from "@walletconnect/client";
import Icon from "react-native-vector-icons/AntDesign";
import { Wallet } from "../../lib/wallet-sdk/wallet";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../lib/wallet-sdk/store";
import { TouchableOpacity } from "react-native-gesture-handler";
import { changeNetwork } from "../../lib/wallet-sdk/coreSlice";
import storage from "../../lib/wallet-sdk/storage/storage";
import { LoadingIndicatorContext } from "../../App";
import { useAlert } from "../../hooks/useAlert";
import { textVariants } from "../Text";
import ToggleSvg from "../../../assets/toggle.svg";
import { updateToCloudStorage } from "../../lib/utils";

let connector: WalletConnect;
const HomeHeader = () => {
  const { toast } = useAlert();
  const { networkProvider } = useSelector(
    (state: RootState) => state.coreReducer
  );
  const { metadata } = useSelector((state: RootState) => state.authReducer);
  const { walletConnectSession } = useSelector(
    (state: RootState) => state.walletConnectReducer
  );
  const { setLoading } = useContext(LoadingIndicatorContext);
  const [availableNetworks, setAvailableNetworks] = useState([]);
  const navigation: any = useNavigation();
  const dispatch = useDispatch();
  const data = [
    { label: "Goereri Test Network", value: "1" },
    { label: "Mumbai Test Network", value: "2" },
    { label: "Kolkata Test Network", value: "3" },
    { label: "Guardian Test Network", value: "4" },
    { label: "Binance Test Network", value: "5" },
  ];
  const [value, setValue] = useState(null);

  useEffect(() => {
    loadNetworks();
    setValue(networkProvider.key);
  }, [networkProvider]);

  const loadNetworks = async () => {
    const networks = await Wallet.getNetworkProviders();
    // console.log("Available Networks =====>", Array.from(networks || new Map([])))
    const res = [];
    networks.forEach(function (val: any, key) {
      res.push({ label: val.name, value: val.key, data: val });
    });
    setAvailableNetworks(res);
  };

  const onNetworkChanged = async (networkKey: any) => {
    setLoading(true);
    const network = availableNetworks.find(
      (network: any) => network.value === networkKey
    );
    await storage.setItem(Wallet.NETWORK_STORAGE_KEY, network.value);
    dispatch(changeNetwork(network.data));

    //EMITING TO ALL WALLETCONNECT SESSION
    walletConnectSession.map((session) => {
      // session.changeRpcUrl(network.data.url)
      // console.log("Rpc url changed ======> ", session)
      session.walletConnectClient.updateSession({
        ...session.walletConnectClient.session,
        chainId: Number(network.data.chainId),
      });
    });
    toast({
      title: `Network changed to ${network.data.name}`,
      position: "bottom",
    });
  };

  return (
    <View style={styles.header}>
      {/* <TouchableOpacity
        onPress={() => {
        }}
      > */}
      <RNImage
        source={{
          uri: (metadata as any).profile_image
            ? (metadata as any).profile_image
            : "https://walletqa.guardiannft.org/button-white.png?imwidth=256",
        }}
        style={styles.logo}
      />
      {/* </TouchableOpacity> */}

      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        inputSearchStyle={styles.inputSearchStyle}
        containerStyle={{
          backgroundColor: "#1b0719d6",
          borderColor: "transparent",
          paddingVertical: 0,
          borderRadius: 15,
          marginTop: -33,
        }}
        data={availableNetworks}
        search={false}
        autoScroll={false}
        labelField="label"
        valueField="value"
        showsVerticalScrollIndicator={false}
        placeholder="Goereri Test Network"
        searchPlaceholder="Search..."
        value={value}
        itemTextStyle={{
          color: "#fff",
          opacity: 0.6,
          fontFamily: textVariants["regular"],
          fontSize: 11,
          textAlign: "center",
          paddingVertical: 0,
        }}
        activeColor={"#ffffff05"}
        onChange={(item) => {
          setValue(item.value);
          onNetworkChanged(item.value);
        }}
        itemContainerStyle={{ borderBottomWidth: 1 }}
      />

      <TouchableOpacity
        style={{ height: 30, width: 30 }}
        onPress={() => {
          // console.log("hello")
          // getBalance();
          navigation.navigate("Settings");
        }}
      >
        <SvgUri
          width={30}
          height={30}
          uri="https://walletqa.guardiannft.org/home/toggle.svg"
        />
      </TouchableOpacity>
    </View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 10,
    justifyContent: "space-between",
    marginHorizontal: 20,
  },
  logo: {
    height: 45,
    width: 45,
    resizeMode: "contain",
    borderRadius: 25,
  },
  dropdown: {
    flex: 1,
    height: 45,
    backgroundColor: "#d4d6db33",
    paddingHorizontal: 15,
    marginLeft: 20,
    marginRight: 25,

    borderRadius: 30,
    // paddingLeft: 30,
  },
  icon: {
    marginRight: 5,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#fff",
  },
  selectedTextStyle: {
    fontSize: 12,
    fontFamily: textVariants["regular"],
    color: "#fff",
    textAlign: "center",
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
});
