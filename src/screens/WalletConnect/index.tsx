import { useContext, useEffect, useRef, useState } from "react";
import React, {
  PermissionsAndroid,
  DeviceEventEmitter,
  Platform,
  Image,
  Linking,
  AppState,
} from "react-native";
import { WalletConnect } from "../../lib/WalletConnect";
import { useModal } from "react-native-modalfy";
import { NativeModules } from "react-native";
import { LoadingIndicatorContext } from "../../App";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../lib/wallet-sdk/store";
import { Session } from "../../components/RequestAccountModal";
import WcLogo from "../../../assets/image/wallet_connect.png";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { addSession } from "../../lib/wallet-sdk/walletConnectSlice";
import { useWalletConnect } from "../../hooks/useWalletConnect";
import { useAlert } from "../../hooks/useAlert";

const { QrModule } = NativeModules;

let walletConnect: WalletConnect;
export const WalletConnectScreen = () => {
  const { loading, setLoading } = useContext(LoadingIndicatorContext);
  const { wallet, networkProvider } = useSelector(
    (state: RootState) => state.coreReducer
  );
  const modal = useModal();
  const [uri, setUri] = useState("");
  const [connections, setConnections] = useState<WalletConnect[]>([]);
  const navigation: any = useNavigation();
  const dispatch = useDispatch();
  const { restoreSession } = useWalletConnect();
  const mounted = useRef(false);
  const appState = useRef(AppState.currentState);
  const { toast } = useAlert()


  useEffect(() => {
    Linking.getInitialURL().then((value) => {
      // console.log(value);
      if (value !== null) {
        setUri(value);
      }
    });
    if (mounted.current) {
      restoreSession();
      checkDeeplink()
    } else {
      mounted.current = true;
    }

  }, [mounted.current, mounted]);

  const androidQrEventListener = (data: any) => {
    onConnectHandler(data.uri);
  }

  const checkDeeplink = () => {
    Linking.addEventListener('url', (event) => {
      if (event.url) {
        onConnectHandler(event.url)
      }
    });
    (async () => {
      const deepLink = await Linking.getInitialURL()
      if (deepLink) {
        onConnectHandler(deepLink)
      }
    })()
  }

  const openScanner = async () => {
    if (Platform.OS === "android") {
      const permissionResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      if (permissionResult === "granted") {
        DeviceEventEmitter.addListener("QR_SUCCESS", (data) => {
          onConnectHandler(data.uri);
        });
        QrModule.openQrScanner();
      } else {
        toast({
          title: "Permission Denied",
          content: "Please enable camera permission to scan QR code",
        });
      }
    } else {
      navigation.navigate("Scanner", {
        onData: (data: string) => {
          onConnectHandler(data);
        },
      });
    }
  };

  const onConnectHandler = async (qrUri?: string | undefined) => {
    createSessionAndAttachListners(qrUri);
  };

  const createSessionAndAttachListners = (uriOrSession: any) => {
    const connection = new WalletConnect(
      uriOrSession,
      networkProvider,
      async (connectionManager, request) => {
        const session: Session = {
          session: "",
          icon: connectionManager.clientMeta
            ? connectionManager.clientMeta.icons[0]
            : "",
          id: connectionManager.session.peerId,
          name: connectionManager.clientMeta
            ? connectionManager.clientMeta.name
            : "",
          url: connectionManager.clientMeta
            ? connectionManager.clientMeta.url
            : "",
        };
        if (request.method === "session_request") {
          try {
            modal.openModal("RequestAccountModal", { connectionManager });
          } catch (error) {
            console.log(error);
          }
        }
        if (request.method.includes("eth_signTypedData")) {
          try {
            modal.openModal("SignMessageModal", {
              connectionManager,
              request,
              session,
            });
          } catch (error) {
            console.error(error);
          }
        }
        if (request.method === "wallet_switchEthereumChain") {
          try {
            modal.openModal("NetworkSwitchModal", { connectionManager, request, session });
          } catch (error) {
            console.log(error);
          }
        }
        if (request.method === "personal_sign") {
          try {
            modal.openModal("SignMessageModal", {
              connectionManager,
              request,
              session,
            });
          } catch (error) {
            console.error(error);
          }
        }
        if (request.method === "eth_sign") {
          try {
            modal.openModal("SignMessageModal", {
              connectionManager,
              request,
              session,
            });
          } catch (error) {
            console.error(error);
          }
        }
        if (request.method === "eth_signTransaction") {
          try {
            connectionManager.rejectRequest({
              id: request.id,
              jsonrpc: request.jsonrpc,
              error: { message: "Method not allowed" },
            });
          } catch (error) {
            console.error("ETH_SIGN =====>", error);
          }
        }
        if (request.method === "eth_sendTransaction") {
          try {
            navigation.navigate("Confirmations", {
              ...request.params[0],
              tokenAddress: request.params[0].to,
              wcSession: (data) => {
                if (!data) {
                  connectionManager.rejectRequest({
                    id: request.id,
                    error: { message: "User rejected the request" },
                  });
                  return;
                }
                connectionManager.approveRequest({
                  id: request.id,
                  result: data,
                });
              },
            });
          } catch (error) {
            console.error("ETH_SIGN =====>", error);
          }
        }
      }
    );
    dispatch(addSession(connection));
  };

  return (
    <TouchableOpacity onPress={openScanner}>
      <Image
        source={WcLogo}
        style={[
          {
            marginHorizontal: 30,
            width: 25,
            height: 30,
            resizeMode: "contain",
          },
        ]}
      />
    </TouchableOpacity>
  );
};
