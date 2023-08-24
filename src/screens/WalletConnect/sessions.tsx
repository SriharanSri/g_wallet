import { useEffect, useState } from "react";
import React, {
  StyleSheet,
  View,
  FlatList,
  Image,
} from "react-native";
import { Spacer } from "../../components/Spacer";
import { Text } from "../../components/Text";
import { globalStyles } from "../../styles/global.style";

import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { useModal } from "react-native-modalfy";
import { SvgUri } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "../../hooks/useAlert";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { RootState } from "../../lib/wallet-sdk/store";

export const WalletConnectSesssion = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const navigation = useNavigation()
  const { toast } = useAlert()
  const { walletConnectSession } = useSelector((state: RootState) => state.walletConnectReducer)

  useEffect(() => {
    getAllSessions();
  }, []);

  const getAllSessions = async () => {
    const sessions = JSON.parse(
      (await AsyncStorage.getItem("WALLET_CONNECT_SESSION")) ?? "[]"
    );
    setSessions([...sessions]);
  };

  const killSessionHandler = async (id: any, index: number) => {
    const findSession = walletConnectSession.find((session) => session.walletConnectClient.peerId === id)
    if (!findSession) {
      //Delete from local storage
      removeSessionFromStorage(index)
      return
    }
    await findSession.walletConnectClient.killSession()
    await removeSessionFromStorage(index)
    getAllSessions()
    toast({ title: "WalletConnect session closed" })
  }

  const removeSessionFromStorage = async (index: number) => {
    const previousSession = JSON.parse(
      (await AsyncStorage.getItem("WALLET_CONNECT_SESSION")) ?? "[]"
    ) as Array<any>;
    console.log(previousSession)
    previousSession.splice(index, 1)
    console.log(previousSession)
    await AsyncStorage.setItem("WALLET_CONNECT_SESSION", JSON.stringify(previousSession))
  }

  return (
    <View style={globalStyles.screen}>
      <View style={componentStyle.wpad}>
        <View style={componentStyle.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 30 }}>
            <SvgUri
              width={20}
              height={20}
              uri="https://walletalpha.guardianlink.io/back.svg"
            />
          </TouchableOpacity>
          <Text
            variant={"medium"}
            style={{ color: "#fff", fontSize: 16, marginLeft: 20 }}
          >
            Wallet Connect Session
          </Text>
        </View>
      </View>
      <Spacer />
      <ScrollView>
        <View style={styles.sessionListContainer}>
          {sessions.map((sessions, index) => (
            <View style={styles.sessionTile}>
              <Image
                style={{ width: 35, height: 35 }}
                source={{ uri: sessions.icon }}
              />
              <Spacer width={16} />
              <View style={{ flex: 1 }}>
                <Text variant="medium" fontSize={13}>{sessions.name}</Text>
                <Spacer height={4} />
                <Text variant="light">{sessions.url}</Text>
              </View>
              <Spacer width={16} />
              <TouchableOpacity onPress={() => {
                killSessionHandler(sessions.id, index)
              }}>
                <Text variant='light'>X</Text>
              </TouchableOpacity>
            </View>
          ))}
          <Spacer />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  walletConnectText: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButtonContainer: {
    flexDirection: "row",
  },
  sessionTile: {
    backgroundColor: "#ffffff30",
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    alignItems: 'center',
    marginHorizontal: 10,
    borderRadius: 10,
    flexDirection: "row",
  },
  sessionListContainer: {
    paddingVertical: 10,
  },
  sessionTileContainer: {
    marginTop: 10,
  },
});

const componentStyle = StyleSheet.create({
  wpad: {
    marginHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 30,
  },
});

