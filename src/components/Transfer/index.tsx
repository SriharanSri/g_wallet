import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import Icon from "react-native-vector-icons/AntDesign";
import LinearGradient from "react-native-linear-gradient";
import { SelectList } from "react-native-dropdown-select-list";
import { Spacer } from "../Spacer";
import { Button } from "../Button";
import { RootState } from "../../lib/wallet-sdk/store";
import { useSelector } from "react-redux";
import { Wallet } from "../../lib/wallet-sdk/wallet";
import { useNavigation } from "@react-navigation/native";
import { ImportTokenFormType } from "../../lib/wallet-sdk/types/token-type";
import { tokensManager } from "../../lib/wallet-sdk/storage/tokens-manager";
import { Dropdown } from "react-native-element-dropdown";
import { ImportCollectibleFormType } from "../../lib/wallet-sdk/types/collectible-type";
import { collectiblesManager } from "../../lib/wallet-sdk/storage/collectibles-manager";
import { Text, textVariants } from "../Text";
import { AuthHeader } from "../AuthHeader";
import { globalStyles } from "../../styles/global.style";
import { LoadingIndicatorContext } from "../../App";
import { useAlert } from "../../hooks/useAlert";
import Tick from "react-native-vector-icons/AntDesign";
import SendSvg from "../../../assets/vector/send.svg";

