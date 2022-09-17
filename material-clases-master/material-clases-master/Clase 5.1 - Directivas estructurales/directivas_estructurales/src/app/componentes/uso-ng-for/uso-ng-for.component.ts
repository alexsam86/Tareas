import { Component } from '@angular/core';

interface Persona {
  nombre: string;
  apellido: string;
  edad: number;
}
@Component({
  selector: 'app-uso-ng-for',
  templateUrl: './uso-ng-for.component.html',
  styleUrls: ['./uso-ng-for.component.scss']
})
export class UsoNgForComponent  {
  public personas: Array<Persona> = [
    {
      "nombre": "David Arnold",
      "apellido": "lastname",
      "edad": 21
    },
    {
      "nombre": "Paul Shaffer",
      "apellido": "lastname",
      "edad": 35
    },
    {
      "nombre": "Jaime Andrews",
      "apellido": "lastname",
      "edad": 45
    },
    {
      "nombre": "Alisa Ayala",
      "apellido": "lastname",
      "edad": 23
    },
    {
      "nombre": "Malachi Cunningham",
      "apellido": "lastname",
      "edad": 60
    },
    {
      "nombre": "Coby Hendrix",
      "apellido": "lastname",
      "edad": 70
    },
    {
      "nombre": "Leah Frank",
      "apellido": "lastname",
      "edad": 55
    },
    {
      "nombre": "Kristen Pope",
      "apellido": "lastname",
      "edad": 82
    },
    {
      "nombre": "Omar Adkins",
      "apellido": "lastname",
      "edad": 62
    },
    {
      "nombre": "Fleur Robles",
      "apellido": "lastname",
      "edad": 62
    }
  ]

}
