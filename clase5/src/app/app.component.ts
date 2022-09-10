import { Component } from '@angular/core';
import { Auto } from './modelos/auto';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public imagenValquiria:string="https://images6.alphacoders.com/503/thumb-1920-503717.jpg ";
  public imagenValquiria2:string="https://i.pinimg.com/originals/16/a1/c5/16a1c52c84723d5fdb9c3a80d8b97089.jpg";
  public imagenValquiria3:string="https://c4.wallpaperflare.com/wallpaper/655/739/648/ae86-toyota-wallpaper-preview.jpg";

  public listAuto:Auto[]=[
    {
      id:1,anio:2022,foto:'https://hips.hearstapps.com/hmg-prod.s3.amazonaws.com/images/subaru-wrx-sti-ej20-final-edition-1571931933.jpg',marca:'subaru',
      modelo:'WRX',Motor:1.6,tipo:'sedan'
    },
    {
      id:2,anio:2020,foto:'https://chileautos.pxcrush.net/cars/dealer/4kshpeyilwam7awcbbyl01uhb.jpg?pxc_method=limitfill&pxc_bgtype=self&pxc_size=720,480',marca:'toyota',
      modelo:'supra',Motor:3.0,tipo:'2 puertas'
    },
    {
      id:3,anio:2023,foto:'https://acnews.blob.core.windows.net/imgnews/medium/NAZ_56387885f080407190024e3e10df4196.jpg',marca:'BMW',
      modelo:'M5',Motor:3.0,tipo:'2 puertas'
    },
    {
      id:4,anio:1990,foto:'https://cloudfront-us-east-1.images.arcpublishing.com/copesa/RPH3SL6YMNFY3BCK6TOYRU42D4.jpg',marca:'mazda',
      modelo:'rx7 fd',Motor:1.6,tipo:'2 puertas'
    }
  ]
  public guardar(nuevo:Auto):void{
    this.listAuto.push(nuevo);
  }


}