const Transfer = ({ route }: any) => {
  const { toast } = useAlert();
  const navigation: any = useNavigation();
  const buttonVariants = {
    four: ["#1e15f3", "#bd2b65db", "#ff6f2b", "#d83d3d", "#ce2b4f"],
  };
  const { wallet, networkProvider, balance, balanceInUsd } = useSelector(
    (state: RootState) => state.coreReducer
  );
  const [selected, setSelected] = useState("");
  const [toAddress, setToAddress] = useState("");
  const { setLoading } = useContext(LoadingIndicatorContext);
  const [amount, setAmount] = useState("");
  const [validAddress, setValidAddress] = useState(true);
  const [token, setToken] = useState("ethereum");
  const [resovledAddress, setResovledAddress] = useState("");
  const [tokenId, setTokenId] = useState<string | null>();
  const [tokenType, setTokenType] = useState("");
  const [asset, setAsset] = useState(networkProvider.symbol);
  const [tokenName, setTokenName] = useState<string | null>();
  const [isContract, setIsContract] = useState(false);
  const [qrDAta, setQrDAta] = useState("");

  const [addressType, setAddressType] = useState<
    "eth_address" | "ensDomain" | "bnsDomain"
  >("eth_address");
  const [list, setList] = useState([]);
  const [value, setValue] = useState("ethereum");
  const testQr: string = route?.params?.QrData;
  console.log("testQr", testQr);
  // const data = [{ key: "1", value: "Ethereum (ETH)" }];
  const addressTypeAll = [
    { key: Wallet.AddressType.EthAddress, value: "Public Address" },
    { key: Wallet.AddressType.ENSDomain, value: "ENS Domain" },
  ];
  useEffect(() => {
    route.params.address && setAddress(route.params.address);
    tokens();
  }, []);
  useEffect(() => {
    testQr && setToAddress(testQr.split("ethereum:").pop());
  }, [testQr]);
  useEffect(() => {
    return () => {
      setAmount("");
      setToAddress("");
      setValue("ethereum");
    };
  }, []);

  useEffect(() => {
    const validateAddress = async () => {
      try {
        if (typeof toAddress === undefined || toAddress.trim() === "") {
          setValidAddress(true);
          setResovledAddress("");
          return false;
        }
        let isValid = await wallet.isValidAddress(addressType, toAddress);
        setValidAddress(isValid);
        if (toAddress.split(".")[1] === "eth") {
          setLoading(true);
          if (isValid && addressType === Wallet.AddressType.ENSDomain) {
            console.log("sssss", await wallet.getAddressFromEns(toAddress));
            setResovledAddress(await wallet.getAddressFromEns(toAddress));
          }
          setLoading(false);
        }

        if (isValid && addressType === Wallet.AddressType.GNSDomain) {
          setResovledAddress(await wallet.getAddressFromGns(toAddress));
        }
      } catch (error) {
        console.error(error);
        toast({
          position: "bottom",
          type: "error",
          title: "Invalid Address",
        });
      }
    };
    validateAddress();
  }, [toAddress, addressType, networkProvider]);

  const tokens = async () => {
    const data: ImportTokenFormType[] =
      (await tokensManager.get(wallet.getAccountAddress(), [
        wallet.networkProvider.chainId,
      ])) || [];
    let temp: any = [
      {
        key: "Ethereum",
        value: "ethereum",
        data: JSON.stringify({ tokenAddress: "ethereum" }),
      },
    ];
    console.log(data);
    for (let i = 0; i < data.length; i++) {
      console.log("token address is", data[i].tokenAddress);
      temp.push({
        key: `${data[i].tokenName}-TOKEN`,
        value: `${data[i].tokenName}-TOKEN-${data[i].tokenAddress}`,
        data: JSON.stringify(data[i]),
      });
    }
    const collectibles: ImportCollectibleFormType[] =
      await collectiblesManager.get(wallet.getAccountAddress(), [
        wallet.networkProvider.chainId,
      ]);
    for (let i = 0; i < collectibles.length; i++) {
      console.log("token addres", collectibles[i].tokenAddress);
      temp.push({
        key: `${collectibles[i].tokenName}-COLLECTIBLE`,
        value: `${collectibles[i].tokenName}-COLLECTIBLE-${collectibles[i].tokenAddress}-${collectibles[i].tokenId}`,
        data: JSON.stringify(collectibles[i]),
      });
    }
    setList(temp);
  };

  const setAddress = async (_address: any) => {
    try {
      console.log("address set is", _address);
      setToAddress(_address);
      // let isValid = wallet.walletInst?.web3.utils.toChecksumAddress(_address);
      // if(isValid){
      let isContractAddress = await wallet.walletInst?.web3.eth.getCode(
        _address
      );
      console.log("is contract address", isContractAddress);
      setIsContract(isContractAddress !== "0x");
      return;
      // }
      // setIsContract(false)
    } catch (error: any) {
      setIsContract(false);
      console.log("error", error);
    }
  };

  const handleClick = (selectedToken: {
    tokenSymbol: string;
    tokenType?: string;
    tokenName?: string;
    tokenAddress?: string;
    tokenId?: string | null;
  }) => {
    console.log("in handle click", selectedToken);
    if (selectedToken.tokenAddress === "ethereum") {
      setAsset("ETH");
      setToken(selectedToken.tokenAddress);
      setTokenType("ETH");
      return;
    }
    setToken(selectedToken.tokenAddress || "");
    setTokenId(selectedToken.tokenId || "");
    setTokenType(selectedToken.tokenType || "TOKEN");
    setAsset(selectedToken.tokenSymbol || "");
    setTokenName(
      selectedToken.tokenType === "COLLECTIBLE"
        ? `${selectedToken.tokenName} #${
            selectedToken.tokenId?.length || 0 > 6
              ? Wallet.displayAddressWithEllipsis(selectedToken.tokenId)
              : selectedToken.tokenId
          }`
        : selectedToken.tokenName
    );
  };
  const transferHandler = async () => {
    console.log("transfer handler");
    // event.preventDefault()
    try {
      if (Number(amount) <= 0) {
        toast({
          position: "bottom",
          type: "error",
          title: "Amount Should be greater than 0",
        });
        return;
      }
      console.log(
        "amount",
        amount,
        validAddress,
        await wallet.walletInst.getBalance(token),
        token
      );
      if (!validAddress) {
        toast({
          position: "bottom",
          type: "error",
          title: "Enter valid address",
        });
        return;
      }
      if (Number(amount) > (await wallet.walletInst.getBalance(token))) {
        toast({
          position: "bottom",
          type: "error",
          title: "Insufficient fund in your account",
        });
        return;
      }
      // if (amount > 0 && validAddress && amount <= await wallet.getBalance()) {
      let address = toAddress;
      if (
        addressType == Wallet.AddressType.ENSDomain ||
        addressType == Wallet.AddressType.GNSDomain
      ) {
        if (resovledAddress == "") {
          toast({
            position: "bottom",
            type: "error",
            title: "Enter valid address",
          });
          return;
        }
        address = resovledAddress;
      }
      let value: any = wallet.toCompatibleAmount(amount); // TODO:
      console.log(
        "address *** before",
        address,
        amount,
        tokenId,
        value,
        wallet.walletInst?.account?.address,
        value,
        token
      );
      value = value.toString("hex");
      let hexData =
        token === "ethereum"
          ? undefined
          : await wallet.walletInst?.generateData(
              wallet.walletInst?.account?.address,
              address,
              value,
              token,
              tokenId,
              tokenType
            );
      console.log(
        "hexdata",
        hexData,
        "token",
        token,
        wallet.walletInst.account.address
      );
      console.log(
        "estimate gas",
        wallet.walletInst.account.address,
        token,
        address,
        hexData
      );
      var gas = hexData
        ? wallet.walletInst?.stringToHex(
            (await wallet.walletInst?.web3.eth.estimateGas({
              from: wallet.walletInst?.account?.address,
              to: token,
              data: hexData,
            })) || "0"
          )
        : wallet.walletInst?.stringToHex(21000);
      console.log(
        "check values : ",
        address,
        amount,
        hexData,
        token,
        tokenId,
        tokenType
      );
      // return
      navigation.navigate("Confirmations", {
        transactionType: "transfer",
        to: address,
        from: wallet.walletInst?.account?.address,
        value: value,
        tokenAddress: token || "ethereum",
        asset,
        tokenType,
        tokenId,
        data: hexData,
        gas: gas || "",
      });
      // modalHandle(false)
      console.log("after navigation");
      return;
      // router.push({
      //   pathname: '/confirmation', query:
      // {
      //     transactionType: 'transfer',
      //     to: address,
      //     from: wallet.walletInst?.account?.address,
      //     value: value,
      //     tokenAddress: token || "ethereum",
      //     asset,
      //     tokenType,
      //     tokenId,
      //     data: hexData,
      //     gas: gas || ''
      //   }
      // })
      // }
    } catch (error: any) {
      console.log("error", error);
      toast({
        position: "bottom",
        type: "error",
        title: error.message,
      });
      // toast(error.message, { type: 'error' })
    }
  };
  return (
    <View style={globalStyles.screen}>
      <View style={styles.centeredView}>
        <AuthHeader showBack onBackPress={() => navigation.goBack()} />
        <LinearGradient
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          colors={buttonVariants["four"]}
          style={styles.card}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={[styles.transferHeading, { marginLeft: "30%" }]}>
              Transfer Details
            </Text>
          </View>
          <Spacer height={20} />
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
            data={list}
            search={false}
            autoScroll={false}
            labelField="key"
            valueField="value"
            showsVerticalScrollIndicator={false}
            // placeholder="Goereri Test Network"
            searchPlaceholder="Search..."
            value={value}
            itemTextStyle={{
              color: "#fff",
              opacity: 0.6,
              fontSize: 13,
              textAlign: "center",
              paddingVertical: 0,
            }}
            activeColor={"#370a1d00"}
            onChange={(item) => {
              console.log("item is", item);
              handleClick(JSON.parse(item.data));
            }}
            itemContainerStyle={{
              borderBottomWidth: 1,
              borderBottomColor: "#eaeaea63",
            }}
          />
          {/* <SelectList
              setSelected={(val) => setSelected(val)}
              data={data}
              save="key"
              search={false}
              onSelect={() => {
                console.log("data changed....")
              }}
              placeholder={"Please select token"}
              boxStyles={{
                backgroundColor: "#eaeaea63",
                borderColor: "#eaeaea63",
                borderRadius: 20,
              }}
              dropdownTextStyles={{ color: "#fff" }}
              dropdownItemStyles={
                {
                  // backgroundColor: "#7f848b7d",
                  // borderRadius: 20,
                }
              }
              dropdownStyles={{
                backgroundColor: "#7f848b7d",
                borderRadius: 30,
              }}
            /> */}
          <Spacer />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TextInput
              keyboardType="numeric"
              onChangeText={(val) => setAmount(val)}
              placeholder="Enter amount in"
              placeholderTextColor={"#fff"}
              style={styles.input}
            />
            <Text variant="medium" fontSize={22}>
              {networkProvider.symbol}
            </Text>
          </View>
          <View>
            <Text
              variant="medium"
              fontSize={20}
              textAlign={"center"}
              style={{ marginTop: 10 }}
            >
              ~ ${balanceInUsd}
            </Text>
          </View>
          <View style={{ marginVertical: 10 }}>
            <Text variant="regular" fontSize={17} textAlign={"center"}>
              {balance} {networkProvider.symbol}
            </Text>
            <Text variant="regular" fontSize={17} textAlign={"center"}>
              Available Balance
            </Text>
          </View>
        </LinearGradient>
        <View style={{ marginHorizontal: 20 }}>
          <Text style={styles.transferHeading}>
            Transferring to {route.params.name}
          </Text>
          <View
            style={[
              styles.inputTransfer,
              {
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 8,
              },
            ]}
          >
            <Spacer height={10} />
            <TextInput
              onChangeText={(val) => {
                setAddress(val);
              }}
              value={toAddress}
              placeholder="Enter the name or address"
              placeholderTextColor={"#a59fa4"}
              style={{ color: "#fff", fontSize: 16, paddingRight: 63 }}
            />
            {validAddress && toAddress.length > 1 && (
              <View
                style={{ right: 38, alignSelf: "center", position: "absolute" }}
              >
                <Tick name="checkcircle" size={15} color="#90ee8f" />
              </View>
            )}
            {toAddress.length > 1 && validAddress ? (
              <TouchableOpacity
                onPress={() => {
                  setToAddress("");
                }}
                style={{ right: 10, alignSelf: "center", position: "absolute" }}
              >
                <Icon name="close" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("Scanner");
                }}
                style={{ right: 20, alignSelf: "center", position: "absolute" }}
              >
                <Icon name="scan1" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
          {addressType === Wallet.AddressType.ENSDomain &&
            resovledAddress &&
            validAddress && (
              <Text style={styles.textSuc}>{resovledAddress}</Text>
            )}
          {isContract && (
            <Text style={[styles.textWarn, { marginBottom: 20 }]}>
              Warning: you are about to send to a token contract which could
              result in a loss of funds
            </Text>
          )}
          {!validAddress && (
            <Text
              style={{ color: "red", textAlign: "center", marginBottom: 20 }}
            >
              Invalid address
            </Text>
          )}

          <SelectList
            setSelected={(val) => setAddressType(val)}
            data={addressTypeAll}
            defaultOption={{
              key: Wallet.AddressType.EthAddress,
              value: "Public Address",
            }}
            save="key"
            search={false}
            inputStyles={{
              fontFamily: textVariants["regular"],
              color: "#fff",
              fontSize: 14,
            }}
            // placeholder={"Public Address"}
            boxStyles={{
              backgroundColor: "#eaeaea63",
              borderColor: "#eaeaea63",
              borderRadius: 50,
              width: "60%",
              height: 45,
            }}
            dropdownTextStyles={{
              color: "#fff",
              fontFamily: textVariants["regular"],
              fontSize: 13,
            }}
            dropdownItemStyles={{
              borderColor: "#eaeaea63",
              // backgroundColor: "#7f848b7d",
              // borderRadius: 20,
            }}
            dropdownStyles={{
              backgroundColor: "#7f848b7d",
              borderRadius: 10,
              width: "60%",
              borderColor: "#eaeaea63",
            }}
          />
        </View>
      </View>
      <TouchableOpacity
        onPress={() => {
          transferHandler();
        }}
        style={[styles.buttonGroup, { marginTop: 60 }]}
      >
        <Button
          onPress={transferHandler}
          title="Send"
          variant="two"
          expanded
          icon="https://walletqa.guardiannft.org/home/send.svg"
        />
      </TouchableOpacity>
    </View>
  );
};
export default Transfer;
const styles = StyleSheet.create({
  centeredView: {
    // flex: 1,
    backgroundColor: "#1b0719",
    paddingTop: Platform.OS === "ios" ? 0 : 0,
  },
  dropdown: {
    height: 45,
    backgroundColor: "#d4d6db33",
    paddingHorizontal: 25,
    borderRadius: 30,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#fff",
  },
  selectedTextStyle: {
    fontSize: 14,
    borderRadius: 15,
    color: "#fff",
    fontFamily: textVariants["regular"],
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 12,
  },
  card: {
    // height: 223,
    // borderRadius: 37,
    marginVertical: 20,
    padding: 20,
    marginHorizontal: 0,
  },
  cardhearder: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardbg: {
    backgroundColor: "#ffffff4f",
    borderRadius: 37,
    padding: 10,
    height: 55,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    height: 45,
    width: 45,
    resizeMode: "contain",
    borderRadius: 25,
  },
  input: {
    height: 45,
    backgroundColor: "#eaeaea63",
    width: "50%",
    borderRadius: 50,
    paddingHorizontal: 15,
    // letterSpacing: 1,
    marginHorizontal: 5,
    fontFamily: textVariants["regular"],
    fontSize: 14,
    color: "#fff",
  },
  inputTransfer: {
    height: 45,
    backgroundColor: "#544553",
    borderRadius: 30,
    // letterSpacing: 1,
    marginHorizontal: 0,
    marginVertical: 15,
    paddingHorizontal: 25,
    fontFamily: textVariants["regular"],
    fontSize: 14,
    color: "#Fff",
  },
  selectInput: {
    backgroundColor: "red",
  },
  buttonGroup: {
    flexDirection: "row",
    margin: 20,
    marginHorizontal: 80,
  },
  transferHeading: {
    color: "#fff",
    textAlign: "center",
    fontSize: 18,
    opacity: 0.8,
    fontFamily: textVariants["regular"],
  },
  textWarn: {
    color: "#ffc107",
    textAlign: "center",
    fontSize: 14,
    opacity: 0.8,
    fontFamily: textVariants["regular"],
    marginBottom: 10,
  },
  textSuc: {
    color: "green",
    textAlign: "center",
    fontSize: 16,
    opacity: 0.8,
    marginVertical: 10,
    fontFamily: textVariants["regular"],
  },
});
