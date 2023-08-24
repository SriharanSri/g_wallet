import { DEFAULT_NETWORK, RECOVERY_API, SERVICE_API, STORAGE_API } from '@env';
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { KeyInfra } from '../../keyInfra';
import { Auth } from '../Auth';
import { ImportCollectibleFormType } from '../types/collectible-type';
import { ImportTokenFormType } from '../types/token-type';
import { Wallet } from '../wallet';
// import Wallet from '../../lib/Wallet'


import { UpdateBalanceType, UpdateWalletType } from './types'

// const getCurrentOrDefaultNetwork = () =>
//   typeof window !== 'undefined'
//     ? Wallet.getNetworkProviders().get(localStorage.getItem('network') || 'GOERLI_TESTNET')
//     : Wallet.getNetworkProviders().get('GOERLI_TESTNET')

const wallet = new Wallet(DEFAULT_NETWORK);
const keyInfra = new KeyInfra(SERVICE_API, STORAGE_API, RECOVERY_API)

export type CoreSliceType = {
  wallet: Wallet
  keyInfra: KeyInfra
  networkProvider: Record<string, string>
  balance: number
  balanceInUsd: number
  tokens: ImportTokenFormType[],
  collectibles: ImportCollectibleFormType[]
}

const initialState: CoreSliceType = {
  wallet: wallet,
  keyInfra: keyInfra,
  networkProvider: {},
  balance: wallet.totalValue,
  balanceInUsd: 0,
  tokens: [],
  collectibles: []
}

export const coreSlice = createSlice({
  name: 'core',
  initialState,
  reducers: {
    changeNetwork: (state, action: PayloadAction<any>) => {
      const wallet = { ...state.wallet }
      wallet.updateProvider(action.payload)
      state.wallet = wallet;
      state.networkProvider = action.payload
    },
    updateBalance: (state, action: PayloadAction<UpdateBalanceType>) => {
      state.balance = action.payload.balance
      state.balanceInUsd = action.payload.balanceInUsd || 0
    },
    updateWallet: (state, action: PayloadAction<UpdateWalletType>) => {
      state.wallet = { ...action.payload.wallet }
    },
    updateKeyInfra: (state, action: PayloadAction<string>) => {
      const keyInfra = { ...state.keyInfra }
      keyInfra.uKey = action.payload
      state.keyInfra = keyInfra
    },
    setTokens: (state, action: PayloadAction<ImportTokenFormType[]>) => {
      state.tokens = [...action.payload]
    },
    setCollectibles: (state, action: PayloadAction<ImportTokenFormType[]>) => {
      state.collectibles = action.payload
    },
    addAccount: (state, action: PayloadAction<any>) => {
      const walletCopy = { ...state.wallet }
      walletCopy.wallet = { ...walletCopy.wallet, ...action.payload }
      walletCopy.account = { ...action.payload }
      state.wallet = walletCopy

    },
    changeAccount: (state, action: PayloadAction<any>) => {
      state.wallet = { ...state.wallet, account: action.payload }
    },
  },
})

export const coreReducer = coreSlice.reducer

export const {
  changeNetwork,
  updateWallet,
  updateBalance,
  updateKeyInfra,
  setTokens,
  addAccount,
  changeAccount,
  setCollectibles
} = coreSlice.actions
