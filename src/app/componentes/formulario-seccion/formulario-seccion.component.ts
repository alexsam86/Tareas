import { Seccion } from 'src/app/Modelos/seccion';
import { Component,Output,EventEmitter} from '@angular/core';

@Component({
  selector: 'app-formulario-seccion',
  templateUrl: './formulario-seccion.component.html',
  styleUrls: ['./formulario-seccion.component.scss']
})
export class FormularioSeccionComponent{
  @Output() public enviarseccion = new EventEmitter<Seccion>();
  public nuevaseccion:Seccion={
    id:0,
    nombre_seccion:'',
  }
  public idactual:number=2;
  public nombreseccionevent(evento:Event):void{
    const elemento = evento.target as HTMLInputElement;
    this.nuevaseccion.nombre_seccion=elemento.value;
  }
  public confirmarseccion():void{
    this.idactual=this.idactual+1;
    this.nuevaseccion.id=this.idactual;
    const copia:Seccion={
      ...this.nuevaseccion
    }
    this.enviarseccion.emit(copia);
  }
}
