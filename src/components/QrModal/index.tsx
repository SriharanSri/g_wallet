import {
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React from "react";
import Icon from "react-native-vector-icons/AntDesign";
import Icon1 from "react-native-vector-icons/Feather";
import QRCode from "react-qr-code";
import { Wallet } from "../../lib/wallet-sdk/wallet";
import { useSelector } from "react-redux";
import { RootState } from "../../lib/wallet-sdk/store";
import Clipboard from "@react-native-clipboard/clipboard";
import bgBlur from "../../../assets/image/bgBlur.png";
import { Spacer } from "../Spacer";
import { useAlert } from "../../hooks/useAlert";
import Toast from "react-native-toast-message";

const QrModal = ({ qrVisible, qrModalHandle, address }: any) => {
  const { toast } = useAlert();
  const { wallet } = useSelector((state: RootState) => state.coreReducer);
  const copyToClipboard = () => {
    Clipboard.setString(wallet.getAccountAddress());
    toast({
      position: "bottom",
      type: "success",
      title: "Address Copied",
    });
  };
  return (
    <ScrollView>
      <Modal animationType="slide" transparent={false} visible={qrVisible}>
        <View style={styles.centeredView}>
          <View style={styles.layout}>
            <ImageBackground
              source={bgBlur}
              // resizeMode="cover"
              style={styles.layout}
            >
              <View
                style={{
                  backgroundColor: "#eaeaea12",
                  borderRadius: 15,
                  marginHorizontal: 20,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    qrModalHandle(false);
                  }}
                  style={{ alignSelf: "flex-end", padding: 10 }}
                >
                  <Icon name="close" size={25} color="#fff" />
                </TouchableOpacity>
                <View
                  style={{ alignItems: "center", justifyContent: "center" }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 7,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "bold",
                        fontSize: 18,
                        marginRight: 10,
                      }}
                    >
                      {Wallet.displayAddressWithEllipsis(
                        address ?? wallet.getAccountAddress()
                      )}
                    </Text>
                    <TouchableOpacity
                      onPress={copyToClipboard}
                      style={{
                        backgroundColor: "#fff",
                        height: 25,
                        width: 25,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 5,
                      }}
                    >
                      <Icon1 name="copy" size={15} color="#000" />
                    </TouchableOpacity>
                  </View>
                  <Spacer height={5} />
                  <QRCode
                    size={180}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    value={address ?? wallet.walletInst?.account?.address}
                    viewBox={`0 0 256 256`}
                  />
                  <Spacer height={20} />
                </View>
              </View>
            </ImageBackground>
          </View>
        </View>
        <Toast />
      </Modal>
    </ScrollView>
  );
};
export default QrModal;

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
  },
  layout: {
    height: "100%",
    flex: 1,
    justifyContent: "center",
  },
});
