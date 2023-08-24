import WalletConnectClient from '@walletconnect/client'

const METHODS_TO_REDIRECT = [
    "eth_requestAccounts",
    "eth_sendTransaction",
    "eth_signTransaction",
    "eth_sign",
    "personal_sign",
    "eth_signTypedData",
    "eth_signTypedData_v3",
    "eth_signTypedData_v4",
    "wallet_watchAsset",
    "wallet_addEthereumChain",
    "wallet_switchEthereumChain",
]


export class WalletConnect {
    walletConnectClient: WalletConnectClient = null
    rpcUrl: string = ""
    constructor(uri: string | object, network:any , onRequireWallet: (walletConnectSession: WalletConnectClient, request: WalletConnectRequest) => void) {
        this.rpcUrl = network.url
        if (typeof uri === "string") {
            this.walletConnectClient = new WalletConnectClient({ uri: uri })
            console.log("if after connection  ===>", uri)
        } else {
            console.log("SESSIONS ===> ", uri)
            this.walletConnectClient = new WalletConnectClient({ session: uri as any })
            console.log("else after connection  ===>", uri)

        }
        console.log("after connection  ===>", uri)

        this.walletConnectClient.on('session_request', (error: any, request: WalletConnectRequest) => {
            if (error) {
                throw error
            }
            onRequireWallet(this.walletConnectClient, request)
        })
        this.walletConnectClient.on('call_request', async (error: any, request: WalletConnectRequest) => {
            console.error("Request from dapp ====>", request);
            console.log("REQUEST FROM DAPP ========> ", request)
            if (error) {
                throw error
            }
            if (METHODS_TO_REDIRECT.includes(request.method)) {
                onRequireWallet(this.walletConnectClient, request)
                return
            }
            this.performRpcCall(request, this.walletConnectClient)
        })
    }

    async performRpcCall(request: WalletConnectRequest, walletConnectClient: WalletConnectClient) {
        try {
            const response = await fetch(this.rpcUrl, {
                body: JSON.stringify(request),
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            })
            const result = await response.json()
            this.walletConnectClient.approveRequest({ id: request.id, jsonrpc: request.jsonrpc, result: result.data.result })
        } catch (error) {
            this.walletConnectClient.rejectRequest({ id: request.id, jsonrpc: request.jsonrpc, error: error.toString() })
        }
    }


    changeRpcUrl(url: string) {
        this.rpcUrl = url
    }

}


//TYPES//

export interface WalletConnectRequest {
    id: number,
    jsonrpc: string,
    method: string,
    params: any
}

