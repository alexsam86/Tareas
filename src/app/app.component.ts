import { Component } from '@angular/core';
import { Seccion } from './Modelos/seccion';
import { Historial } from './Modelos/historial';
import { Alumno } from './Modelos/alumno';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Sammy Alayoubi Hernandez';
  public arrayseccion:[Seccion]=[
    {
      id:1,
      nombre_seccion:'007D',
    },
  ]
  public arrayalumno:[Alumno]=[
    {
      rut:'21729588-2',
      apellido:'alayoubi Hernandez',
      edad:20,
      nombre:'sammy',
      seccionorigen:{id:1,nombre_seccion:'007'},
    },
  ]
  public arrayhistorial:[Historial]=[
    {
      alumnoregistro:{ rut:'',apellido:'',edad:0,nombre:'',seccionorigen:{id:0,nombre_seccion:''} },
      fecha:'',
    },
  ]
  public escucharseccion(evento:Seccion):void{
    this.arrayseccion.push(evento);
  }
  public escucharalumno(evento:Alumno):void{
    this.arrayalumno.push(evento);
  }
}
