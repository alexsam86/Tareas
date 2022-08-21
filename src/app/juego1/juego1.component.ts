import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-juego1',
  templateUrl: './juego1.component.html',
  styleUrls: ['./juego1.component.scss']
})
export class Juego1Component implements OnInit {
  public resultado: number=0;
  public power: number=1;
  public Faltante: number=1000000;
  public sumar(){
    this.resultado=this.resultado+(1*this.power);
    this.Faltante=this.Faltante-(1*this.power);
    if(this.Faltante<=0){
      alert("Felicidades por completar el juego")
    }
  }
  public powerup(){
    if (this.resultado>=this.power*150)
      {
        this.power=this.power+1;
        this.resultado=this.resultado-(this.power-1)*150;
      }
    else{
      alert("Aun no cuenta con suficiente puntaje.")
    }
  }
  public Restart():void{
    this.resultado=0;
    this.power=1;
    return;
  }
  constructor() { }

  ngOnInit(): void {
  }

}
