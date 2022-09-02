import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Juego1Component } from './juego1/juego1.component';
import { Juego2RemakeComponent } from './juego2-remake/juego2-remake.component';

@NgModule({
  declarations: [
    AppComponent,
    Juego1Component,
    Juego2RemakeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
