import { Component } from '@angular/core';
import { Pokemon } from './modelos/pokemon';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public imagenValkiquiria: string = 'https://www.seresmitologicos.net/wp-content/uploads/2011/06/valquiria_heroe.jpg';
  public kratos: string = 'httpss://i.blogs.es/405bdf/1366_2000/450_1000.webp';
  public domCanela: string = 'https://as01.epimg.net/meristation/imagenes/2020/03/24/noticias/1585048264_453149_1585049908_noticia_normal.jpg';

  public listaPokemon: Array<Pokemon> = [
    {
      numpd: 1,
      nombre: 'Bulbasaur',
      foto: 'https://i.pinimg.com/564x/82/42/25/824225f61b9e0efb7e7405f8c9579f6c--pokemon-bulbasaur-pikachu.jpg',
      tipo: 'Veneno',
      debilidades: 'Fuego',
      descripcion: 'Un pokemon de planta :D y veneno'
    },
    {
      numpd: 2,
      nombre: 'Ivysaur',
      foto: 'https://http2.mlstatic.com/D_NQ_NP_850811-MLC45305937887_032021-O.jpg',
      tipo: 'Veneno',
      debilidades: 'Fuego',
      descripcion: 'Otro de pokemon de planta y veneno'
    }
  ]

  public guardar(nuevo: Pokemon): void {
    this.listaPokemon.push(nuevo);
  }
}
