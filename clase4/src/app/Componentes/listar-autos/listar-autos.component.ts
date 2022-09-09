import { Component, Input} from '@angular/core';
import { Auto } from './../../modelos/auto';

@Component({
  selector: 'app-listar-autos',
  templateUrl: './listar-autos.component.html',
  styleUrls: ['./listar-autos.component.scss']
})
export class ListarAutosComponent  {
 @Input() public autos:Auto[]=[];

}
