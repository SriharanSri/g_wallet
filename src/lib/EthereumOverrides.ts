import rnScrypt from 'react-native-scrypt'
import cryp from 'crypto'
import Web3 from 'web3'

const web3 = new Web3()


export const decryptPkFromJsonRN = async (v3Keystore, password, nonStrict) => {
    /* jshint maxcomplexity: 10 */
    if (!(typeof password === 'string')) {
        throw new Error('No password given.');
    }
    var json = (!!v3Keystore && typeof v3Keystore === 'object') ? v3Keystore : JSON.parse(nonStrict ? v3Keystore.toLowerCase() : v3Keystore);
    if (json.version !== 3) {
        throw new Error('Not a valid V3 wallet');
    }
    var derivedKey;
    var kdfparams;
    console.log("<======= USING OUR IMPLEMENTATON =====>")
    if (json.crypto.kdf === 'scrypt') {
        kdfparams = json.crypto.kdfparams;
        // FIXME: support progress reporting callback
        derivedKey = await rnScrypt(Buffer.from(password), Buffer.from(kdfparams.salt, 'hex'), kdfparams.n, kdfparams.r, kdfparams.p, kdfparams.dklen, 'buffer');
        var ciphertext = Buffer.from(json.crypto.ciphertext, 'hex');
        var mac = web3.utils.sha3(Buffer.from([...derivedKey.slice(16, 32), ...ciphertext]) as any).replace('0x', '');
        if (mac !== json.crypto.mac) {
            throw new Error('Key derivation failed - possibly wrong password');
        }
        var decipher = cryp.createDecipheriv(json.crypto.cipher, derivedKey.slice(0, 16), Buffer.from(json.crypto.cipherparams.iv, 'hex'));
        var seed = '0x' + Buffer.from([...decipher.update(ciphertext), ...decipher.final()]).toString('hex');
        const account = web3.eth.accounts.privateKeyToAccount(seed, true)
        return account
    }
}
