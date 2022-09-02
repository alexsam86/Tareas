import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-intento1',
  templateUrl: './intento1.component.html',
  styleUrls: ['./intento1.component.scss']
})
export class Intento1Component implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
  public botonMostrar: boolean = false;
  public admitido: boolean = false;
  public botonsi():void{
    alert("felicidades usted es W***")
  }
  public botonno():void{
    alert("felicidades usted es W***")
  }
}
