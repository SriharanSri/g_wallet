import { useNavigation } from "@react-navigation/native";
import { useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LoadingIndicatorContext } from "../App";
import { Auth } from "../lib/wallet-sdk/Auth";
import { updateImportAccounts } from "../lib/wallet-sdk/authSlice";
import { updateWallet } from "../lib/wallet-sdk/coreSlice";
import { userManager } from "../lib/wallet-sdk/storage/user-manager";
import { RootState } from "../lib/wallet-sdk/store";
import { Wallet } from "../lib/wallet-sdk/wallet";
import { useAlert } from "./useAlert";
import SecureStorage from "react-native-encrypted-storage";
import * as Keychain from "react-native-keychain";
import AsyncStorage from "@react-native-async-storage/async-storage";


export const usePrepareWallet = () => {
    const { loading, setLoading } = useContext(LoadingIndicatorContext)
    const { toast } = useAlert()
    const navigation: any = useNavigation()
    const dispatch = useDispatch()
    const { wallet, keyInfra, networkProvider } = useSelector((state: RootState) => state.coreReducer)
    const { auth } = useSelector((state: RootState) => state.authReducer)
    return {
        logout: async () => {
            await auth.signOut();
            await Keychain.resetGenericPassword();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Signin' }]
            })
            setLoading(false);
        },
        checkMetadataAndNavigate: async () => {
            let metaData: any;

            try {
                metaData = await keyInfra.getMetaData();
            } catch (e) {
                setLoading(false);
                toast({
                    position: "bottom",
                    type: "error",
                    title: "Storage unreachable",
                });
                auth.errorSignout();
                return;
            }
            if (metaData.data.length === 0) {
                setLoading(false);
                navigation.navigate("CreateWallet", {
                    importMode: false
                });
                return;
            } else {
                const isKeyShareExist = await keyInfra.getFromLocal();
                if (isKeyShareExist) {
                    let secret = await keyInfra.reconstructKey();
                    if (!secret) {
                        setLoading(false);
                        toast({
                            position: "bottom",
                            type: "error",
                            title: "Unable to reconstruct the secret",
                        });
                        auth.errorSignout();
                        return;
                    }
                    let _tWallet = wallet.walletFromPkey(secret);
                    dispatch(updateWallet({ wallet: wallet }));
                    dispatch(updateImportAccounts((await userManager.get(await Auth.getUserStorageKey())).importedAccounts))
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Home' }]
                    })
                } else {
                    setLoading(false);
                    navigation.navigate("Recovery");
                    return;
                }
            }
        }
    }
}