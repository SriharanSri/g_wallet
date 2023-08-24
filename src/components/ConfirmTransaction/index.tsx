import {
  StyleSheet,
  TouchableOpacity,
  View,
  ImageBackground,
  Image,
  TextInput,
  ScrollView,
} from "react-native";
import React, { useContext, useEffect, useRef, useState } from "react";
import { SvgUri, SvgXml } from "react-native-svg";
import { Button } from "../Button";
import { Slider } from "@miblanchard/react-native-slider";
import LinearGradient from "react-native-linear-gradient";
import { useSelector } from "react-redux";
import fromExponential from "from-exponential";
import { RootState } from "../../lib/wallet-sdk/store";
import { Wallet } from "../../lib/wallet-sdk/wallet";
import axios from "axios";
import { Text, textVariants } from "../Text";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { LoadingIndicatorContext } from "../../App";
import { useAlert } from "../../hooks/useAlert";
import Background from "../../../assets/vector/background_one.png";
import LevelSvg from "../../../assets/vector/level.svg";

enum Gas {
  low = 1,
  medium,
  high,
}

const ConfirmTransaction = ({ navigation, route }: any) => {
  const { toast } = useAlert();
  var interval = useRef<undefined | NodeJS.Timer>();
  const [toggleCheckBox, setToggleCheckBox] = useState(false);
  const { wallet, networkProvider, balance } = useSelector(
    (state: RootState) => state.coreReducer
  );
  const { metadata } = useSelector((state: RootState) => state.authReducer);
  const {
    from,
    to,
    value,
    gas,
    tokenAddress,
    data,
    asset,
    method,
    wcSession,
    transactionType,
  } = route.params;
  const { setLoading } = useContext(LoadingIndicatorContext);
  const [gasLimit, setGasLimit] = useState(21000);
  const [selectedTime, setSelectedTime] = useState<1 | 2 | 3>(1);
  const [baseTrend, setBaseTrend] = useState<"up" | "down" | "level">("level");
  const [amount, setAmount] = useState(value);
  const [priorityTrend, setPriorityTrend] = useState<"up" | "down" | "level">(
    "level"
  );
  const [price, setPrice] = useState<any>({});
  const [list, setList] = useState<any>({});
  const [maxFeePerGas, setmaxFeePerGas] = useState<number>(NaN);
  const [priorityFee, setPriorityFee] = useState<number>(1);
  const [isLegacy, setIsLegacy] = useState(false);
  const [gasPrice, setGasPrice] = useState<number>(NaN);
  const [fee, setFee] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isEnoughBalance, setIsEnoughBalance] = useState(true);
  // const [userSelected, setUserSelected] = useState<'low' | 'medium' | 'fast'>('medium')
  const userSelected = useRef<"low" | "medium" | "high">("medium");

  // console.log("in confirmation ",from, to, value, gas, tokenAddress, data)
  useEffect(() => {
    gas &&
      setGasLimit(
        Number(wallet.walletInst.web3.utils.hexToNumber(route.params.gas))
      );
    // if (selectedTime !== '') {
    getGasPrices(true, true);
    if (interval.current != null) {
      clearInterval(interval.current);
    }
    setInterval(() => {
      getGasPrices(true, false);
    }, 9000);
    // }
    console.log("value in useffect", value);
    return () => {
      console.log("in clear interval");
      clearInterval(interval.current);
    };
  }, []);

  const floorDecimal = (figure: string): string => {
    const rExp: RegExp = /\d+\.0*\d{3}/;
    let formated: RegExpExecArray | null = rExp.exec(figure);
    return formated == null ? figure : formated[0];
  };

  var timeMap: any = { "1": "low", "2": "medium", "3": "high" };

  const changeTime = ([value]: any) => {
    let type = timeMap[value];
    userSelected.current = timeMap[value];
    console.log(
      "value is",
      value,
      "type",
      type,
      price[`${type}Priority`],
      type,
      price[type]
    );

    if (type === "") return;
    setSelectedTime(value);
    setPriorityFee(Number(price[`${type}Priority`]));
    setmaxFeePerGas(price[type]);
  };

  const isDappCall = (): boolean => {
    return transactionType === "eth_sendTransaction" || false;
  };

  useEffect(() => {
    setFee(gasLimit * Number(maxFeePerGas) * 10 ** -9);
    // selectedTime && (price[`${selectedTime}Priority`]) !== '' && setPriorityFee(price[`${selectedTime}Priority`]);
  }, [gasLimit, maxFeePerGas, list, price]);

  useEffect(() => {
    console.log("fee called");
    setFee(gasLimit * Number(gasPrice) * 10 ** -9);
  }, [gasLimit, gasPrice]);

  useEffect(() => {
    let alterdFee =
      Number(gasLimit * Number(maxFeePerGas) * 10 ** -9) * 1.5 || 0;
    let total = `${Number(
      Number(
        wallet.walletInst.web3.utils.fromWei(amount?.toString() || "0", "ether")
      ) + Number(fee)
    ).toFixed(9)}`;
    let actualAmount = Number(
      wallet.walletInst.web3.utils.fromWei(amount?.toString() || "0", "ether")
    );
    console.log("total fee is", Number(fee) > Number(balance));
    if (isDappCall()) {
      if (Number(total) > Number(balance)) {
        console.log("balance not enough in dapp call");
        setIsEnoughBalance(false);
        return;
      }
    }
    if (Number(fee) > Number(balance)) {
      console.log("balance not enough");
      setIsEnoughBalance(false);
      return;
    }
    if (Number(total) > Number(balance)) {
      console.log(
        "in alterd data ****** ",
        Number(balance) - alterdFee > 0,
        Number(balance) - alterdFee,
        alterdFee
      );
      Number(balance) - alterdFee > 0
        ? setAmount(
            wallet.toCompatibleAmount((Number(balance) - alterdFee).toFixed(9))
          )
        : "";
      console.log(
        "total amount to be sent",
        balance,
        total,
        actualAmount,
        Number(balance) < Number(total),
        "new amount"
      );
    }
    setIsEnoughBalance(true);
  }, [gasLimit, balance, maxFeePerGas, fee]);

  const getGasPrices = async (isSetValue: boolean, updateTime?: boolean) => {
    try {
      // console.log("gas prices called")
      let { data: gasPrices } = await axios.get(
        `https://gas-api.metaswap.codefi.network/networks/${wallet.walletInst?.web3.utils.hexToNumber(
          networkProvider.chainId
        )}/suggestedGasFees`
      );
      setPriorityTrend(gasPrices.priorityFeeTrend);
      setBaseTrend(gasPrices.baseFeeTrend);
      // console.log("gasPrices", gasPrices.medium.suggestedMaxFeePerGas)
      setPrice({
        low: gasPrices.low.suggestedMaxFeePerGas,
        medium: gasPrices.medium.suggestedMaxFeePerGas,
        high: gasPrices.high.suggestedMaxFeePerGas,
        lowPriority: Number(gasPrices.low.suggestedMaxPriorityFeePerGas),
        mediumPriority: Number(gasPrices.medium.suggestedMaxPriorityFeePerGas),
        highPriority: Number(gasPrices.high.suggestedMaxPriorityFeePerGas),
      });
      setList({
        low: wallet.walletInst.web3.utils.fromWei(
          wallet.walletInst.web3.utils.toWei(
            gasPrices.low.suggestedMaxFeePerGas,
            "gwei"
          ),
          "ether"
        ),
        medium: wallet.walletInst.web3.utils.fromWei(
          wallet.walletInst.web3.utils.toWei(
            gasPrices.medium.suggestedMaxFeePerGas,
            "gwei"
          ),
          "ether"
        ),
        high: wallet.walletInst.web3.utils.fromWei(
          wallet.walletInst.web3.utils.toWei(
            gasPrices.high.suggestedMaxFeePerGas,
            "gwei"
          ),
          "ether"
        ),
      });
      updateTime && setSelectedTime(2);
      if (isSetValue == true) {
        console.log(
          "user selected --->",
          userSelected.current,
          gasPrices[userSelected.current]
        );
        setmaxFeePerGas(gasPrices[userSelected.current].suggestedMaxFeePerGas);
        setPriorityFee(
          gasPrices[userSelected.current].suggestedMaxPriorityFeePerGas
        );
      }
    } catch (error: any) {
      console.log("error", error);
      setIsLegacy(true);
      try {
        let baseFee = await axios.post(networkProvider.url, {
          jsonrpc: "2.0",
          id: 1,
          method: "eth_gasPrice",
          params: [],
        });
        let base = parseInt(baseFee.data.result, 16) * 10 ** -9;
        let basefee = wallet.walletInst.web3.utils.toHex(base);
        setGasPrice(parseInt(basefee));
      } catch (error) {}
    }
  };

  const performHandler = async () => {
    try {
      setLoading(true);
      console.log("handler called");
      let fParams: any = {};
      // let data = route.params;
      fParams.from = from;
      fParams.to = to;
      if (value) {
        fParams.amount = value;
      }
      fParams.gas = gas;
      fParams.tokenAddress = tokenAddress;
      fParams.data = data;
      let mxfee = String(Number(maxFeePerGas).toFixed(2));
      let mpfee = String(Number(priorityFee).toFixed(2));
      console.log(
        "before max fee calculation",
        maxFeePerGas,
        priorityFee,
        mxfee,
        mpfee
      );
      let _maxPriorityFeePerGas =
        !priorityFee === false
          ? wallet.walletInst?.stringToHex(
              wallet.walletInst?.web3.utils.toWei(mpfee, "gwei")
            )
          : undefined;
      let _maxFeePerGas =
        !maxFeePerGas === false
          ? wallet.walletInst.stringToHex(
              wallet.walletInst.web3.utils.toWei(mxfee, "gwei")
            )
          : undefined;

      console.log("fee is", _maxFeePerGas, _maxPriorityFeePerGas);
      fParams.options = {
        maxPriorityFeePerGas: isLegacy ? undefined : _maxPriorityFeePerGas,
        maxFeePerGas: isLegacy ? undefined : _maxFeePerGas,
        gasPrice: Number(gasPrice),
      };
      // return

      // if (isDappCall()) {
      //   fParams = await dappCallParams();
      // } else {
      //   fParams = await walletCallParams();
      // }
      console.log("fparams", fParams);
      // return
      await wallet.walletInst?.sendTransaction(
        fParams.from,
        fParams.to,
        fParams.amount,
        fParams.gas,
        fParams.tokenAddress,
        fParams.data,
        (data: any) => {
          console.log("success", data);
          if (wcSession) {
            wcSession(data);
          }
          setLoading(false);
          toast({
            position: "bottom",
            type: "success",
            title: "Transaction Success",
            content: data,
          });
          setTimeout(() => {
            navigation.navigate("Home", { txData: data });
          }, 1000);
        },
        (err: any) => {
          setLoading(false);
          console.log("err is", err);
          toast({
            position: "bottom",
            type: "error",
            title: "Transaction Failed",
            content: err,
          });
        },
        fParams.options
      );
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  };

  const CustomThumb = () => (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={["#d87b23", "#cb7c41", "#a77661"]}
      style={componentThumbStyles.container}
    ></LinearGradient>
  );

  const isBalanceOk = async () => {
    console.log("is balance called", isEnoughBalance, balance);
    if (!isEnoughBalance) {
      toast({
        position: "bottom",
        type: "error",
        title: "Not enough balance",
      });
      setIsConfirmed(false);
      return;
    }
    setIsConfirmed((e) => !e);
  };

  return (
    <ImageBackground
      source={Background}
      // resizeMode="cover"
      style={styles.layout}
    >
      <ScrollView style={styles.centeredView}>
        {/* <View style={{justifyContent:"center"}}>
          <View style={styles.layout}> */}

        <View
          style={{
            backgroundColor: "#7b7b7b7a",
            marginHorizontal: 10,
            borderRadius: 15,
            marginTop: 20,
          }}
        >
          <View style={[styles.padH, styles.padV]}>
            <Text variant="medium" fontSize={18}>
              Confirm Transaction
            </Text>
          </View>
          <View>
            <View style={{ backgroundColor: "#8e6e6b", paddingVertical: 15 }}>
              <View style={[styles.flexBetween, styles.padH]}>
                <View>
                  <Image
                    style={styles.transferProfile}
                    source={{
                      uri: (metadata as any).profile_image
                        ? (metadata as any).profile_image
                        : "https://walletqa.guardiannft.org/avatar.png",
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#fff",
                      fontSize: 12,
                      marginBottom: 3,
                    }}
                  >
                    {method && `Contract Interaction${method.toUpperCase()}`}
                  </Text>

                  <View
                    style={{ backgroundColor: "#474546", height: 1.5 }}
                  ></View>
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#fff",
                      fontSize: 12,
                      marginTop: 10,
                    }}
                  >
                    {networkProvider.name}
                  </Text>
                </View>
                <View>
                  <Image
                    style={styles.transferProfile}
                    source={{
                      uri: "https://walletqa.guardiannft.org/avatar.png",
                    }}
                  />
                </View>
              </View>
              <View style={[styles.flexBetween, styles.padH, { marginTop: 8 }]}>
                <Text style={styles.profileName}>
                  {Wallet.displayAddressWithEllipsis(from)}
                </Text>
                <Text style={styles.profileName}>
                  {Wallet.displayAddressWithEllipsis(to)}
                </Text>
              </View>
              <View
                style={[
                  styles.padH,
                  {
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    marginVertical: 5,
                  },
                ]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity onPress={() => setShowAdvanced((e) => !e)}>
                    <Text
                      variant="medium"
                      style={{ color: "#ffb100", marginRight: 5 }}
                    >
                      Gas
                    </Text>
                  </TouchableOpacity>
                  <SvgXml style={{ marginRight: 5 }} xml={LevelSvg} />
                </View>
              </View>
            </View>
            {/* gas */}
            {showAdvanced && isLegacy === false && (
              <View style={{ backgroundColor: "#9b999952" }}>
                <View
                  style={[styles.flexBetween, styles.padH, { marginTop: 20 }]}
                >
                  <View>
                    <Text style={styles.rangeText}>Low</Text>
                    <Text style={styles.rangeText}>
                      {floorDecimal(String(price.low))} gwei
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.rangeText}>Mid</Text>
                    <Text style={styles.rangeText}>
                      {floorDecimal(String(price.medium))} gwei
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.rangeText}>High</Text>
                    <Text style={styles.rangeText}>
                      {floorDecimal(String(price.high))} gwei
                    </Text>
                  </View>
                </View>
                <View style={[styles.padH]}>
                  <Slider
                    step={1}
                    minimumValue={1}
                    maximumValue={3}
                    value={selectedTime}
                    // animateTransitions
                    renderThumbComponent={CustomThumb}
                    trackStyle={customStyles.track}
                    onValueChange={(value) => changeTime(value)}
                  />
                </View>

                <View style={styles.padV}>
                  <View style={[styles.flexBetween, styles.padH]}>
                    <Text style={styles.gasHeading}>Gas Limit</Text>
                    <TextInput
                      style={styles.gasInput}
                      keyboardType="numeric"
                      onChangeText={(val) => setGasLimit(Number(val))}
                    >
                      {gasLimit}
                    </TextInput>
                  </View>
                  <View
                    style={[styles.flexBetween, styles.padH, { marginTop: 20 }]}
                  >
                    <Text style={styles.gasHeading}>Priority Fee</Text>
                    <View style={styles.flexBetween}>
                      <SvgXml style={{ marginRight: 5 }} xml={LevelSvg} />
                      <TextInput
                        style={styles.gasInput}
                        keyboardType="numeric"
                        onChangeText={(val) => setPriorityFee(Number(val))}
                        value={priorityFee.toString() || "0"}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}
            {showAdvanced && isLegacy === true && (
              <View style={{ backgroundColor: "#9b999952" }}>
                {/* <View style={[styles.flexBetween, styles.padH, { marginTop: 20 }]}>
                <View>
                  <Text style={styles.rangeText}>Low</Text>
                  <Text style={styles.rangeText}>{floorDecimal(String(price.low))} gwei</Text>

                </View>
                <View>
                  <Text style={styles.rangeText}>Mid</Text>
                  <Text style={styles.rangeText}>{floorDecimal(String(price.medium))} gwei</Text>

                </View>
                <View>
                  <Text style={styles.rangeText}>High</Text>
                  <Text style={styles.rangeText}>{floorDecimal(String(price.high))} gwei</Text>

                </View>
              </View> */}
                {/* <View style={[styles.padH]}>
                <Slider
                  step={1}
                  minimumValue={1}
                  maximumValue={3}
                  value={selectedTime}
                  animateTransitions
                  renderThumbComponent={CustomThumb}
                  trackStyle={customStyles.track}
                  onValueChange={(value) => changeTime(value)}
                />
              </View> */}

                <View style={styles.padV}>
                  <View style={[styles.flexBetween, styles.padH]}>
                    <Text style={styles.gasHeading}>Gas Price</Text>
                    <TextInput
                      style={styles.gasInput}
                      keyboardType="numeric"
                      onChangeText={(val) => setGasPrice(Number(val))}
                    >
                      {gasPrice}
                    </TextInput>
                  </View>
                  {/* <View style={[styles.flexBetween, styles.padH]}>
                  <Text style={styles.gasHeading}>Gas Limit</Text>
                  <TextInput style={styles.gasInput} keyboardType='numeric' onChangeText={(val) => setGasLimit(Number(val))} >{gasLimit}</TextInput>
                </View> */}
                  <View
                    style={[styles.flexBetween, styles.padH, { marginTop: 20 }]}
                  >
                    <Text style={styles.gasHeading}>Gas Limit</Text>
                    <View style={styles.flexBetween}>
                      <TextInput
                        style={styles.gasInput}
                        keyboardType="numeric"
                        onChangeText={(val) => setGasLimit(Number(val))}
                      >
                        {gasLimit}
                      </TextInput>
                    </View>
                  </View>
                </View>
              </View>
            )}
            <View
              style={[
                styles.flexBetween,
                styles.padH,
                { paddingVertical: 15, backgroundColor: "#65606447" },
              ]}
            >
              <Text style={styles.gasHeading}>Max Transaction Fee</Text>
              <View>
                <Text style={[styles.gasHeading, { textAlign: "right" }]}>
                  ~ {floorDecimal(fromExponential(fee))}
                </Text>
                <Text style={[styles.gasHeading, { textAlign: "right" }]}>
                  {networkProvider.symbol}
                </Text>
              </View>
            </View>
            <View style={styles.hrLine}></View>
            <View
              style={[
                styles.flexBetween,
                styles.padH,
                { paddingVertical: 15, backgroundColor: "#65606447" },
              ]}
            >
              <Text style={styles.gasHeading}>Amount to be Sent</Text>
              <View>
                <Text style={[styles.gasHeading, { textAlign: "right" }]}>
                  {amount
                    ? floorDecimal(
                        wallet.walletInst.web3.utils.fromWei(
                          wallet.walletInst.web3.utils.toBN(amount),
                          "ether"
                        )
                      )
                    : 0}
                </Text>
                <Text style={[styles.gasHeading, { textAlign: "right" }]}>
                  {asset}
                </Text>
              </View>
            </View>
            <View style={styles.hrLine}></View>
            <View
              style={[
                styles.flexBetween,
                styles.padH,
                { paddingVertical: 15, backgroundColor: "#65606447" },
              ]}
            >
              <Text style={styles.gasHeading}>Total</Text>
              <View style={styles.flexBetween}>
                <Text
                  style={[
                    styles.gasHeading,
                    { textAlign: "right", marginRight: 5 },
                  ]}
                >
                  ~{" "}
                  {asset === networkProvider.symbol
                    ? `${Number(
                        Number(
                          wallet.walletInst.web3.utils.fromWei(
                            amount?.toString() || "0",
                            "ether"
                          )
                        ) + Number(floorDecimal(fromExponential(fee))) || 0
                      ).toFixed(9)} ${networkProvider.symbol}`
                    : `${
                        amount
                          ? wallet.walletInst.web3.utils.fromWei(
                              wallet.walletInst.web3.utils.toBN(amount),
                              "ether"
                            )
                          : 0
                      } ${asset || ""} + ${floorDecimal(
                        fromExponential(fee)
                      )} ${networkProvider.symbol}`}
                </Text>
                {/* <Text style={[styles.gasHeading, { textAlign: "right" }]}>
                  
                </Text>
                <Text
                  style={[styles.gasHeading, { textAlign: "right" }]} 
                ></Text> */}
              </View>
            </View>
            <View
              style={[
                styles.padH,
                styles.padV,
                { flexDirection: "row", alignItems: "center" },
              ]}
            >
              <BouncyCheckbox
                fillColor={isConfirmed ? "#da553b" : "#fff"}
                unfillColor={"#fff"}
                onPress={() => isBalanceOk()}
              />

              <Text style={styles.gasHeading}>I confirm the Data Details</Text>
            </View>
          </View>
        </View>

        <View style={{ marginHorizontal: 10 }}>
          <TouchableOpacity style={[styles.buttonGroup]}>
            <Button
              onPress={() => {
                if (wcSession) {
                  wcSession(null);
                }
                navigation.navigate("Home");
              }}
              title="Reject"
              variant="cancel"
              expanded
            />
            <Button
              disabled={!isConfirmed}
              onPress={performHandler}
              title="Confirm"
              variant="two"
              expanded
            />
          </TouchableOpacity>
        </View>

        {/* </View>
          </View> */}
      </ScrollView>
    </ImageBackground>
  );
};

