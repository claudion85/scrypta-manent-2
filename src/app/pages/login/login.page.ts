import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, MenuController, ToastController, AlertController, LoadingController } from '@ionic/angular';
//import * as scrypta from 'assets/js/scrypta.js';
import ScryptaCore from 'assets/js/ScryptaCore.js';
import axios from 'axios';
// import { maybeQueueResolutionOfComponentResources } from '@angular/core/src/metadata/resource_loading';
// import 'src/assets/js/scrypta.js'
import { IonicStorageModule } from '@ionic/storage';

 
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  public onLoginForm: FormGroup;
  password:string;
  repassword:string;
  //scrypta=new ScryptaCore();
  ScryptaCore:any;
  nodes:string[]=[];
  connected:string="";
  encrypted_wallet: 'NO WALLET'; 
  unlockPwd: '';
  createPwd: '';
  createPwdRepeat: '';
  public_address: string;
  public_qrcode: '';
  address_balance: string='';
  explorer_url: '';
  passwordShow: false;
  importShow: false;
  decrypted_wallet: '';
  transactionMessage: string='Loading transactions...';
  backupAlert: boolean=true;
  noTransactions: boolean;
  currentPage: 1;
  countTransactions: 0;
  items: [];


  constructor(
    public navCtrl: NavController,
    public menuCtrl: MenuController,
    public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    private formBuilder: FormBuilder,
    private storage:IonicStorageModule
    
  ) { }

  ionViewWillEnter() {
    this.menuCtrl.enable(false);
  }

  ngOnInit() {
    const app=this;
    
    this.onLoginForm = this.formBuilder.group({
      'password': [null, Validators.compose([
        Validators.required
      ])],
      're-password': [null, Validators.compose([
        Validators.required
      ])]
    });
    app.checkIdaNodes();
    app.checkUser();
    setTimeout(function(){
      app.backupAlert=false;
    },1000)
  }

  checkUser()
  {
    if(ScryptaCore.keyExsist()){
      //this.$emit('onFounfUser',this.ScryptaCore.keyExist(),this.ScryptaCore.RAWsAPIKey)
      var app=this
      app.public_address=ScryptaCore.PubAddress
      app.encrypted_wallet=ScryptaCore.RAWsAPIKey
      //console.log(ScryptaCore.PubAddress)
      
      console.log(app.encrypted_wallet)
    }

  }
  

  checkIdaNodes(){
    var checknodes=ScryptaCore.returnNodes();
    const app =this;
    
    for(var i=0;i<checknodes.length;i++)
    {
      axios.defaults.headers.get['Content-Type']='application/json';
      axios.get('https://'+checknodes[i]+'/check').then(function(response){
        //console.log(response);
        app.nodes.push(response.data.name);
        if(i == checknodes.length){
          app.connectToNode();
         
        }
      })
      
    }
    console.log(app.connected)
  }

connectToNode(){
  var app =this;
  if(app.connected=='')
  {
    app.connected =app.nodes[Math.floor(Math.random()*app.nodes.length)];

    console.log(app.connected);
    app.checkBalance();
    app.fetchTransactions();
  }
}
checkBalance()
{
  var app=this;
  if(app.public_address !=='')
  {
    console.log(app.public_address)
    axios.post('https://'+app.connected+'/getbalance',{
      address:app.public_address
    }).then(function(response){
      console.log(response)
      app.address_balance=response.data.data+ 'LYRA';
    }).catch(function(){
      alert("Seems there's a problem, please retry or change node!")
    })
  }
}

fetchTransactions(){
  var app=this;
  axios.post('https://'+app.connected+'/transactions',{
    address:app.public_address
  }).then(function(response){
    app.items=response.data.data;
    app.countTransactions=response.data.data.length;
    if(response.data.data>0){
      app.noTransactions=false;
    }else{
      app.transactionMessage='No transactions';
    }
  })
}


  async forgotPass() {
    const alert = await this.alertCtrl.create({
      header: 'Forgot Password?',
      message: 'Enter you email address to send a reset link password.',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Email'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Confirm Cancel');
          }
        }, {
          text: 'Confirm',
          handler: async () => {
            const loader = await this.loadingCtrl.create({
              duration: 2000
            });

            loader.present();
            loader.onWillDismiss().then(async l => {
              const toast = await this.toastCtrl.create({
                showCloseButton: true,
                message: 'Email was sended successfully.',
                duration: 3000,
                position: 'bottom'
              });

              toast.present();
            });
          }
        }
      ]
    });

    await alert.present();
  }

  // // //
  goToRegister() {
    this.navCtrl.navigateRoot('/register');
  }


  createWallet(){
    var app=this
    var responseJson
    if(app.password!=='' && app.password === app.repassword){
      ScryptaCore.createAddress(this.password).then(function(response){
        axios.post('https://'+app.connected+'/init',{
          address:response.pub,
          api_secret:response.api_secret
          
        }).then(function(){
          //this.responseJson=JSON.parse(response)
          response.enc=app.encrypted_wallet;
          responseJson=JSON.stringify(response)
          localStorage.setItem('responseJson',responseJson)
          //console.log(localStorage.getItem('responseJson'))
          
          
         app.navCtrl.navigateRoot('/congratulations');
          console.log(response)
        }).catch(function(err){
          alert("Seems there's a problem, please retry or change node!"+err)

        });
      })
    }else{
      alert('Password is incorrect!')
    }
  }
  /*
  goToHome() {
    if(this.password==this.repassword)
    {
      /*
      ScryptaCore.createAddress(this.password).then((response)=>{
        console.log(response);

      });*/
      /*
      ScryptaCore.createAddress(this.password).then(function(response){
      axios.post('http://localhost').then((response)=>{
        console.log(response);
      })
       });
        
      
    
    this.navCtrl.navigateRoot('/congratulations');
    }

    else{
      alert('le password non coincidono');
      this.password=null;
      this.repassword=null;
      window.location.reload;

    }
  }
  */

}



