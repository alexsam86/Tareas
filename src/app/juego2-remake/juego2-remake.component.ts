import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-juego2-remake',
  templateUrl: './juego2-remake.component.html',
  styleUrls: ['./juego2-remake.component.scss']
})
export class Juego2RemakeComponent implements OnInit {
  public Meta: number=1000000;
  public powerUpnum: number=1;
  public costePowerUp: number=1;
  public dinero:    number=0;

  public restart(){
    this.powerUpnum=1;
    this.costePowerUp=1;
    this.dinero=0;
  }

  public finalizarJuego(){
    if(this.dinero>=this.Meta){
      alert("felicidades por completar el juego");
    }

    else{
      alert("Lo siento usted no cuenta con suficiente dinero");
    }
  }

  public clickear(){
    this.dinero=this.dinero+(1*this.powerUpnum);
  }

  public powerUp1(){
    if(this.dinero>=this.costePowerUp){
      this.dinero=this.dinero-this.costePowerUp;
      this.costePowerUp=0.5*this.powerUpnum**(2)+this.powerUpnum*0.5
      this.powerUpnum=this.powerUpnum+1;
    }

    else{
      alert("Lo siento usted no cuenta con suficiente dinero");
    }
  }

  constructor() { }

  ngOnInit(): void {
  }

}
