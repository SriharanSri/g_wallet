import { UserRecord } from "./user-manager";

export interface StorageManager {
  get(key: UserRecord|string, path?: string[]): Promise<UserRecord|string | null>;
  set(key: UserRecord|string, path?: string[], value?: UserRecord|string|null): Promise<void>;
  remove(key: UserRecord|string, path?: string[]): Promise<void>;
  update(key: UserRecord|string, path?: string[]): Promise<void>;
}

export interface Record {

}