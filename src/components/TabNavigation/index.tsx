import {
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useContext, useEffect, useState } from "react";
import TabSelectorAnimation from "../../screens/home/tabNavigation";
import { Wallet } from "../../lib/wallet-sdk/wallet";
import { ImportCollectibleFormType } from "../../lib/wallet-sdk/types/collectible-type";
import { setCollectibles, setTokens } from "../../lib/wallet-sdk/coreSlice";
import { EthereumWallet } from "../../lib/wallet-sdk/EthereumWallet";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../lib/wallet-sdk/store";
import { ImportTokenFormType } from "../../lib/wallet-sdk/types/token-type";
import { FlatList } from "react-native-gesture-handler";
import { Svg, SvgUri, SvgXml } from "react-native-svg";
import png from "../../../assets/image/nft_not_found.png";
import ModalView from "../ImportToken";
import { Text, textVariants } from "../Text";
import { tokensManager } from "../../lib/wallet-sdk/storage/tokens-manager";
import _ from "lodash";
import { LoadingIndicatorContext } from "../../App";
import { Button } from "../Button";
import ShareSvg from "../../../assets/vector/share.svg";
import CloseSvg from "../../../assets/vector/close.svg";
import DownSvg from "../../../assets/vector/down.svg";
import UpSvg from "../../../assets/vector/up.svg";

