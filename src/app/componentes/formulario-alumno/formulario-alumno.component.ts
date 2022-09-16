import { Component,EventEmitter,Output,Input} from '@angular/core';
import { Alumno } from 'src/app/Modelos/alumno';
import { Seccion } from 'src/app/Modelos/seccion';

@Component({
  selector: 'app-formulario-alumno',
  templateUrl: './formulario-alumno.component.html',
  styleUrls: ['./formulario-alumno.component.scss']
})
export class FormularioAlumnoComponent{
  @Input() public secciones:Seccion[]=[]
  @Output() enviaralumno=new EventEmitter<Alumno>();
  public alumnoregistro:Alumno={
    rut:'',
    nombre:'',
    apellido:'',
    edad:0,
    seccionorigen:{id:0,nombre_seccion:''},
  }

  public cambiarut(evento:Event):void{
    const elemento = evento.target as HTMLInputElement;
    this.alumnoregistro.rut =elemento.value;
  }

  public cambianombre(evento:Event):void{
    const elemento = evento.target as HTMLInputElement;
    this.alumnoregistro.nombre =elemento.value;
  }

  public cambiaapellido(evento:Event):void{
    const elemento = evento.target as HTMLInputElement;
    this.alumnoregistro.apellido =elemento.value;
  }

  public cambiaedad(evento:Event):void{
    const elemento = evento.target as HTMLInputElement;
    this.alumnoregistro.edad =parseInt(elemento.value)||0;
  }

  public cambiaseccion(evento:Event):void{
    const elemento = evento.target as HTMLSelectElement;
    this.alumnoregistro.seccionorigen.nombre_seccion =elemento.value;
  }

  public confirmaralumno():void{
    const copia:Alumno={
      ...this.alumnoregistro
    }
    this.enviaralumno.emit(copia)
  }
}
