type TipoAutos= 'sedan'| 'suv'| '2 puertas'| '4x4'| 'van'| 'carabana'|'';
type TipoDoble=`${TipoAutos}-${TipoAutos}`;
// const humidelAuto:TipoDoble='4x4-suv';
export interface Auto {
 id:number;
 marca:string;
 modelo:string;
 anio:number;
 foto:string;
 tipo:TipoAutos;
 Motor:number;
}
