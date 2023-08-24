// import Auth from '@/lib/Auth'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {Auth} from '../Auth'
import { UserType } from './types'
import { RECOVERY_API, SERVICE_API, STORAGE_API } from '@env';

export type AuthSliceType = {
  auth: Auth
  authenticated: boolean
  uKey: string
  displayName: string,
  metadata?: object
  recovery?: string
  mailName ? : string
  importedAccount?: object[]
}

const auth = new Auth(SERVICE_API)
const initialState: AuthSliceType = {
  auth: auth,
  authenticated: false,
  uKey: '',
  displayName: '',
  metadata: {},
  recovery: '',
  mailName :'',
  importedAccount: []
}

export const authSlice = createSlice({
  name: 'core',
  initialState,
  reducers: {
    userAuthenticated: (state, action: PayloadAction<UserType>) => {
      state.authenticated = true
      state.displayName = action.payload.displayName
      state.mailName = action.payload.mailName
      state.uKey = action.payload.uKey
      state.metadata = action.payload.metadata
    },
    updateDisplayName: (state, action: PayloadAction<string>) => {
      state.displayName = action.payload
    },
    updateRecovery: (state, action: PayloadAction<string>) => {
      state.recovery = action.payload
    },
    updateMetadata: (state, action: PayloadAction<any>) => {
      state.metadata = action.payload
    },
    updateImportAccounts : (state, action: PayloadAction<any>) => {
      state.importedAccount = action.payload
    },
  },
})

export const authReducer = authSlice.reducer

export const { userAuthenticated, updateRecovery, updateMetadata, updateDisplayName, updateImportAccounts } = authSlice.actions


// import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// const initialState = {
//   name: "",
// };

// export const authSlice = createSlice({
//   name: "auth",
//   initialState,
//   reducers: {
//     updateName: (state, action: PayloadAction<any>) => {
//         console.log("payload", action.payload)
//       state.name = action.payload;
//     },
//   },
// });

// export const authReducer = authSlice.reducer;

// export const { updateName } = authSlice.actions;
