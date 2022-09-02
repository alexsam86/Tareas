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
      id:1,anio:2022,foto:'',marca:'subaru',
      modelo:'WRX',Motor:1.6,tipo:'sedan'
    },
    {
      id:2,anio:2020,foto:'',marca:'toyota',
      modelo:'supra',Motor:3.0,tipo:'2 puertas'
    },
    {
      id:3,anio:2023,foto:'',marca:'BMW',
      modelo:'M5',Motor:3.0,tipo:'2 puertas'
    }
  ]

}