export default ConfirmTransaction;
const customStyles = StyleSheet.create({
  track: {
    borderRadius: 32,
    height: 25,
    backgroundColor: "#00000073",
  },
});
const componentThumbStyles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#dd7f2c",
    height: 25,
    justifyContent: "center",
    width: 25,
    borderRadius: 50,
  },
});
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    // justifyContent:"center"
  },
  image: {
    flex: 1,
    // justifyContent: 'center',
  },
  transferProfile: {
    width: 40,
    height: 40,
    borderRadius: 50,
  },
  profileName: {
    color: "#fff",
    fontFamily: textVariants["medium"],
  },
  padH: {
    paddingHorizontal: 20,
  },
  padV: {
    paddingVertical: 20,
  },
  flexBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gasInput: {
    borderColor: "#ffffff3b",
    borderWidth: 0.5,
    color: "#fff",
    borderRadius: 3,
    width: 120,
    height: 40,
    paddingHorizontal: 10,
    fontFamily: textVariants["regular"],
  },
  gasHeading: {
    fontFamily: textVariants["medium"],
  },
  hrLine: {
    backgroundColor: "#000",
    opacity: 0.5,
    width: "100%",
    height: 0.5,
  },
  checkbox: {
    borderRadius: 10,
  },
  buttonGroup: {
    flexDirection: "row",
    margin: 20,
    marginHorizontal: 0,
  },
  rangeText: {
    fontFamily: textVariants["regular"],
    textAlign: "center",
  },
  layout: {
    height: "100%",
    flex: 1,
    justifyContent: "center",
  },
  container: {
    flex: 1,
  },

  backgroundImage: {
    flex: 1,
    resizeMode: "cover", // or 'stretch',
    justifyContent: "center",
    height: "100%",
  },

  loginForm: {
    backgroundColor: "transparent",
    alignItems: "center",
  },
});
