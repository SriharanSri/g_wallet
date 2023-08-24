import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useModal } from "react-native-modalfy";
import { useDispatch, useSelector } from "react-redux";
import InputDataDecoder from 'ethereum-input-data-decoder'
import { Session } from "../components/RequestAccountModal";
import { RootState } from "../lib/wallet-sdk/store";
import { addSession } from "../lib/wallet-sdk/walletConnectSlice";
import { WalletConnect } from "../lib/WalletConnect";
import { useAlert } from "./useAlert";
import erc721ABI from '../lib/ERC721_ABI.json'
import erc20ABI from '../lib/Abi.json'

export const useWalletConnect = () => {
  const { toast } = useAlert()
  const modal = useModal();
  const dispatch = useDispatch();
  const navigation: any = useNavigation();
  const { wallet, networkProvider } = useSelector(
    (state: RootState) => state.coreReducer
  );

  return {
    createOrRestoreSession: (uriOrSession: any) => {
      const connection = new WalletConnect(
        uriOrSession,
        networkProvider,
        async (connectionManager, request) => {
          console.log("INSIDE SWITCH ETHEREUM CHAIN ===========> ", request)
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
          if (request.method === "wallet_switchEthereumChain") {
            try {
              modal.openModal("NetworkSwitchModal", { connectionManager, request, session });
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
              let method = undefined;
              if (request.params[0].data) {
                const decoder = new InputDataDecoder(erc20ABI)
                const result = decoder.decodeData(request.params[0].data)
                if (result.method) {
                  method = result.method
                } else {
                  const decoder = new InputDataDecoder(erc721ABI)
                  const result = decoder.decodeData(request.params[0].data)
                  if (result.method) {
                    method = result.method
                  }
                }
              }
              navigation.navigate("Confirmations", {
                ...request.params[0],
                transactionType: "eth_sendTransaction",
                tokenAddress: request.params[0].to,
                method,
                wcSession: (data) => {
                  console.log("RESULT FROM CONFIRM TRANSACTION ====> ", data);
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
                  // Toast.show({ text1: "Transaction submmited for dapp" })
                },
              });
              // modal.openModal("SendTransactionModal", { connectionManager, request, session })
            } catch (error) {
              console.error("Error is send transaction ====>", error);
            }
          }
        }
      );
      dispatch(addSession(connection));
    },
    restoreSession: async () => {
      const sessions = JSON.parse(
        (await AsyncStorage.getItem("WALLET_CONNECT_SESSION")) ?? "[]"
      ) as Session[];
      sessions.map((session) => {
        try {
          const connection = new WalletConnect(
            JSON.parse(session.session),
            networkProvider,
            async (connectionManager, request) => {
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
                  let method = undefined;
                  if (request.params[0].data) {
                    const decoder = new InputDataDecoder(erc20ABI)
                    const result = decoder.decodeData(request.params[0].data)
                    if (result.method) {
                      method = result.method
                    } else {
                      const decoder = new InputDataDecoder(erc721ABI)
                      const result = decoder.decodeData(request.params[0].data)
                      if (result.method) {
                        method = result.method
                      }
                    }
                  }
                  navigation.navigate("Confirmations", {
                    ...request.params[0],
                    transactionType: "eth_sendTransaction",
                    tokenAddress: request.params[0].to,
                    method,
                    wcSession: (data) => {
                      console.log(
                        "RESULT FROM CONFIRM TRANSACTION ====> ",
                        data
                      );
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
          console.log(
            "RESTORED CONNECTION NETWORK ID ====> ",
            connection.walletConnectClient.session.chainId
          );
          dispatch(addSession(connection));
        } catch (error) {
          toast({
            title: "ERROR IN ESTABILISHING CONNECTION",
            position: "bottom",
          });
        }
        toast({
          title: `${sessions.length} session restored`,
          position: "bottom",
        });
      });
    },
  };
};
