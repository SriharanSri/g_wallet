import React, { Button, StyleSheet, View } from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import ConnectionManager from "@walletconnect/client";
import { globalStyles } from "../../styles/global.style";
import { AuthHeader } from "../AuthHeader";
import { Spacer } from "../Spacer";
import { Text } from "../Text";
import Web3 from "web3";
import { WalletConnectRequest } from "../../lib/WalletConnect";
import { useAlert } from "../../hooks/useAlert";

export const SendTransactionModal = ({ modal: { closeModal, getParam } }) => {
  const { toast } = useAlert()
  const connectionManager = getParam("connectionManager") as ConnectionManager;
  const request = getParam("request") as WalletConnectRequest;

  const onApprove = async () => {
    try {
      const web3 = new Web3(
        "https://goerli.infura.io/v3/2ff47e51ff1f4804865ba892c7efc70c"
      );
      const account = web3.eth.accounts.privateKeyToAccount(
        "7f3d1b7551fbeeaa2c456da470fca3e6b39be7a6aafea99bd2cde43f5efaaaeb"
      );
      const tx = await web3.eth.accounts.signTransaction(
        request.params[0],
        account.privateKey
      );
      const transactionResult = await web3.eth.sendSignedTransaction(
        tx.rawTransaction
      );
      connectionManager.approveRequest({
        id: request.id,
        jsonrpc: request.jsonrpc,
        result: transactionResult.transactionHash,
      });
      toast({
        type: "success",
        title: "Approved",
        content: "Trasaction approved",
        position: "bottom",
      });
      setTimeout(() => {
        closeModal();
      }, 2000);
    } catch (error) {
      toast({
        type: "error",
        title: "Error Occured",
        content: "Error occured while sending transaction",
        position: "bottom",
      });
      setTimeout(() => {
        closeModal();
      }, 2000);
      console.error(error);
    }
  };

  const onReject = async () => {
    try {
      connectionManager.rejectRequest({
        id: request.id,
        jsonrpc: request.jsonrpc,
        error: { message: "Request rejected by user" },
      });
      toast({
        type: "error",
        title: "Rejected",
        content: "Request rejected by user",
        position: "bottom",
      });
      setTimeout(() => {
        closeModal();
      }, 2000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={globalStyles.screen}>
      <AuthHeader />
      <Spacer />
      <Text textAlign="center" fontSize={18}>
        Confirm Transaction
      </Text>
      <Spacer height={30} />
      <View style={styles.connectionInfoContainer}>
        <Text textAlign="center" fontSize={18}>
          https://metamask.github.io with the account
        </Text>
        <Spacer height={40} />
        <View style={styles.accountSelectionTile}>
          <BouncyCheckbox />
          <Text textAlign="center" fontSize={18}>
            0X989EB5F3D...75818368FF0
          </Text>
        </View>
      </View>
      <Spacer />
      <Text textAlign="center" opacity={0.5} fontSize={18}>
        Only connect with sites you trust.
      </Text>
      <Spacer height={20} />
      <View style={styles.actionContainer}>
        <Button title="REJECT" onPress={onReject} />
        <Button title="APPROVE" onPress={onApprove} />
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
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  connectionInfoContainer: {
    backgroundColor: "#d4d6db33",
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginTop: 50,
  },
});
