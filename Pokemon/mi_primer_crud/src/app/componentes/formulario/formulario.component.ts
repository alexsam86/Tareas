import { Component, Output, EventEmitter } from '@angular/core';
import { Pokemon, TipoPokemon } from './../../modelos/pokemon';
@Component({
  selector: 'app-formulario',
  templateUrl: './formulario.component.html',
  styleUrls: ['./formulario.component.scss']
})
export class FormularioComponent {
  @Output()
  public enviar = new EventEmitter<Pokemon>();

  public tipos: Array<string> = [
    'Fuego' ,
    'Agua' ,
    'Roca' ,
    'Volador' ,
    'Veneno' ,
    'Nada'
  ]
  public pokemon: Pokemon = {
    numpd: 0,
    nombre: '',
    descripcion: '',
    foto: '',
    tipo: 'Agua',
    debilidades: 'Agua'
  }

  public cambiarNumpd(evento: Event): void {
    const variable = evento.target as HTMLInputElement;
    this.pokemon.numpd = Number.parseInt(variable.value) || 0;
  }

  public cambiarFoto(evento: Event): void {
    const elemento = evento.target as HTMLInputElement;
    this.pokemon.foto = elemento.value;
  }

  public cambiarNombre(evento: Event): void {
    const elemento = evento.target as HTMLInputElement;
    this.pokemon.nombre = elemento.value;
  }

  public cambiarDes(evento: Event): void {
    const elemento = evento.target as HTMLInputElement;
    this.pokemon.descripcion = elemento.value;
  }

  public cambiarTipo(evento: Event): void {
    const elemento = evento.target as HTMLSelectElement;
    this.pokemon.tipo = elemento.value as TipoPokemon;
  }

  public cambiarDebi(evento: Event): void {
    const elemento = evento.target as HTMLSelectElement;
    this.pokemon.debilidades = elemento.value as TipoPokemon;
  }

  public guardar():void {
    const copia: Pokemon = {
      ...this.pokemon
    }
    this.enviar.emit(copia);
    this.pokemon.numpd = 0;
    this.pokemon.nombre = '';
    this.pokemon.descripcion = '';
    this.pokemon.foto = '';
    this.pokemon.tipo = 'Agua';
    this.pokemon.debilidades = 'Agua';
  }
}
