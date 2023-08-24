import { Action, configureStore, Store, ThunkAction } from '@reduxjs/toolkit'
import rootReducer from './reducers'

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ serializableCheck: false }),
})

const makeStore = () => store
export const wrapper = makeStore
export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>

export type Thunk = ThunkAction<void, RootState, null, Action<string>>
