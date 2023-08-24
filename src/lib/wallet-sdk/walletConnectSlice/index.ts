import { DEFAULT_NETWORK, RECOVERY_API, SERVICE_API, STORAGE_API } from '@env';
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { KeyInfra } from '../../keyInfra';
import { WalletConnect } from '../../WalletConnect';
import { Auth } from '../Auth';
import { ImportCollectibleFormType } from '../types/collectible-type';
import { ImportTokenFormType } from '../types/token-type';
import { Wallet } from '../wallet';


const wallet = new Wallet(DEFAULT_NETWORK);
const keyInfra = new KeyInfra(SERVICE_API, STORAGE_API, RECOVERY_API)

export type WalletConnectSliceType = {
  walletConnectSession: WalletConnect[]
}

const initialState: WalletConnectSliceType = {
  walletConnectSession: []
}

export const walletConnectSlice = createSlice({
  name: 'core',
  initialState,
  reducers: {
    addSession: (state, action: PayloadAction<WalletConnect>) => {
      state.walletConnectSession = [...state.walletConnectSession, action.payload]
    }
  },
})

export const walletConnectReducer = walletConnectSlice.reducer

export const { addSession } = walletConnectSlice.actions
