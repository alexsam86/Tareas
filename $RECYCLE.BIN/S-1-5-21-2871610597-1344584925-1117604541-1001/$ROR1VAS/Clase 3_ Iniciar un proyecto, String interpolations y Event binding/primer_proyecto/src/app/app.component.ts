import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public width: number = 0;
  public mostrarClase: boolean = false;
  public high: number = 0;
  public imagentemporal: string ="";
  public color: string ="";
  public imagen: string = "https://culturacolectiva-cultura-colectiva-prod.cdn.arcpublishing.com/resizer/Q6EN60DSVwE02xiYXOhlhDoI1XU=/1024x768/filters:format(jpg):quality(70)/cloudfront-us-east-1.images.arcpublishing.com/culturacolectiva/BNBRM4YABRGGDLJZ3HQ4JR6ENI.jpeg";
  public imagen2: string = "https://www.adslzone.net/app/uploads-adslzone.net/2019/04/borrar-fondo-imagen.jpg";
  public sumar(n1: number, n2: number): number {
    return n1 + n2;
  }
  public escucharAlto(evento:Event): void {
    const elemento=evento.target as HTMLInputElement;
    this.high= Number.parseInt(elemento.value)
  }
  public escucharAncho(evento:Event): void {
    const elemento=evento.target as HTMLInputElement;
    this.width= Number.parseInt(elemento.value)
  }
  public zoom(): void {
    this.width=this.width*1.5;
    this.high=this.high*1.5;
  }
  public deszoom(): void {
    this.width=this.width/1.5;
    this.high=this.high/1.5;
  }
  public trolleado(): void {
    this.imagentemporal=this.imagen;
    this.imagen=this.imagen2;
    this.zoom();
  }
  public destrolleado(): void {
    this.imagen=this.imagentemporal;
    this.deszoom();
  }
  public cambiocolor(evento:Event): void {
    const elemento=evento.target as HTMLInputElement;
    this.color=elemento.value;
    console.log(elemento.value);
  }
}
