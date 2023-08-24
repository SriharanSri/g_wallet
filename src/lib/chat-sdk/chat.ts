import {io, Socket} from 'socket.io-client';
import EthCrypto from 'eth-crypto';
import CryptoJS from 'crypto-js';
import { CHAT_API } from '@env';
import { Wallet } from '../wallet-sdk/wallet';

export type MessageType = {
  sender: string,
  recipient: string,
  content: string,
  checksum?: string,
}

export type EncryptedData = {
  encryptedData: string,
  checksum: string,
}

export default class ChatConfig {
  api: any;
  wallet: any;
  socket: Socket

  constructor(wallet?: Wallet, socket?: Socket) {
    // this.api = api;
    this.wallet = wallet;
    this.socket = socket;
  }

  connect = (callback?: any) => {
    try {
      console.log("connnect called...", CHAT_API)
      this.socket.on('connect', () => {
      callback(this.socket.id)
      });
    // socket.connect();
    } catch (error) {
      console.log("error in connect", error)
    }
  }

  isOnline = (address: string[]) => {
    this.socket.emit('isOnline', address);
  }

  isOnlineResponse = (callback: any) => {
    console.log("in onine response")
    this.socket.on('isOnline', (res) => callback(res));
  }

  // 1. Join/Start the chat
  joinChat = (sender: string, recipient: string) => {
    this.socket.emit('join', {
      sender: sender,
      recipient: recipient,
    });
    console.log(`Socket.IO client joined private room with otherUserId`);  
  }

  updatePubKey = (sender: string, sign: string) => {
    this.socket.emit('updatePubKey', {
      sender, sign
    })
  }

  pubKeyCheck = (address: string) => {
    console.log("Pubcheck called..", address)
    this.socket.emit('getPubkey', {address})
  }

  getPubkey = (callback: any) => {
    this.socket.on('getPubkey',  (res) => callback(res))
  }

  // 2. Send the chat message
  sendMessage = async (message: MessageType, pubKey?: string) => {
    if (message.content.trim() !== '') {

      if(pubKey){
        let encryptedData: EncryptedData = await this._encryptMessage(message.content, pubKey);
        message.checksum = encryptedData.checksum;
        message.content = encryptedData.encryptedData;
      }

      // Send a chat message to the other user in the private room
      console.log("emit message", message)
      this.socket.emit('chat', {
              app: "chat",
              type: "message",
              sender: message.sender,
              recipient: message.recipient,
              content: message.content,
              checksum: message.checksum,
      });
      console.log(`Sent message.....: ${JSON.stringify(message)}`);
    }
    console.log("final before return")
    return
  };

  // 3. Receive message - This is to trigger event, may not required
  receiveMessages = (callback: any) => {
    this.socket.on('chat', (msg) => {
      callback(msg)
    });
  }

  updateSync = (data: any) => {
    this.socket.emit('update_sync', data)
  }

  ping = () => {
    this.socket.emit('ping', {message: 'Ping from Client..!'})
  }

  pong =() => {
    this.socket.on('ping', (data) => {
      console.log("From server", data)
    })
  }

  afterConnect = (callback: any) => {
    this.socket.on('afterConnect', callback);
  }

  // 4. Leave the private chat
  leaveChat = (sender: string, recipient: string) => {
    this.socket.emit('leave', {sender, recipient});
    console.log(`Socket.IO client left private room with otherUserId`);
  }

  // 5. Signout and leave the chat
  disconnect = (sender: string, recipient: string) => {
    this.socket.emit('leave', {sender, recipient});
    this.socket.disconnect();
  }

  _encryptMessage = async(data, pubKey): Promise<EncryptedData> => {
    let stringData = JSON.stringify(data);
    let checksum = CryptoJS.SHA256(stringData).toString();

    let encData = await EthCrypto.encryptWithPublicKey(
      pubKey,
      stringData
    );

    let encryptedData = EthCrypto.cipher.stringify(encData);

    return { checksum,  encryptedData };
  }

  _decryptMessage = async(record: any, pubKey?: string) => {
    let encryptedData = EthCrypto.cipher.parse(record.data);
    let decryptedData = await EthCrypto.decryptWithPrivateKey(
      this.wallet.walletInst.account.privateKey,
      encryptedData
    );

    let checksum = CryptoJS.SHA256(decryptedData).toString();

    if(checksum === record.checksum){
      decryptedData = JSON.parse(decryptedData);
      console.log("--- Decrypted ---", decryptedData);

      return decryptedData;
    } else {
      throw "Invalid message";
    }    
  }
}