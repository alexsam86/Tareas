import { Component, Input, Output,EventEmitter} from '@angular/core';
import { Seccion } from './../../Modelos/seccion';
import { Historial } from './../../Modelos/historial';
import { Alumno } from './../../Modelos/alumno';

@Component({
  selector: 'app-alumno',
  templateUrl: './alumno.component.html',
  styleUrls: ['./alumno.component.scss']
})
export class AlumnoComponent {
  @Input() alumno!:Alumno;
}
