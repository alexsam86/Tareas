export type TipoPokemon = 'Fuego' | 'Agua' | 'Roca' | 'Volador' | 'Veneno' | 'Nada';
type TipoDoble = `${TipoPokemon}-${TipoPokemon}-${TipoPokemon}`;
enum EnumPokemon {
  FUEGO = 'Fuego',
  AGUA = 'Agua',
  ROCA = 'Roca',
  VOLADOR ='Volador'
}
const humidelPokemon: EnumPokemon = EnumPokemon.ROCA;

export interface Pokemon {
  numpd: number;
  nombre: string;
  foto: string;
  descripcion: string;
  tipo: TipoPokemon;
  debilidades: TipoPokemon;
}
