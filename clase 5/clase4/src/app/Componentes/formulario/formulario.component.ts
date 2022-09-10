import { Component,Output,EventEmitter } from '@angular/core';
import { Auto,TipoAutos } from '../../modelos/auto';
@Component({
  selector: 'app-formulario',
  templateUrl: './formulario.component.html',
  styleUrls: ['./formulario.component.scss']
})
export class FormularioComponent{
  @Output()
  public enviaruwu=new EventEmitter<Auto>();

  public arrayparatipo:string[]=['sedan', 'suv', '2 puertas', '4x4','van','carabana','']
  public autitonuevo:Auto={
    id:0,
    Motor:0,
    anio:0,
    foto:'',
    marca:'',
    modelo:'',
    tipo:'sedan',
  }
  public cambiarid(evento:Event):void{
    const variablexd=evento.target as HTMLInputElement;
    this.autitonuevo.id=Number.parseInt(variablexd.value)||0;
  }
  public cambiaranio(evento:Event):void{
    const variablexd=evento.target as HTMLInputElement;
    this.autitonuevo.anio=Number.parseInt(variablexd.value)||0;
  }
  public cambiarMotor(evento:Event):void{
    const variablexd=evento.target as HTMLInputElement;
    this.autitonuevo.Motor=Number.parseInt(variablexd.value)||0;
  }

  public cambiarmarca(evento:Event):void{
    const variablexd=evento.target as HTMLInputElement;
    this.autitonuevo.marca=variablexd.value||'';
  }

  public cambiarmodelo(evento:Event):void{
    const variablexd=evento.target as HTMLInputElement;
    this.autitonuevo.modelo=variablexd.value||'';
  }

  public cambiarfoto(evento:Event):void{
    const variablexd=evento.target as HTMLInputElement;
    this.autitonuevo.foto=variablexd.value||'';
  }

  public cambiartipo(evento:Event):void{
    const variablexd=evento.target as HTMLSelectElement;
    this.autitonuevo.tipo=variablexd.value as TipoAutos;
  }
  public guardar():void{
    const copia: Auto={
      ...this.autitonuevo
    }
    this.enviaruwu.emit(copia);
    this.autitonuevo.id=0;
    this.autitonuevo.Motor=0;
    this.autitonuevo.anio=0;
    this.autitonuevo.foto='';
    this.autitonuevo.marca='';
    this.autitonuevo.modelo='';
    this.autitonuevo.tipo='sedan';
  }

}
