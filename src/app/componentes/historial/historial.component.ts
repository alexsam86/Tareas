import { Component,Input} from '@angular/core';
import { Alumno } from 'src/app/Modelos/alumno';
import { Historial } from 'src/app/Modelos/historial';
@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.scss']
})
export class HistorialComponent {
  @Input() public listarAlumnos:Alumno[]=[]
  @Input() public historial!:Historial;
}
