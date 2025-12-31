export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum ObstacleType {
  CACTUS_SMALL = 'CACTUS_SMALL',
  CACTUS_LARGE = 'CACTUS_LARGE',
  PTERODACTYL = 'PTERODACTYL',
  ROCK = 'ROCK',
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Size3D {
  w: number; // width (x axis size)
  d: number; // depth (y axis size)
  h: number; // height (z axis size)
}

export interface Entity {
  id: number;
  type: 'player' | 'obstacle' | 'ground' | 'decoration' | 'decoration_rock' | 'detail_patch' | 'detail_ripple' | 'detail_speckle' | 'detail_pebble' | 'cloud' | 'particle';
  pos: Point3D;
  size: Size3D;
  color: string;
  velocity?: Point3D;
  obstacleType?: ObstacleType;
  animOffset?: Point3D;
  squashFactor?: number;
  parallax?: number; // Add parallax to type
  dinoRef?: Entity; // Used in proxies
}

export interface Particle {
  id: number;
  pos: Point3D;
  velocity: Point3D;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface GameConfig {
  gravity: number;
  jumpForce: number;
  speed: number;
  maxSpeed: number;
  acceleration: number;
  groundY: number;
}
