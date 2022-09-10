import { Component, Input} from '@angular/core';
import {Auto} from './../../modelos/auto';
@Component({
  selector: 'app-autos',
  templateUrl: './autos.component.html',
  styleUrls: ['./autos.component.scss']
})
export class AutosComponent {
  @Input() public auto!: Auto;

}
