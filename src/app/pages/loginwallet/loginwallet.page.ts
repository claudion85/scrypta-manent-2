import { Component, OnInit } from '@angular/core';
import { NFC, Ndef } from '@ionic-native/nfc/ngx';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner/ngx';
@Component({
  selector: 'app-loginwallet',
  templateUrl: './loginwallet.page.html',
  styleUrls: ['./loginwallet.page.scss'],
})
export class LoginwalletPage implements OnInit {

  constructor(private nfc:NFC,private ndef:Ndef,private qrScanner: QRScanner) { }

  ngOnInit() {
   
  }



  readNfc()
  {
    let nfcreader=this.nfc.addNdefListener(()=>{
      alert('successfull attached ndef');
    },(err)=>{
      alert('errore ndef');

    }).subscribe((event)=>{
      alert('decoded tag id'+ this.nfc.bytesToHexString(event.tag.id));
      let message = this.ndef.textRecord('Hello world');
      this.nfc.share([message]).then().catch();
    })
    nfcreader.unsubscribe();
    
  }


  readQrCode()
  {
    this.qrScanner.prepare()
  .then((status: QRScannerStatus) => {
     if (status.authorized) {
       // camera permission was granted


       // start scanning
       let scanSub = this.qrScanner.scan().subscribe((text: string) => {
         console.log('Scanned something', text);

         this.qrScanner.hide(); // hide camera preview
         scanSub.unsubscribe(); // stop scanning
       });

     } else if (status.denied) {
       // camera permission was permanently denied
       // you must use QRScanner.openSettings() method to guide the user to the settings page
       // then they can grant the permission from there
     } else {
       // permission was denied, but not permanently. You can ask for permission again at a later time.
     }
  })
  .catch((e: any) => console.log('Error is', e));
  }
  
}
