import * as _ from 'lodash';
var CoinKey = require('coinkey');
var crypto = require('crypto');
var cookies = require('browser-cookies');
var NodeRSA = require('node-rsa');
var axios = require('axios');
require ('./sign/crypto-min.js');
require ('./sign/crypto-sha256.js');
require ('./sign/crypto-sha256-hmac.js');
require ('./sign/ripemd160.js');
require ('./sign/jsbn.js');
require ('./sign/ellipticcurve.js');
require ('./sign/bitTrx.js');

const lyraInfo = {
    private: 0xae,
    public: 0x30,
    scripthash: 0x0d
};

export default class ScryptaCore {
    constructor (){
        this.RAWsAPIKey = '';
        this.PubAddress = '';
    }
    
    static returnNodes(){
        return ['idanode01.scryptachain.org','idanode02.scryptachain.org','idanode03.scryptachain.org'];
    }
    
    static async checkNode(node){
        const response = await axios.get('https://' + node + '/check')
        return response;
    }

    static async connectNode(){
        var checknodes = this.returnNodes()
        var connected = false
        while(connected === false){
            var checknode = checknodes[Math.floor(Math.random()*checknodes.length)];
            const check = await this.checkNode(checknode)
            if(check.status === 200){
                connected = true
                return Promise.resolve(check.data.name)
            }
        }
    }

    static async createAddress(password, saveKey = true){
        // LYRA WALLET
        var ck = new CoinKey.createRandom(lyraInfo)
        
        // SIMMETRIC KEY
        var buf = crypto.randomBytes(16);
        var api_secret = buf.toString('hex');

        // ASYMMETRIC KEY
        const key = new NodeRSA({b: 512});
        var pk = key.exportKey('pkcs8-private');
        var pub = key.exportKey('pkcs8-public');
        
        var lyrapub = ck.publicAddress;
        var lyraprv = ck.privateWif;
        var lyrakey = ck.publicKey.toString('hex');

        //console.log("CREATED PUB ADDRESS: " + lyrapub);
        //console.log("CREATED PUB KEY: " + lyrakey);
        
        // STORE JUST LYRA WALLET 
        var wallet = {
            prv: lyraprv,
            api_secret: api_secret,
            key: lyrakey,
            rsapub: pub,
            rsaprv: pk
        };

        const cipher = crypto.createCipher('aes-256-cbc', password);
        let wallethex = cipher.update(JSON.stringify(wallet), 'utf8', 'hex');
        wallethex += cipher.final('hex');

        var walletstore = lyrapub + ':' + wallethex;
        
        // SAVE ENCRYPTED VERION IN COOKIE
        if(saveKey == true){
            if(window.location.hostname == 'localhost'){
                var cookie_secure = false;
            }else{
                var cookie_secure = true;
            }
            cookies.set('scrypta_key', walletstore, {secure: cookie_secure, domain: window.location.hostname, expires: 30, samesite: 'Strict'});
        }
        var response = {
            pub: lyrapub,
            api_secret: api_secret,
            key: lyrakey,
            prv: lyraprv
        }
        return response;
    }

    static async initAddress(address){
        const app = this
        const node = await app.connectNode();
        const response = await axios.post('https://' + node + '/init', {address: address})
        return response;
    }

    static async getPublicKey(privateWif){
        var ck = new CoinKey.fromWif(privateWif);
        var pubkey = ck.publicKey.toString('hex');
        return pubkey;
    }

    static async saveKey(key){
        if(window.location.hostname == 'localhost'){
            var cookie_secure = false;
        }else{
            var cookie_secure = true;
        }
        cookies.set('scrypta_key', key, {secure: cookie_secure, domain: window.location.hostname, expires: 30, samesite: 'Strict'});
        return Promise.resolve(true);
    }

    static keyExsist(){
        var ScryptaCore_cookie = cookies.get('scrypta_key');
        if(ScryptaCore_cookie !== null && ScryptaCore_cookie !== ''){
            var ScryptaCore_split = ScryptaCore_cookie.split(':');
            if(ScryptaCore_split[0].length > 0){
                this.PubAddress = ScryptaCore_split[0];
                this.RAWsAPIKey = ScryptaCore_split[1];
                return ScryptaCore_split[0];
            } else {
                return false
            }
        }else{
            return false
        }
    }

