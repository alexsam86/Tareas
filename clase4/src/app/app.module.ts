import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Componente1Component } from './componente1/componente1.component';
import { MostrarImagenComponent } from './Componentes/mostrar-imagen/mostrar-imagen.component';
import { AutosComponent } from './Componentes/autos/autos.component';
import { ListarAutosComponent } from './Componentes/listar-autos/listar-autos.component';
import { AgregarModificarComponent } from './Componentes/agregar-modificar/agregar-modificar.component';
import { FormularioComponent } from './componentes/formulario/formulario.component';

@NgModule({
  declarations: [
    AppComponent,
    Componente1Component,
    MostrarImagenComponent,
    AutosComponent,
    ListarAutosComponent,
    AgregarModificarComponent,
    FormularioComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
