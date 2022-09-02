import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Intento1Component } from './intento1/intento1.component';
import { Intento2Component } from './intento2/intento2.component';

@NgModule({
  declarations: [
    AppComponent,
    Intento1Component,
    Intento2Component
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
