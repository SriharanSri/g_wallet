import {
  ImageBackground,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import React, { useContext, useState } from "react";
import bgBlur from "../../../assets/image/bgBlur.png";
import Icon from "react-native-vector-icons/FontAwesome";
import { SvgUri, SvgXml } from "react-native-svg";
import { TextInput } from "react-native-gesture-handler";
import { Button } from "../Button";
import { Auth } from "../../lib/wallet-sdk/Auth";
import { useDispatch, useSelector } from "react-redux";
import { ImportTokenFormType } from "../../lib/wallet-sdk/types/token-type";
import { RootState } from "../../lib/wallet-sdk/store";
import _ from "lodash";
import { setTokens } from "../../lib/wallet-sdk/coreSlice";
import { tokensManager } from "../../lib/wallet-sdk/storage/tokens-manager";
import { textVariants } from "../Text";
import { LoadingIndicator } from "../LoadingIndicator";
import CloseSvg from "../../../assets/vector/close.svg";

const ModalView = ({ modalVisible, modalHandle }: any) => {
  const [tokenAddress, setTokenAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { networkProvider, tokens, wallet, balance, balanceInUsd } =
    useSelector((state: RootState) => state.coreReducer);
  const [isValidTokenAddress, setIsValidTokenAddress] = useState(true);
  const [form, setForm] = useState<ImportTokenFormType>({
    tokenAddress: "",
    tokenName: "",
    tokenSymbol: "",
  });
  const [exists, setExists] = useState<boolean>(true);
  const tokenStorageKey = `${networkProvider.key}-TOKEN-${wallet.walletInst?.account?.address}`;

  // For prepopulating token info using token contract address
  const importToken = async (e: any) => {
    try {
      if (!e) return;
      setLoading(true);
      let data: any = await wallet.importToken(
        e,
        networkProvider.key,
        wallet?.walletInst?.account?.address
      );

      if (data.status) {
        setForm(data);
        setIsValidTokenAddress(true);
        setLoading(false);
        return;
      }
      setForm({});
      setIsValidTokenAddress(false);
      setLoading(false);
    } catch (error: any) {
      console.error(error);
    }
  };

  const importYourToken = async () => {
    try {
      if (form.tokenName) {
        let localTokens =
          (await tokensManager.get(wallet.getAccountAddress(), [
            wallet.networkProvider.chainId,
          ])) || [];
        let obj = {
          tokenAddress: form.tokenAddress,
          tokenBalance: form.tokenBalance,
          tokenDecimal: form.tokenDecimal,
          tokenName: form.tokenName,
          tokenPrice: "",
          tokenSymbol: form.tokenSymbol,
          tokenType: "TOKEN",
        };
        localTokens.push(obj);
        await tokensManager.set(
          wallet.getAccountAddress(),
          [wallet.networkProvider.chainId],
          localTokens
        );
        modalHandle(false);
        dispatch(setTokens(localTokens));
        setForm({});
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.centeredView}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        style={{ zIndex: 1000 }}
      >
        <View style={styles.centeredView}>
          <ImageBackground
            source={bgBlur}
            resizeMode="cover"
            style={styles.image}
          >
            <View style={styles.layout}>
              <View style={styles.layoutHeader}>
                <Text style={styles.text}>Add a New Token</Text>
                <TouchableOpacity
                  onPress={() => {
                    setForm({});
                    modalHandle(false);
                  }}
                >
                  <SvgXml
                    width={18}
                    height={18}
                    xml={CloseSvg}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.nameHolder}>
                <TextInput
                  onChangeText={(value) => {
                    setTokenAddress(value);
                    importToken(value);
                  }}
                  placeholder="Enter Token Address"
                  placeholderTextColor={"#ffffff60"}
                  style={styles.textPlace}
                />
                {!isValidTokenAddress && (
                  <Text style={{ color: "red" }}>Invalid address</Text>
                )}
                {!exists && (
                  <Text style={{ color: "red" }}>Token Already Exists</Text>
                )}
              </View>
              {loading ? (
                <ActivityIndicator color={"white"} />
              ) : (
                <>
                  <View style={styles.hrLine}></View>
                  <View style={styles.nameHolder}>
                    <TextInput
                      value={form.tokenName}
                      placeholder="Token"
                      placeholderTextColor={"#ffffff60"}
                      style={styles.textPlace}
                      editable={false}
                    />
                  </View>
                  <View style={styles.hrLine}></View>
                  <View style={styles.nameHolder}>
                    <TextInput
                      value={form.tokenSymbol}
                      placeholder="Token Symbol"
                      placeholderTextColor={"#ffffff60"}
                      style={styles.textPlace}
                      editable={false}
                    />
                  </View>
                  <View style={styles.hrLine}></View>
                  <View style={styles.nameHolder}>
                    <TextInput
                      value={form.tokenDecimal}
                      placeholder="Token Decimal"
                      placeholderTextColor={"#ffffff60"}
                      style={styles.textPlace}
                      editable={false}
                    />
                  </View>
                  <View style={styles.hrLine}></View>
                  <View style={styles.nameHolder}>
                    <TextInput
                      value={form.tokenBalance}
                      placeholder="Balance"
                      placeholderTextColor={"#ffffff60"}
                      style={styles.textPlace}
                      editable={false}
                    />
                  </View>
                </>
              )}
            </View>
            <View style={styles.buttonGroup}>
              <Button
                title="Import"
                variant="one"
                onPress={() => {
                  importYourToken();
                }}
                expanded
              />
            </View>
          </ImageBackground>
        </View>
      </Modal>
    </View>
  );
};
export default ModalView;

const styles = StyleSheet.create({
  image: {
    flex: 1,
    justifyContent: "center",
  },
  centeredView: {
    flex: 1,
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
    marginHorizontal: 60,
  },
  layout: {
    width: "90%",
    // height: "40%",
    alignSelf: "center",
    backgroundColor: "#ffffff10",
    borderRadius: 25,

    // position: "absolute",
    // opacity: 0.2,
  },
  layoutHeader: {
    backgroundColor: "#ffffff20",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 25,
    paddingHorizontal: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  nameHolder: {
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    fontFamily: textVariants["regular"],
  },
  textPlace: {
    fontSize: 14,
    letterSpacing: 3,
    color: "#fff",
    fontFamily: textVariants["regular"],
    height: 35,
    paddingVertical: 5,
  },
  hrLine: {
    backgroundColor: "#d5cbcb40",
    opacity: 0.3,
    height: 1,
  },
});
