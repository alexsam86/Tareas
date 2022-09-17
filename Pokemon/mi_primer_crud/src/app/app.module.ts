import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { MostrarImagenComponent } from './componentes/mostrar-imagen/mostrar-imagen.component';
import { PokemonComponent } from './componentes/pokemon/pokemon.component';
import { ListarPokemonesComponent } from './componentes/listar-pokemones/listar-pokemones.component';
import { FormularioComponent } from './componentes/formulario/formulario.component';

@NgModule({
  declarations: [
    AppComponent,
    MostrarImagenComponent,
    PokemonComponent,
    ListarPokemonesComponent,
    FormularioComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
