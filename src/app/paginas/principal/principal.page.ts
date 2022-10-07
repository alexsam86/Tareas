import { Component} from '@angular/core';
import { AlertController } from '@ionic/angular';
@Component({
  selector: 'app-principal',
  templateUrl: './principal.page.html',
  styleUrls: ['./principal.page.scss'],
})
export class PrincipalPage {
  // dark mode toggle
  public funciondark():void{
    document.body.classList.toggle("dark");

  }
  // Alert
  constructor(private alertController: AlertController) {}

  async presentAlert() {
    const alert = await this.alertController.create({
      header: 'Alerta',
      subHeader: 'Se ha detectado cambio en el modo.',
      message: 'Modo oscuro ha cambiado.',
      buttons: ['Aceptar'],
    });

    await alert.present();
  }

  // refrecher controler
  doRefresh(event) {
    console.log('Begin async operation');

    setTimeout(() => {
      console.log('Async operation has ended');
      event.target.complete();
    }, 2000);
  }


}
