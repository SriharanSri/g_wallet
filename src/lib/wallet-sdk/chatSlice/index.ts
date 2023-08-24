// import Auth from '@/lib/Auth'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
// import { UserType } from './types'
import {  SERVICE_API, CHAT_API } from '@env';
import {io, Socket} from 'socket.io-client'
import ChatConfig from "../../chat-sdk/chat"




export type AuthSliceType = {
  chatConfig?: ChatConfig,
  messages? : any
}
const initialState: AuthSliceType = {

}

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    updateChatConfig: (state, action: PayloadAction<any>) => {
      state.chatConfig = {...action.payload};
    },

    updateMessages: (state, action: PayloadAction<any>) => {
      state.messages = {...action.payload};
    },
    
  },
})

export const chatReducer = chatSlice.reducer

export const { updateChatConfig, updateMessages } = chatSlice.actions