    static async readKey(password = ''){
        var ScryptaCore_cookie = cookies.get('scrypta_key');
        if(password !== ''){
            var ScryptaCore_split = ScryptaCore_cookie.split(':');
            try {
                var decipher = crypto.createDecipher('aes-256-cbc', password);
                var dec = decipher.update(ScryptaCore_split[1],'hex','utf8');
                dec += decipher.final('utf8');
                var $ScryptaCore_cookie = JSON.parse(dec);
                return Promise.resolve($ScryptaCore_cookie);
            } catch (ex) {
                console.log('WRONG PASSWORD')
                return Promise.resolve(false);
            }
        }
    }

    static forgetKey(){
        if(window.location.hostname == 'localhost'){
            var cookie_secure = false;
        }else{
            var cookie_secure = true;
        }
        cookies.set('scrypta_key', "", {secure: cookie_secure, domain: window.location.hostname, expires: 0, samesite: 'Strict'});
        return true;
    }

    static async listUnspent(address){
        const app = this
        const node = await app.connectNode();
        if(node !== undefined){
            var unspent = await axios.post(
                'https://' + node + '/listunspent',
                { address: address }
            )
            return unspent.data.data
        } else {
            return Promise.resolve(false)
        }
    }

    static async sendRawTransaction(rawtransaction){
        const app = this
        const node = await app.connectNode();
        if(node !== undefined){
            var txid = await axios.post(
                'https://' + node + '/sendrawtransaction',
                { rawtransaction: rawtransaction }
            ).catch(function(err){
                console.log(err)
            })
            return txid.data.data
        } else {
            return Promise.resolve(false)
        }
    }

    static async send(password = '', send = false, to, amount, metadata = '', fees = 0.001){
        var ScryptaCore_cookie = cookies.get('scrypta_key');
        if(password !== ''){
            var ScryptaCore_split = ScryptaCore_cookie.split(':');
            try {
                var decipher = crypto.createDecipher('aes-256-cbc', password);
                var dec = decipher.update(ScryptaCore_split[1],'hex','utf8');
                dec += decipher.final('utf8');
                var $ScryptaCore_cookie = JSON.parse(dec);

                var trx = bitjs.transaction();
                var from = ScryptaCore_split[0]
                var unspent = await this.listUnspent(from)
                if(unspent.length > 0){
                    var inputamount = 0;
                    for (var i=0; i < unspent.length; i++){
                        if(inputamount <= amount){
                            var txid = unspent[i]['txid'];
                            var index = unspent[i]['vout'];
                            var script = unspent[i]['scriptPubKey'];
                            trx.addinput(txid,index,script);
                            inputamount += unspent[i]['amount']
                        }
                    }
                    var amountneed = amount + fees;
                    if(inputamount >= amountneed){
                        var change = inputamount - amountneed;
                        if(amount > 0.00001){
                            trx.addoutput(to,amount);
                        }
                        if(change > 0.00001){
                            trx.addoutput(from,change);
                        }

                        if(metadata !== '' && metadata.length <= 80){
                            trx.addmetadata(metadata);
                        }

                        var wif = $ScryptaCore_cookie.prv;
                        var signed = trx.sign(wif,1);

                        if(send === false){
                            return Promise.resolve(signed);
                        } else {
                            var txid = await this.sendRawTransaction(signed)
                            console.log("TX SENT: " + txid)
                            return Promise.resolve(txid)
                        }
                    }else{
                        console.log('NOT ENOUGH FUNDS')
                        return Promise.resolve(false) //NOT ENOUGH FUNDS
                    }
                } else {
                    console.log('NOT ENOUGH FUNDS')
                    return Promise.resolve(false) //NOT ENOUGH FUNDS
                }
            } catch (error) {
                console.log(error)
                return Promise.resolve(false);
            }
        }
    }

