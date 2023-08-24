
export type networkType = {
    id: string,
    name: string,
}

export type UpdateBalanceType = {
    balance: number
    balanceInUsd?: number
}

export type UpdateWalletType = {
    wallet: Wallet
}