const TabNavigation = ({ data, refreshing, setRefreshing }: any) => {
  const DATA = [
    { title: "Activity" },
    { title: "Tokens" },
    { title: "Collectibles" },
  ];
  const { wallet, collectibles, networkProvider, tokens, balance } =
    useSelector((state: RootState) => state.coreReducer);
  const { loading, setLoading } = useContext(LoadingIndicatorContext);
  const [indexTab, setIndexTab] = useState(0);
  const dispatch = useDispatch();
  const [list, setList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [modalVisibleTransfer, setModalVisibleTransfer] = useState(false);
  const [refreshingCollectibles, setRefreshingCollectibles] = useState(true);
  const [refreshingTokens, setRefreshingTokens] = useState(true);
  const [refreshingActivity, setRefreshingActivity] = useState(true);
  const [importTokens, setImportTokens] = useState([]);
  const [tokenAddress, setTokenAddress] = useState("");

  const modalHandle = (open: boolean) => {
    setModalVisible(open);
  };
  const modalHandleTransfer = (open: boolean) => {
    setModalVisibleTransfer(open);
  };

  const onChangeTab = (index: number) => {
    setIndexTab(index);

    if (index == 0) getActivity();
    if (index == 1) getTokens();
    if (index == 2) getNft();
  };

  useEffect(() => {
    refreshData();
  }, [balance]);

  const refreshData = async () => {
    await onRefreshActivity();
    await onRefreshCollectibles();
    await onRefreshTokens();
  };

  useEffect(() => {
    console.log("Reloading site");
    if (refreshing) {
      refreshData();
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    refreshData();
  }, [networkProvider, wallet.walletInst?.account]);

  useEffect(() => {
    importedTokens();
    setTimeout(() => {
      getLocalActivity();
    }, 1000);
  }, [
    wallet,
    wallet.walletInst,
    wallet.walletInst?.account,
    data,
    balance,
    tokens,
  ]);

  const getNft = async () => {
    let allNft: ImportCollectibleFormType[] | any = await wallet.getAllNFT(
      wallet.getAccountAddress(),
      false
    );
    console.log("allNfy", allNft);
    dispatch(setCollectibles(allNft));
    setRefreshingCollectibles(false);
    if (allNft.length === 0) {
      onRefreshCollectibles();
    }
  };

  const getTokens = async () => {
    let allTokens: ImportTokenFormType[] | any = await wallet.getAllTokens(
      wallet.getAccountAddress(),
      false
    );
    dispatch(setTokens(allTokens));
    setRefreshingTokens(false);
    if (allTokens.length === 0) {
      onRefreshTokens();
    }
  };

  const getLocalActivity = async () => {
    try {
      let data: any = await wallet.getActivityFromStorage();
      setList([...data.reverse()]);
    } catch (error) {
      console.log("error", error);
    }
  };

  const getActivity = async () => {
    try {
      // console.log("started");
      setRefreshingActivity(false);
      let data: any = await wallet.getActivities(false);
      setList([...data.reverse()]);
      if (data.length === 0) {
        onRefreshActivity();
      }
      setRefreshingActivity(false);
    } catch (error) {
      console.log("error", error);
    }
  };

  const onRefreshActivity = React.useCallback(async () => {
    setRefreshingActivity(true);
    let data: any = (await wallet.getActivities(true)) || [];
    setList([...data.reverse()]);
    setRefreshingActivity(false);
  }, [refreshingActivity]);

  const onRefreshCollectibles = React.useCallback(async () => {
    setRefreshingCollectibles(true);
    let allNft: ImportCollectibleFormType[] | any =
      (await wallet.getAllNFT(wallet.getAccountAddress(), true)) || [];
    if (allNft) {
      dispatch(setCollectibles(allNft));
      setRefreshingCollectibles(false);
    }
    setRefreshingCollectibles(false);
  }, [refreshingCollectibles]);

  const onRefreshTokens = React.useCallback(async () => {
    setRefreshingTokens(true);
    let allTokens: ImportTokenFormType[] | any =
      (await wallet.getAllTokens(wallet.getAccountAddress(), true)) || [];
    if (allTokens) {
      dispatch(setTokens(allTokens));
      setRefreshingTokens(false);
    }
    setRefreshingTokens(false);
  }, [refreshingTokens]);

  const importedTokens = async () => {
    let localTokens: any = await tokensManager.get(wallet.getAccountAddress(), [
      wallet.networkProvider.chainId,
    ]);
    let moralisTokens: any = await wallet.walletInst.getAllTokens(
      wallet.getAccountAddress()
    );
    var importTokens = _.differenceBy(
      localTokens,
      moralisTokens,
      "tokenAddress"
    );
    setImportTokens(importTokens);
  };

  const onCloseImportToken = async (tokenAddress) => {
    setLoading(true);
    setDeleteModalVisible(false);
    let localTokens = await tokensManager.get(wallet.getAccountAddress(), [
      wallet.networkProvider.chainId,
    ]);
    localTokens = localTokens.filter(function (item) {
      return item.tokenAddress !== tokenAddress;
    });
    await tokensManager.set(
      wallet.getAccountAddress(),
      [wallet.networkProvider.chainId],
      localTokens
    );
    setLoading(false);
    dispatch(setTokens(localTokens));
  };

  const floorDecimal = (figure: string): string => {
    const rExp: RegExp = /\d+\.0*\d{3}/;
    let formated: RegExpExecArray | null = rExp.exec(figure);
    let data = formated == null ? figure : formated[0];
    if (data.length > 8) {
      return Number.parseFloat(data).toExponential(2);
    }
    return data;
  };

  return (
    <View style={styles.wrapperAll}>
      <TabSelectorAnimation
        onChangeTab={onChangeTab}
        style={styles.tabSelector}
        tabs={DATA}
      />
      {indexTab === 0 && (
        <>
          {/* <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshingActivity}
                onRefresh={onRefreshActivity}
                tintColor={"#fff"}
              />
            }
            style={styles.wrapperAll}
          > */}
          <View style={styles.tabArea}>
            {list && list.length > 0 ? (
              list.map((item, index) => {
                return (
                  <View key={index}>
                    {index !== 0 && (
                      <View
                        style={{
                          backgroundColor: "#ffffff52",
                          height: 1,
                          width: "100%",
                          opacity: 0.5,
                          marginVertical: 0,
                        }}
                      ></View>
                    )}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flex: 1,
                        paddingHorizontal: 10,
                        paddingVertical: 15,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginRight: 8,
                          }}
                        >
                          {wallet.walletInst.web3.utils.toChecksumAddress(
                            item.from
                          ) === wallet.getAccountAddress() && (
                            <SvgXml width={14} height={14} xml={UpSvg} />
                          )}
                          {wallet.walletInst.web3.utils.toChecksumAddress(
                            item?.to
                          ) === wallet.getAccountAddress() && (
                            <SvgXml width={14} height={14} xml={DownSvg} />
                          )}
                        </View>
                        <View>
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "bold",
                              marginBottom: 10,
                            }}
                          >
                            {Wallet.displayAddressWithEllipsis(item.hash)}{" "}
                            {item.hash ? (
                              <Text
                                onPress={() => {
                                  Linking.openURL(
                                    `${wallet.networkProvider.explorerUrl}tx/${item.hash}`
                                  );
                                }}
                              >
                                <SvgXml
                                  height={"13"}
                                  xml={ShareSvg}
                                  style={[{ marginHorizontal: 17 }]}
                                />
                              </Text>
                            ) : (
                              <Text>Transaction failed</Text>
                            )}
                          </Text>
                          <Text style={{ color: "#BEC0C4" }} fontSize={10}>
                            {`${new Date(
                              parseInt(item.timeStamp) * 1000
                            ).toDateString()}`}{" "}
                            {new Date(
                              parseInt(item.timeStamp) * 1000
                            ).toLocaleTimeString()}
                          </Text>
                        </View>
                      </View>

                      <View>
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "bold",
                            marginBottom: 10,
                          }}
                        >
                          {floorDecimal(
                            wallet.walletInst.web3.utils
                              ?.fromWei(
                                item?.value?.toString() ||
                                  "0000000000000000000",
                                "ether"
                              )
                              .toString()
                          )}{" "}
                          {item.symbol ? item.symbol : networkProvider.symbol}
                        </Text>
                        {(item.status == "pending" ||
                          item.txreceipt_status == 2) && (
                          <Text
                            style={{ color: "yellow" }}
                            fontSize={10}
                            textAlign={"right"}
                          >
                            Pending
                          </Text>
                        )}
                        {(item.status == "success" ||
                          item.txreceipt_status == 1) && (
                          <Text
                            style={{ color: "green" }}
                            fontSize={10}
                            textAlign={"right"}
                          >
                            Success
                          </Text>
                        )}
                        {(item.status == "rejected" ||
                          item.txreceipt_status == 0) && (
                          <Text
                            style={{ color: "red" }}
                            fontSize={10}
                            textAlign={"right"}
                          >
                            Rejected
                          </Text>
                        )}
                        {item.status == "failed" && (
                          <Text
                            style={{ color: "red" }}
                            fontSize={10}
                            textAlign={"right"}
                          >
                            Failure
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View>
                <Text variant="light" fontSize={12} textAlign="center">
                  No Activity Data
                </Text>
              </View>
            )}
          </View>
          {/* </ScrollView> */}
        </>
      )}
      {indexTab === 1 && (
        <>
          {/* <ScrollView
            refreshControl={
              <RefreshControl
                tintColor={"#fff"}
                refreshing={refreshingTokens}
                onRefresh={onRefreshTokens}
              />
            }
            style={styles.wrapperAll}
          > */}
          <View style={styles.tabArea}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                flex: 1,
                paddingHorizontal: 25,
                paddingVertical: 15,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <View>
                  <Text
                    variant="medium"
                    fontSize={13}
                    style={{ marginBottom: 5 }}
                  >
                    {networkProvider.name}
                  </Text>
                  <Text variant="regular" fontSize={12} color={"#BEC0C4"}>
                    {networkProvider.symbol}
                  </Text>
                </View>
              </View>
              <View>
                <Text
                  variant="medium"
                  fontSize={13}
                  textAlign={"right"}
                  style={{ marginBottom: 5 }}
                >
                  {floorDecimal(balance.toString())} {networkProvider.symbol}
                </Text>
                <Text
                  variant="regular"
                  fontSize={12}
                  color={"#BEC0C4"}
                  textAlign={"right"}
                >
                  {Wallet.displayAddressWithEllipsis(
                    wallet.getAccountAddress()
                  )}
                </Text>
              </View>
            </View>
            {tokens &&
              tokens.length > 0 &&
              tokens.map((item, index) => {
                return (
                  <View key={index}>
                    <View
                      style={{
                        backgroundColor: "#ffffff52",
                        height: 1,
                        width: "100%",
                        opacity: 0.5,
                        marginVertical: 0,
                      }}
                    ></View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flex: 1,
                        paddingHorizontal: 25,
                        paddingVertical: 10,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <View>
                          <Text
                            style={{
                              color: "#fff",
                              fontWeight: "bold",
                              marginBottom: 5,
                            }}
                          >
                            {item.tokenName}{" "}
                            <Text
                              onPress={() => {
                                Linking.openURL(
                                  `${wallet.networkProvider.explorerUrl}token/${item.tokenAddress}`
                                );
                              }}
                            >
                              <SvgXml
                                height={"13"}
                                xml={ShareSvg}
                                style={[{ marginHorizontal: 17 }]}
                              />
                            </Text>
                          </Text>
                          <Text
                            style={{ color: "#BEC0C4" }}
                            fontSize={12}
                            variant="regular"
                          >
                            {item.tokenSymbol}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <View
                        // style={{ flexDirection: "row", alignItems: "center" }}
                        >
                          <Text
                            style={{
                              textAlign: "right",
                              color: "#fff",
                              fontWeight: "bold",
                              marginBottom: 5,
                            }}
                          >
                            {floorDecimal(
                              (item.tokenBalance / item.tokenDecimal).toString()
                            )}{" "}
                            {item.tokenSymbol}
                          </Text>
                          <Text
                            style={{ textAlign: "right", color: "#BEC0C4" }}
                            fontSize={12}
                            variant="regular"
                          >
                            {Wallet.displayAddressWithEllipsis(
                              item.tokenAddress
                            )}
                          </Text>
                        </View>
                        {importTokens &&
                          importTokens.map((data, index) => {
                            return (
                              item.tokenAddress === data.tokenAddress && (
                                <View key={index}>
                                  {/* <Text
                                    style={{
                                      marginBottom: 5,
                                    }}
                                  ></Text> */}
                                  <View style={{ marginLeft: 20 }}>
                                    <TouchableOpacity
                                      onPress={() => {
                                        setDeleteModalVisible(true);
                                        setTokenAddress(data.tokenAddress);
                                      }}
                                    >
                                      <SvgXml
                                        width={10}
                                        height={10}
                                        xml={CloseSvg}
                                      />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              )
                            );
                          })}
                      </View>
                    </View>
                  </View>
                );
              })}
          </View>
          <View>
            <Text
              variant="medium"
              style={{ textAlign: "center", marginBottom: 3 }}
            >
              Don’t see your Token?
            </Text>
            <TouchableOpacity style={{}} onPress={() => modalHandle(true)}>
              <Text variant="medium" color="#d6402c" textAlign="center">
                {" "}
                Import Tokens
              </Text>
            </TouchableOpacity>
            <ModalView modalVisible={modalVisible} modalHandle={modalHandle} />
          </View>
          {/* </ScrollView> */}
        </>
      )}
      {indexTab === 2 && (
        <>
          {/* <ScrollView
            refreshControl={
              <RefreshControl
                tintColor={"#fff"}
                refreshing={refreshingCollectibles}
                onRefresh={onRefreshCollectibles}
              />
            }
            style={styles.wrapperAll}
          > */}
          <View style={styles.tabArea}>
            {collectibles && collectibles.length > 0 ? (
              collectibles.map((item, index) => {
                return (
                  <View key={index}>
                    {index !== 0 && (
                      <View
                        style={{
                          backgroundColor: "#ffffff52",
                          height: 1,
                          width: "100%",
                          opacity: 0.5,
                          marginVertical: 0,
                        }}
                      ></View>
                    )}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flex: 1,
                        paddingHorizontal: 25,
                        paddingVertical: 2,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <View>
                          <View style={{ marginVertical: 10 }}>
                            {item.tokenImage.includes("nft_not_found") ? (
                              <Image
                                source={png}
                                style={{
                                  width: 100,
                                  height: 100,
                                  borderRadius: 10,
                                }}
                              />
                            ) : (
                              <Image
                                source={{
                                  uri:
                                    item.tokenImage.includes(
                                      "https://ipfs.io/"
                                    ) ||
                                    item.tokenImage.includes(
                                      "/nft_not_found.png"
                                    )
                                      ? item.tokenImage
                                      : `https://ipfs.io/${item.tokenImage.replace(
                                          "://",
                                          "/"
                                        )}`,
                                }}
                                style={{
                                  width: 100,
                                  height: 100,
                                  borderRadius: 10,
                                }}
                              />
                            )}
                          </View>
                        </View>
                      </View>

                      <View>
                        <Text
                          style={{
                            textAlign: "right",
                            color: "#fff",
                            fontWeight: "bold",
                            marginBottom: 5,
                          }}
                        >
                          {item.tokenName}{" "}
                          <Text
                            onPress={() => {
                              return Linking.openURL(
                                `${wallet.networkProvider.explorerUrl}token/${item.tokenAddress}`
                              );
                            }}
                          >
                            <SvgXml
                              height={"13"}
                              xml={ShareSvg}
                              style={[{ marginHorizontal: 17 }]}
                            />
                          </Text>
                        </Text>
                        <Text style={{ textAlign: "right", color: "#BEC0C4" }}>
                          {Wallet.displayAddressWithEllipsis(item.tokenAddress)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View>
                <Text variant="light" fontSize={12} textAlign="center">
                  No Collectibles In Your Wallet
                </Text>
              </View>
            )}
          </View>
          {/* <View style={styles.tabArea}>
            {collectibles && collectibles.length > 0 ? (
              <FlatList
                data={collectibles}
                renderItem={({ item, index }) => {
                  return (
                    <>
                      {index !== 0 && (
                        <View
                          style={{
                            backgroundColor: "#ffffff52",
                            height: 1,
                            width: "100%",
                            opacity: 0.5,
                            marginVertical: 0,
                          }}
                        ></View>
                      )}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flex: 1,
                          paddingHorizontal: 25,
                          paddingVertical: 2,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <View>
                            <View style={{ marginVertical: 10 }}>
                              {item.tokenImage.includes("nft_not_found") ? (
                                <Image
                                  source={png}
                                  style={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: 10,
                                  }}
                                />
                              ) : (
                                <Image
                                  source={{
                                    uri:
                                      item.tokenImage.includes(
                                        "https://ipfs.io/"
                                      ) ||
                                        item.tokenImage.includes(
                                          "/nft_not_found.png"
                                        )
                                        ? item.tokenImage
                                        : `https://ipfs.io/${item.tokenImage.replace(
                                          "://",
                                          "/"
                                        )}`,
                                  }}
                                  style={{
                                    width: 100,
                                    height: 100,
                                    borderRadius: 10,
                                  }}
                                />
                              )}
                            </View>
                          </View>
                        </View>

                        <View>
                          <Text
                            style={{
                              textAlign: "right",
                              color: "#fff",
                              fontWeight: "bold",
                              marginBottom: 5,
                            }}
                          >
                            {item.tokenName}{" "}
                            <Text
                              onPress={() => {
                                return Linking.openURL(
                                  `${wallet.networkProvider.explorerUrl}token/${item.tokenAddress}`
                                );
                              }}
                            >
                              <SvgUri
                                height={"13"}
                                uri="https://walletqa.guardiannft.org/home/share.svg"
                                style={[{ marginHorizontal: 17 }]}
                              />
                            </Text>
                          </Text>
                          <Text
                            style={{ textAlign: "right", color: "#BEC0C4" }}
                          >
                            {Wallet.displayAddressWithEllipsis(
                              item.tokenAddress
                            )}
                          </Text>
                        </View>
                      </View>
                    </>
                  );
                }}
              />
            ) : (
              // <View style={styles.tabArea}>
              <Text variant="light" fontSize={12} textAlign="center">
                No Collectibles In Your Wallet
              </Text>
              // </View>
            )}
          </View> */}
          {/* </ScrollView> */}
        </>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>
              Do you really want to delete this token?
            </Text>
            <View style={{ flexDirection: "row" }}>
              <Button
                title="No"
                variant="two"
                expanded
                onPress={() => setDeleteModalVisible(false)}
              />
              <Button
                title="Yes"
                variant="red"
                expanded
                onPress={() => {
                  onCloseImportToken(tokenAddress);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* <Text style={styles.text}>{`Current tab is ${indexTab + 1}`}</Text> */}
    </View>
  );
};

export default TabNavigation;

const styles = StyleSheet.create({
  wpad: {
    marginHorizontal: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    // alignItems: "center",
  },
  modalView: {
    margin: 20,
    backgroundColor: "#1b0719",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    marginTop: 40,
    textAlign: "center",
  },
  tabArea: {
    backgroundColor: "#d4d6db33",
    minHeight: 60,
    width: "95%",
    margin: 10,
    borderRadius: 25,
    justifyContent: "center",
  },
  wrapperAll: {
    flex: 1,
    marginTop: 0,
    // alignItems: "center",
    // justifyContent: "center",
  },
  addContact: {
    // backgroundColor: "#6b5969",
    width: 100,
    // height: 40,
    // borderRadius: 40,
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 100,
  },

  tabSelector: {
    marginHorizontal: 12,
    height: 45,
  },
  Menu: {
    color: "red",
    margin: 0,
  },
});
