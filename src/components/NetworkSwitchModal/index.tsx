import React, { useContext, useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from "react-native"
import { Text } from "../Text"
import { globalStyles } from "../../styles/global.style"
import { WalletConnect, WalletConnectRequest } from '../../lib/WalletConnect'
import { Session } from '../RequestAccountModal'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../lib/wallet-sdk/store'
import { Wallet } from '../../lib/wallet-sdk/wallet'
import { LoadingIndicatorContext } from '../../App'
import { Button } from '../Button'
import storage from '../../lib/wallet-sdk/storage/storage'
import { changeNetwork } from '../../lib/wallet-sdk/coreSlice'
import { useAlert } from '../../hooks/useAlert'
import ConnectionManager from "@walletconnect/client";


export const NetworkSwitchModal = ({ modal: { closeModal, getParam } }) => {
    const request = getParam("request") as WalletConnectRequest;
    const session = getParam("session") as Session;
    const { toast } = useAlert()
    const { walletConnectSession } = useSelector(
        (state: RootState) => state.walletConnectReducer
    );
    const dispatch = useDispatch()
    const connectionManager = getParam("connectionManager") as ConnectionManager;
    const { networkProvider } = useSelector((state: RootState) => state.coreReducer)
    const [toNetwork, setToNetwork] = useState<any>()
    const { setLoading } = useContext(LoadingIndicatorContext)

    useEffect(() => {
        (async () => {
            setLoading(true)
            const networks = await Wallet.getNetworkProviders()
            const toNetwork = networks.get(request.params[0].chainId)
            setToNetwork(toNetwork)
            setLoading(false)
        })()
    }, [])

    const onApproveHandler = async () => {
        await onNetworkChanged(toNetwork.key)
        // connectionManager.approveRequest({ id: request.id, result: true })
    }

    const onRejectHandler = () => {
        connectionManager.rejectRequest({ id: request.id, error: { message: "Request rejected by user", code: 4902 } })
    }

    const onNetworkChanged = async (networkKey: any) => {
        setLoading(true);
        const availableNetworks = [];
        const networks = await Wallet.getNetworkProviders()
        networks.forEach(function (val: any, key) {
            availableNetworks.push({ label: val.name, value: val.key, data: val });
        });
        const network = availableNetworks.find(
            (network: any) => network.value === networkKey
        );
        await storage.setItem(Wallet.NETWORK_STORAGE_KEY, network.value);
        dispatch(changeNetwork(network.data));
        connectionManager.updateSession({
            ...connectionManager.session,
            chainId: Number(network.data.chainId)
        })
        connectionManager.approveRequest({ id: request.id, result: null })
        toast({
            title: `Network changed to ${network.data.name}`,
            position: "bottom",
        });
        closeModal()
        // EMITING TO ALL WALLETCONNECT SESSION
        walletConnectSession.map((session) => {
            try {
                session.walletConnectClient.updateSession({
                    ...session.walletConnectClient.session,
                    chainId: Number(network.data.chainId),
                });
            } catch (error) {
                console.log("Error in updating session")
            }
        });
    };

    return (
        <View style={globalStyles.screen}>
            <View style={style.content}>
                <View style={style.networkContainer}>
                    <Text textAlign='center'> {networkProvider.name}</Text>
                </View>
                <Text>{'----------->'}</Text>
                {toNetwork && <View style={style.networkContainer}>
                    <Text textAlign='center'>{toNetwork.name}</Text>
                </View>}
            </View>
            {toNetwork && <View style={style.btnContainer}>
                <Button styles={style.btn} title='Reject' variant='one' onPress={onRejectHandler} />
                <Button styles={style.btn} title='Approve' variant='one' onPress={onApproveHandler} />
            </View>}


        </View>
    )
}

const style = StyleSheet.create({
    networkContainer: {
        width: 140,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#eeeeee20',
        borderRadius: 70
    },
    line: {
        width: 100,
        height: 500,
        color: 'red'
    },
    btnContainer: {
        flexDirection: 'row',
        marginHorizontal: 12
    },
    btn: {
        flex: 1
    },
    content: {
        flex: 1,
        marginHorizontal: 20,
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center'
    }
})