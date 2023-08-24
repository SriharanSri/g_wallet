import { useContext, useEffect, useState } from "react";
import {
  Linking,
  StyleSheet,
  TextInput,
  TouchableHighlight,
  View,
} from "react-native";
import React, { ScrollView } from "react-native-gesture-handler";
import { SvgUri, SvgXml } from "react-native-svg";
import { useSelector } from "react-redux";
import ConnectionManager from "@walletconnect/client";
import { LoadingIndicatorContext } from "../../App";
import { RootState } from "../../lib/wallet-sdk/store";
import { WalletConnectRequest } from "../../lib/WalletConnect";
import { globalStyles } from "../../styles/global.style";
import { AuthHeader } from "../AuthHeader";
import { Button } from "../Button";
import { Session } from "../RequestAccountModal";
import { Spacer } from "../Spacer";
import { Text } from "../../components/Text";
import Web3 from "web3";
import { signTypedData_v4 } from "eth-sig-util";
import { useAlert } from "../../hooks/useAlert";
import ShareSvg from "../../../assets/vector/share.svg";

export const SignMessageModal = ({ modal: { closeModal, getParam } }) => {
  const { toast } = useAlert()
  const { setLoading } = useContext(LoadingIndicatorContext);
  const { wallet } = useSelector((state: RootState) => state.coreReducer);
  const [message, setMessage] = useState("");
  const connectionManager = getParam("connectionManager") as ConnectionManager;
  const request = getParam("request") as WalletConnectRequest;
  const session = getParam("session") as Session;

  const onApprove = async () => {
    try {
      const pk = (await wallet.getPkey()).replace("0x", "");
      const pkBuffer = Buffer.from(
        (await wallet.getPkey()).replace("0x", ""),
        "hex"
      );
      console.log("SIGN METHOD =====>", request.method);
      if (request.method.includes("eth_signTypedData")) {
        const signature = signTypedData_v4(pkBuffer, {
          data: JSON.parse(request.params[1]),
        });
        connectionManager.approveRequest({
          id: request.id,
          result: signature,
          jsonrpc: request.jsonrpc,
        });
        toast({
          type: "success",
          title: "Approved",
          content: "Message signed",
          position: "bottom",
        });
        setTimeout(() => {
          setLoading(false);
          closeModal();
        }, 100);
        return;
      }

      if (request.method === "personal_sign") {
        const signature = await wallet.signMessage(request.params[0]);
        console.log("SIGNATURE ====>", signature);
        connectionManager.approveRequest({ id: request.id, result: signature });
        toast({
          type: "success",
          title: "Approved",
          content: "Message signed",
          position: "bottom",
        });
        setTimeout(() => {
          setLoading(false);
          closeModal();
        }, 2000);
        return;
      }
      const signature = await wallet.signEthMessage(request.params[0]);
      console.log("SIGNATURE ====>", signature);
      connectionManager.approveRequest({ id: request.id, result: signature });
      toast({
        type: "success",
        title: "Approved",
        content: "Message signed",
        position: "bottom",
      });
      setTimeout(() => {
        setLoading(false);
        closeModal();
      }, 0);
      return;
    } catch (error) {
      toast({
        type: "error",
        title: "Error Occured",
        content: "Error Occure while signing message",
        position: "bottom",
      });
      setTimeout(() => {
        closeModal();
      }, 2000);
      console.error(error);
    }
  };

  const onReject = () => {
    try {
      connectionManager.rejectRequest({
        id: request.id,
        error: { message: "USER Rejected the request" },
      });
      toast({
        type: "error",
        title: "Rejected",
        content: "Request rejected by the user",
        position: "bottom",
      });
      setTimeout(() => {
        closeModal();
      }, 100);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    try {
      if (request.method === "personal_sign") {
        const readableMessage = Web3.utils.hexToAscii(request.params[0]);
        setMessage(readableMessage);
        return;
      }
      if (request.method === "eth_signTypedData") {
        setMessage(request.params[1]);
        return;
      }
      const readableMessage = Web3.utils.hexToAscii(request.params[1]);
      setMessage(readableMessage);
    } catch (error) {
      setMessage(request.params[0]);
    }
  }, []);

  return (
    <ScrollView style={globalStyles.screen}>
      <AuthHeader />
      <Spacer height={20} />
      <TouchableHighlight
        onPress={() => {
          Linking.openURL(connectionManager.session.peerMeta.url ?? "");
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text variant="regular" fontSize={16}>{connectionManager.session.peerMeta.url ?? ""}</Text>
          <SvgXml
            width={17}
            height={17}
            xml={ShareSvg}
            style={[{ marginHorizontal: 10, marginVertical: 20 }]}
          />
        </View>
      </TouchableHighlight>
      <Text textAlign="center" fontSize={22} variant="medium">
        You're signing
      </Text>
      {/* {console.log("EREQUESTEDJFHHDK ===>", request.method)} */}
      {request.method.includes("eth_signTypedData") ? <View>
        <TextInput
          editable={false}
          style={styles.textArea}
          underlineColorAndroid="transparent"
          placeholder="Type something"
          placeholderTextColor="grey"
          numberOfLines={5}
          multiline={true}
          value={message}
        />
      </View> : <View style={styles.connectionInfoContainer}>
        <Text variant="medium" style={{ lineHeight: 23 }}>{message}</Text>
      </View>}

      <Text textAlign="center" opacity={0.5} fontSize={16} variant="regular" >Only sign message from sites you trust.</Text>
      <View style={[styles.actionContainer, { marginVertical: 20, marginHorizontal: 10 }]}>
        <Button title="Cancel" variant="cancel" expanded onPress={onReject} />
        <Button title="Sign" variant="two" expanded onPress={onApprove} />
        {/* <Button title="REJECT" onPress={onReject} />
                <Button title="SIGN" onPress={onApprove} /> */}
      </View>
      <Spacer height={50} />
    </ScrollView>
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
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  connectionInfoContainer: {
    backgroundColor: "#d4d6db33",
    marginHorizontal: 10,
    marginVertical: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 30,
  },
  textArea: {
    color: "#fff",
    backgroundColor: "transparent",
    marginHorizontal: 20,
    borderColor: "#fff",
    borderWidth: 0.3,
    marginVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
});
