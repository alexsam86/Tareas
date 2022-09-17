import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mostrar-imagen',
  templateUrl: './mostrar-imagen.component.html',
  styleUrls: ['./mostrar-imagen.component.scss']
})
export class MostrarImagenComponent {
  @Input()
  public imagen: string = '';
  public imagenError: string = 'https://cdn.memegenerator.es/imagenes/memes/full/30/87/30871063.jpg';

  public cambiarImagen(): void {
    this.imagen = this.imagenError;
  }
}
