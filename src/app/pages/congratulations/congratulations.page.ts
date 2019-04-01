
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, MenuController, ToastController, AlertController, LoadingController,NavParams } from '@ionic/angular';
//import { File } from '@ionic-native/file/ngx';
//import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';

@Component({
  selector: 'app-congratulations',
  templateUrl: './congratulations.page.html',
  styleUrls: ['./congratulations.page.scss'],
})
export class CongratulationsPage implements OnInit {
  sidFile:string;
  value:any;

  constructor(
    public navCtrl: NavController,
    //private file:File,
    //private transfer:FileTransfer



  ) { }

  ngOnInit() {
    this.value=localStorage.getItem('responseJson')
    //console.log(JSON.parse(this.value))
    var credential=JSON.parse(this.value);
    //this.value=this.navPar.get('credential') 
    //console.log(this.value)
    console.log(credential.pub)
    var a=document.getElementById('downloadsid');
    var files=new Blob([credential.pub+':'+credential.enc],{type:'sid'})
    //var aa=this.file.createFile('',credential.pub+'.sid',true)
    //const fileTransfer:FileTransferObject=this.transfer.create();
    const url='asdasdasd';
    //fileTransfer.download(url,this.file.dataDirectory+credential.pub+'.sid');
    
  }


  goToLog()
  {
    this.navCtrl.navigateRoot('/loginwallet');

  }

  prev()
  {
    history.go(-1);
  }

}
