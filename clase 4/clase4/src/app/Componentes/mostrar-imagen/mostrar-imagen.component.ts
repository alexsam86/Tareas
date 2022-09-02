import { Component} from '@angular/core';

@Component({
  selector: 'app-mostrar-imagen',
  templateUrl: './mostrar-imagen.component.html',
  styleUrls: ['./mostrar-imagen.component.scss']
})
export class MostrarImagenComponent {
  public imagen:string="https://images6.alphacoders.com/503umb-1920-503717.jpg";
  public imagenalt:string="https://siempreauto.com/wp-content/uploads/sites/9/2021/05/anastase-maragos-Lrfuy93_hAc-unsplash.jpg?quality=60&strip=all&w=1200";
  public imagenerror():void{
    this.imagen=this.imagenalt;
    console.log("la imagen no cargo, aqui tiene otra mi rey")
  }
}
