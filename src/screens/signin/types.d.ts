export interface EmailVerificationStatus {
    token?:  string;
    status: boolean;
    data?:   Data;
}

export interface Data {
    login_id:   string;
    login_type: string;
    auth_token: string;
    ukey:       string;
    metadata:   Metadata;
}

export interface Metadata {
    two_fa: boolean;
}