    static async write(password, metadata, collection = '', refID = '', protocol = ''){
        if(password !== '' && metadata !== ''){
            var ScryptaCore_cookie = cookies.get('scrypta_key');
            var ScryptaCore_split = ScryptaCore_cookie.split(':');
            try {
                var decipher = crypto.createDecipher('aes-256-cbc', password);
                var dec = decipher.update(ScryptaCore_split[1],'hex','utf8');
                dec += decipher.final('utf8');
                var $ScryptaCore_cookie = JSON.parse(dec);
                
                var wallet = ScryptaCore_split[0]

                var Uuid = require('uuid/v4')
                var uuid = Uuid().replace(new RegExp('-', 'g'), '.')

                if(collection !== ''){
                    collection = '!*!' + collection
                }else{
                    collection = '!*!'
                }

                if(refID !== ''){
                    refID = '!*!' + refID
                }else{
                    refID = '!*!'
                }

                if(protocol !== ''){
                    protocol = '!*!' + protocol
                }else{
                    protocol = '!*!'
                }

                var dataToWrite = '*!*' + uuid+collection+refID+protocol+ '*=>' + metadata + '*!*'

                if(dataToWrite.length <= 80){
                    var txid = ''
                    var i = 0
                    var totalfees = 0
                    while(txid !== false && txid.length !== 64){
                        var fees = 0.001 + (i / 1000)
                        txid = await this.send(password,true,wallet,0,dataToWrite,fees)
                        if(txid !== false && txid.length === 64){
                            totalfees += fees
                        }
                        i++;
                    }
                    
                    return Promise.resolve({
                        uuid: uuid,
                        address: wallet,
                        fees: totalfees,
                        collection: collection.replace('!*!',''),
                        refID: refID.replace('!*!',''),
                        protocol: protocol.replace('!*!',''),
                        dimension: dataToWrite.length,
                        chunks: 1,
                        stored: dataToWrite,
                        txs: [txid]
                    })

                }else{
                    
                    var txs = []
                    var dataToWriteLength = dataToWrite.length
                    var nchunks = Math.ceil(dataToWriteLength / 74)
                    var last = nchunks - 1
                    var chunks = []

                    for (var i=0; i<nchunks; i++){
                        var start = i * 74
                        var end = start + 74
                        var chunk = dataToWrite.substring(start,end)

                        if(i === 0){
                            var startnext = (i + 1) * 74
                            var endnext = startnext + 74
                            var prevref = ''
                            var nextref = dataToWrite.substring(startnext,endnext).substring(0,3)
                        } else if(i === last){
                            var startprev = (i - 1) * 74
                            var endprev = startprev + 74
                            var nextref = ''
                            var prevref = dataToWrite.substr(startprev,endprev).substr(71)
                        } else {
                            var startnext = (i + 1) * 74
                            var endnext = startnext + 74
                            var nextref = dataToWrite.substring(startnext,endnext).substring(0,3)

                            var startprev = (i - 1) * 74
                            var endprev = startprev + 74
                            var prevref = dataToWrite.substr(startprev,endprev).substr(71)
                        }
                        chunk = prevref + chunk + nextref
                        chunks.push(chunk)
                    }

                    var totalfees = 0
                    for(var cix=0; cix<chunks.length; cix++){
                        var txid = ''
                        var i = 0
                        while(txid.length !== 64){
                            var fees = 0.001 + (i / 1000)
                            txid = await this.send(password,true,wallet,0,chunks[cix],fees)
                            if(txid !== false && txid.length === 64){
                                totalfees += fees
                                txs.push(txid)
                            }
                            i++;
                        }
                    }

                    return Promise.resolve({
                        uuid: uuid,
                        address: wallet,
                        fees: totalfees,
                        collection: collection.replace('!*!',''),
                        refID: refID.replace('!*!',''),
                        protocol: protocol.replace('!*!',''),
                        dimension: dataToWrite.length,
                        chunks: nchunks,
                        stored: dataToWrite,
                        txs: txs
                    })

                }

            } catch (error) {
                console.log(error)
                return Promise.resolve(false);
            }
        }
    }
}
window.ScryptaCore = ScryptaCore