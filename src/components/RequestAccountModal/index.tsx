import React, {
  Linking,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import { SvgUri, SvgXml } from "react-native-svg";
import { globalStyles } from "../../styles/global.style";
import { AuthHeader } from "../AuthHeader";
import { Button } from "../Button";
import { Spacer } from "../Spacer";
import ConnectionManager from "@walletconnect/client";
import { textVariants, Text } from "../../components/Text";
import { LoadingIndicatorContext } from "../../App";
import { useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootState } from "../../lib/wallet-sdk/store";
import { Wallet } from "../../lib/wallet-sdk/wallet";
import { changeAccount } from "../../lib/wallet-sdk/coreSlice";
import { useAlert } from "../../hooks/useAlert";
import ShareSvg from '../../../assets/vector/share.svg'

export type Session = {
  session: string;
  name: string;
  url: string;
  icon: string;
  id: string;
};

export const RequestAccountModal = ({ modal: { closeModal, getParam } }) => {
  const { toast } = useAlert()
  const connectionManager = getParam("connectionManager") as ConnectionManager;
  const { setLoading } = useContext(LoadingIndicatorContext);
  const { wallet, networkProvider } = useSelector(
    (state: RootState) => state.coreReducer
  );
  const { walletConnectSession } = useSelector(
    (state: RootState) => state.walletConnectReducer
  );
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    getAccounts();
  }, []);

  const getAccounts = () => {
    setAvailableAccounts(wallet.getAcctAddresses());
  };

  const changeAccountHandler = async (account: string) => {
    console.log("currentWallet");
    try {
      const currentWallet =
        wallet.walletInst.wallet || wallet.walletInst.web3.eth.accounts?.wallet;
      console.log(currentWallet);
      const selectedAccount = currentWallet[account];
      wallet.changeAccount(selectedAccount);
      dispatch(changeAccount(selectedAccount));
      walletConnectSession.map((session) => {
        session.walletConnectClient.updateSession({
          ...session.walletConnectClient.session,
          accounts: [account],
        });
      });
    } catch (error) {
      console.log(error);
    }
  };

  const onApprove = async () => {
    if (selectedAddress.length === 0) {
      toast({ title: "Select account to connect" });
      return;
    }
    try {
      const address = wallet.getAccountAddress();
      if (address !== selectedAddress[0]) {
        changeAccountHandler(selectedAddress[0]);
      }
      connectionManager.approveSession({
        accounts: [selectedAddress[0]],
        chainId: Number(networkProvider.chainId),
      });
      const session: Session = {
        session: JSON.stringify(connectionManager.session),
        name: connectionManager.peerMeta.name,
        url: connectionManager.peerMeta.url,
        id: connectionManager.session.peerId,
        icon: connectionManager.peerMeta.icons[0],
      };
      const result = JSON.parse(
        (await AsyncStorage.getItem("WALLET_CONNECT_SESSION")) ?? "[]"
      ) as any[];
      result.push(session);
      await AsyncStorage.setItem(
        "WALLET_CONNECT_SESSION",
        JSON.stringify(result)
      );
      toast({
        type: "success",
        title: "Approved",
        content: "Connected to the dApp",
        position: "bottom",
      });
      console.log(closeModal);
      setTimeout(() => {
        closeModal();
        setLoading(false);
      }, 0);
    } catch (error) {}
  };

  const onReject = () => {
    try {
      connectionManager.rejectSession({ message: "User rejected the request" });
      toast({
        type: "error",
        title: "Rejected",
        content: "Connection to the dApp is rejected",
        position: "bottom",
      });
      setTimeout(() => {
        closeModal();
      }, 0);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={globalStyles.screen}>
      <AuthHeader />

      <TouchableHighlight
        onPress={() => Linking.openURL(connectionManager.session.peerMeta.url)}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text variant="regular" fontSize={16}>
            {connectionManager.session.peerMeta.url ?? ""}
          </Text>
          <SvgXml
            width={17}
            height={17}
            xml={ShareSvg}
            style={[{ marginHorizontal: 10, marginVertical: 20 }]}
          />
        </View>
      </TouchableHighlight>
      <View style={{ marginVertical: 20 }}>
        <Text textAlign="center" fontSize={22} variant="medium">
          Connect with Guardian Wallet
        </Text>
      </View>
      <View style={styles.connectionInfoContainer}>
        <Text
          textAlign="center"
          variant="regular"
          fontSize={16}
          style={{ lineHeight: 25 }}
        >
          {connectionManager.session.peerMeta.url ?? ""} {"\n"}{" "}
          <Text variant="medium" fontSize={17}>
            {" "}
            with the account
          </Text>
        </Text>
        <Spacer height={30} />
        {availableAccounts.map((address) => (
          <View key={address} style={styles.accountSelectionTile}>
            <BouncyCheckbox
              useNativeDriver
              onPress={(value) => {
                if (!selectedAddress.includes(address)) {
                  setSelectedAddress([...selectedAddress, address]);
                  console.log([...selectedAddress, address]);
                } else {
                  const filteredList = selectedAddress.filter(
                    (value) => value !== address
                  );
                  setSelectedAddress([...filteredList]);
                  console.log(filteredList);
                }
              }}
              text={Wallet.displayAddressWithEllipsis(address, 10)}
              textStyle={{
                textDecorationLine: "none",
                fontFamily: textVariants["medium"],
                color: "#fff",
              }}
              fillColor={"#da553b"}
              unfillColor={"#fff"}
            />
          </View>
        ))}
      </View>
      <Text textAlign="center" opacity={0.5} fontSize={16} variant="regular">
        Only sign message from sites you trust.
      </Text>
      <View
        style={[
          styles.actionContainer,
          { marginVertical: 30, marginHorizontal: 10 },
        ]}
      >
        <Button title="Cancel" variant="cancel" expanded onPress={onReject} />
        <Button title="Connect" variant="two" expanded onPress={onApprove} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  connectTitle: {
    textAlign: "center",
  },
  accountSelectionTile: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  connectionInfoContainer: {
    backgroundColor: "#d4d6db33",
    marginHorizontal: 16,
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginVertical: 30,
  },
});
