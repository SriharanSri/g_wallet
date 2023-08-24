import { combineReducers } from 'redux'
import { authReducer } from './authSlice'
import { coreReducer } from './coreSlice'
import { chatReducer  } from './chatSlice'
import { walletConnectReducer } from './walletConnectSlice'

const rootReducer = combineReducers({
  coreReducer,
  authReducer,
  chatReducer,
  walletConnectReducer
})

export default rootReducer
