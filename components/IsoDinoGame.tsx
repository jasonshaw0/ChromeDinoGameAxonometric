
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameState,
  Entity,
  ObstacleType,
  Particle,
  Point3D,
  Size3D
} from '../types';
import {
  GRAVITY,
  JUMP_FORCE,
  INITIAL_SPEED,
  MAX_SPEED,
  SPEED_INCREMENT,
  VOXEL_SIZE,
  DINO_SIZE,
  COLORS,
  CACTUS_SMALL_SIZE,
  CACTUS_LARGE_SIZE,
  PTERODACTYL_SIZE,
  ROCK_SIZE,
  LANE_WIDTH
} from '../constants';
import { drawCube, toScreen } from '../utils/iso';

const GROUND_SURFACE_Z = 0; // Top of the ground slab (aligns with physics ground)
const GROUND_DEPTH = 38;
const PATH_THICKNESS = 0.2;
const PATH_WIDTH = LANE_WIDTH + 4;
const DETAIL_OVERLAY_Z = GROUND_SURFACE_Z;
const PATH_SURFACE_Z = GROUND_SURFACE_Z;

const IsoDinoGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Game State Refs
  const gameStateRef = useRef<GameState>(GameState.START);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const speedRef = useRef<number>(INITIAL_SPEED);
  const distanceRef = useRef<number>(0);

  const timeRef = useRef<number>(0); // Global time for animations

  // Entities
  const dinoRef = useRef<Entity>({
    id: 0,
    type: 'player',
    pos: { x: 0, y: 0, z: GROUND_SURFACE_Z },
    size: DINO_SIZE,
    color: COLORS.DINO_SKIN,
    velocity: { x: 0, y: 0, z: 0 },
    animOffset: { x: 0, y: 0, z: 0 },
    squashFactor: 0
  });

  const obstaclesRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cloudsRef = useRef<Entity[]>([]);
  const lastGroundedRef = useRef<boolean>(true);

  // React State for UI
  const [uiState, setUiState] = useState<GameState>(GameState.START);
  const [highScore, setHighScore] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [isCocaineMode, setIsCocaineMode] = useState<boolean>(false);
  const [isNight, setIsNight] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(true);
  const cocaineModeRef = useRef<boolean>(false);
  const isNightRef = useRef<boolean>(false);

  // Input Handling
  const handleJump = useCallback(() => {
    if (gameStateRef.current !== GameState.PLAYING) {
      if (gameStateRef.current === GameState.START || gameStateRef.current === GameState.GAME_OVER) {
        resetGame();
      }
      return;
    }

    if (dinoRef.current.pos.z <= GROUND_SURFACE_Z) {
      dinoRef.current.velocity!.z = JUMP_FORCE;
      dinoRef.current.squashFactor = -0.3; // Stretch on jump
      createDust(dinoRef.current.pos.x, dinoRef.current.pos.y, 8); // Jump dust
    }
  }, []);

  const handleDuck = useCallback((ducking: boolean) => {
    if (gameStateRef.current === GameState.PLAYING) {
      if (ducking) {
        dinoRef.current.size = { ...DINO_SIZE, h: DINO_SIZE.h / 2 };
      } else {
        dinoRef.current.size = DINO_SIZE;
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleDuck(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        handleDuck(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleJump, handleDuck]);

  const initClouds = () => {
    const clouds: Entity[] = [];
    for (let i = 0; i < 8; i++) {
      clouds.push({
        id: i,
        type: 'cloud',
        pos: {
          x: Math.random() * 2000,
          y: (Math.random() - 0.5) * 800,
          z: 150 + Math.random() * 50
        },
        size: { w: 60 + Math.random() * 40, d: 30 + Math.random() * 20, h: 5 },
        color: '#ffffff'
      });
    }
    cloudsRef.current = clouds;
  };

  const resetGame = () => {
    gameStateRef.current = GameState.PLAYING;
    setUiState(GameState.PLAYING);
    scoreRef.current = 0;
    setCurrentScore(0);
    speedRef.current = INITIAL_SPEED;
    distanceRef.current = 0;

    timeRef.current = 0;

    dinoRef.current = {
      id: 0,
      type: 'player',
      pos: { x: 0, y: 0, z: GROUND_SURFACE_Z },
      size: DINO_SIZE,
      color: COLORS.DINO_SKIN,
      velocity: { x: 0, y: 0, z: 0 },
      animOffset: { x: 0, y: 0, z: 0 },
      squashFactor: 0
    };

    obstaclesRef.current = [];
    particlesRef.current = [];
    initClouds();
    lastGroundedRef.current = true;
    setIsNight(false);
    isNightRef.current = false;
  };

  const forceReset = () => {
    gameStateRef.current = GameState.START;
    setUiState(GameState.START);
    scoreRef.current = 0;
    setCurrentScore(0);
    speedRef.current = INITIAL_SPEED;
    distanceRef.current = 0;
    timeRef.current = 0;
    dinoRef.current = {
      id: 0,
      type: 'player',
      pos: { x: 0, y: 0, z: GROUND_SURFACE_Z },
      size: DINO_SIZE,
      color: COLORS.DINO_SKIN,
      velocity: { x: 0, y: 0, z: 0 },
      animOffset: { x: 0, y: 0, z: 0 },
      squashFactor: 0
    };
    obstaclesRef.current = [];
    particlesRef.current = [];
    setIsNight(false);
    isNightRef.current = false;
  };

  // Initialize clouds on load
  useEffect(() => {
    initClouds();
  }, []);

  const createDust = (x: number, y: number, count: number = 3) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        id: Math.random(),
        pos: { x: x + (Math.random() - 0.5) * 8, y: y + (Math.random() - 0.5) * 8, z: GROUND_SURFACE_Z },
        velocity: { x: -Math.random() * 4, y: (Math.random() - 0.5) * 3, z: Math.random() * 3 },
        life: 15 + Math.random() * 15,
        maxLife: 30,
        size: 1 + Math.random() * 2,
        color: COLORS.SAND_DETAIL
      });
    }
  };

  const spawnObstaclePattern = (startX: number) => {
    const score = scoreRef.current;
    const allowBirds = score > 300;
    const allowRocks = score > 100;

    let pattern = 'SINGLE';
    if (score > 500 && Math.random() > 0.6) pattern = 'TRIPLE';
    else if (score > 200 && Math.random() > 0.7) pattern = 'DOUBLE';
    else if (allowBirds && Math.random() > 0.7) pattern = 'BIRD';
    else if (allowRocks && Math.random() > 0.7) pattern = 'ROCK';

    switch (pattern) {
      case 'TRIPLE':
        for (let i = 0; i < 3; i++) {
          obstaclesRef.current.push(createObstacle(startX + i * 25, ObstacleType.CACTUS_SMALL));
        }
        break;
      case 'DOUBLE':
        if (Math.random() > 0.5) {
          obstaclesRef.current.push(createObstacle(startX, ObstacleType.CACTUS_SMALL));
          obstaclesRef.current.push(createObstacle(startX + 25, ObstacleType.CACTUS_SMALL));
        } else {
          obstaclesRef.current.push(createObstacle(startX, ObstacleType.ROCK));
          obstaclesRef.current.push(createObstacle(startX + 35, ObstacleType.ROCK));
        }
        break;
      case 'BIRD':
        const high = Math.random() > 0.5;
        obstaclesRef.current.push(createObstacle(startX, ObstacleType.PTERODACTYL, high ? 16 : 6));
        break;
      case 'ROCK':
        obstaclesRef.current.push(createObstacle(startX, ObstacleType.ROCK));
        break;
      default:
        const type = Math.random() > 0.6 ? ObstacleType.CACTUS_LARGE : ObstacleType.CACTUS_SMALL;
        obstaclesRef.current.push(createObstacle(startX, type));
    }
  };

  const createObstacle = (x: number, type: ObstacleType, zOffset: number = 0): Entity => {
    let size = CACTUS_SMALL_SIZE;
    let color = COLORS.CACTUS_MAIN;
    let z = GROUND_SURFACE_Z;

    switch (type) {
      case ObstacleType.CACTUS_LARGE:
        size = CACTUS_LARGE_SIZE;
        break;
      case ObstacleType.PTERODACTYL:
        size = PTERODACTYL_SIZE;
        color = COLORS.BIRD_BODY;
        z = GROUND_SURFACE_Z + zOffset;
        break;
      case ObstacleType.ROCK:
        size = ROCK_SIZE;
        color = COLORS.ROCK_DARK;
        break;
      default:
        size = CACTUS_SMALL_SIZE;
    }

    return {
      id: Date.now() + Math.random(),
      type: 'obstacle',
      obstacleType: type,
      pos: { x: x, y: 0, z: z },
      size: size,
      color: color
    };
  };

  const checkCollision = (dino: Entity, obs: Entity): boolean => {
    const padX = 4;
    const padY = 0;
    const padZ = 3;

    const dX = dino.pos.x + dino.size.w / 2;
    const dY = dino.pos.y + dino.size.d / 2;
    const dZ = dino.pos.z + dino.size.h / 2;

    const oX = obs.pos.x + obs.size.w / 2;
    const oY = obs.pos.y + obs.size.d / 2;
    const oZ = obs.pos.z + obs.size.h / 2;

    const halfDW = dino.size.w / 2 - padX;
    const halfDD = dino.size.d / 2 - padY;
    const halfDH = dino.size.h / 2 - padZ;

    const halfOW = obs.size.w / 2 - padX;
    const halfOD = obs.size.d / 2 - padY;
    const halfOH = obs.size.h / 2 - padZ;

    const collision =
      Math.abs(dX - oX) < (halfDW + halfOW) &&
      Math.abs(dY - oY) < (halfDD + halfOD) &&
      Math.abs(dZ - oZ) < (halfDH + halfOH);

    return collision;
  };

  const update = (dt: number) => {
    timeRef.current += dt * 0.001;

    // Cloud update (always drift)
    cloudsRef.current.forEach(c => {
      c.pos.x += 0.2;
      if (c.pos.x > distanceRef.current + 2000) {
        c.pos.x = distanceRef.current - 1000;
      }
      // Bob clouds slightly
      c.pos.z = c.pos.z + Math.sin(timeRef.current + c.id) * 0.05;
    });

    if (gameStateRef.current !== GameState.PLAYING) return;



    const effectiveMaxSpeed = cocaineModeRef.current ? MAX_SPEED * 8 : MAX_SPEED;
    const effectiveIncrement = cocaineModeRef.current ? SPEED_INCREMENT * 10 : SPEED_INCREMENT;

    if (speedRef.current < effectiveMaxSpeed) {
      speedRef.current += effectiveIncrement;
    } else if (speedRef.current > effectiveMaxSpeed) {
      speedRef.current = Math.max(effectiveMaxSpeed, speedRef.current - effectiveIncrement * 2);
    }

    distanceRef.current += speedRef.current;
    scoreRef.current = Math.floor(distanceRef.current / 30);
    setCurrentScore(scoreRef.current);

    // Day/Night Cycle (Every 700 points)
    const newNight = Math.floor(scoreRef.current / 700) % 2 === 1;
    if (newNight !== isNightRef.current) {
      isNightRef.current = newNight;
      setIsNight(newNight);
    }

    const dino = dinoRef.current;
    const wasGrounded = lastGroundedRef.current;

    dino.velocity!.z -= GRAVITY;
    dino.pos.z += dino.velocity!.z;

    // Squash Logic
    if (dino.squashFactor && Math.abs(dino.squashFactor) > 0.01) {
      dino.squashFactor *= 0.85; // Decay
    } else {
      dino.squashFactor = 0;
    }

    if (dino.pos.z <= GROUND_SURFACE_Z) {
      dino.pos.z = GROUND_SURFACE_Z;
      dino.velocity!.z = 0;
      lastGroundedRef.current = true;

      if (!wasGrounded) {
        createDust(dino.pos.x + 5, dino.pos.y, 6);
        dino.squashFactor = 0.4; // Impact squash

        // "Stomp" effect - extra dust burst
        for (let i = 0; i < 5; i++) {
          particlesRef.current.push({
            id: Math.random(),
            pos: { x: dino.pos.x + (Math.random() - 0.5) * 10, y: dino.pos.y + (Math.random() - 0.5) * 10, z: GROUND_SURFACE_Z },
            velocity: { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5, z: Math.random() * 2 },
            life: 10 + Math.random() * 10,
            maxLife: 20,
            size: 2 + Math.random() * 2,
            color: COLORS.GROUND_BASE
          });
        }
      }

      if (Math.random() > 0.85) {
        createDust(dino.pos.x, dino.pos.y, 1);
      }
    } else {
      lastGroundedRef.current = false;
    }
    dino.pos.x = distanceRef.current;

    const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
    const spawnDist = lastObs ? lastObs.pos.x : distanceRef.current;

    const airTime = 2 * JUMP_FORCE / GRAVITY;
    const jumpDist = airTime * speedRef.current;
    const minGap = jumpDist + 80 + (Math.random() * 80);

    if (distanceRef.current + 1200 > spawnDist + minGap) {
      spawnObstaclePattern(spawnDist + minGap);
    }

    obstaclesRef.current = obstaclesRef.current.filter(obs => obs.pos.x > distanceRef.current - 250);

    for (const obs of obstaclesRef.current) {
      if (checkCollision(dino, obs)) {
        gameStateRef.current = GameState.GAME_OVER;
        setUiState(GameState.GAME_OVER);
        if (!cocaineModeRef.current) {
          setHighScore(prev => Math.max(prev, scoreRef.current));
        }
      }
    }

    // Auto-play logic (Cocaine Mode)
    if (cocaineModeRef.current && gameStateRef.current === GameState.PLAYING) {
      const nearestObs = obstaclesRef.current.find(obs => obs.pos.x > dino.pos.x);
      if (nearestObs) {
        const dist = nearestObs.pos.x - dino.pos.x;
        const jumpThreshold = speedRef.current * 20;
        const duckThreshold = speedRef.current * 24;

        if (dist < jumpThreshold) {
          const isHighBird = nearestObs.obstacleType === ObstacleType.PTERODACTYL && nearestObs.pos.z > GROUND_SURFACE_Z + 8;
          if (isHighBird) {
            if (dist < duckThreshold) handleDuck(true);
          } else {
            handleJump();
          }
        } else {
          handleDuck(false);
        }
      } else {
        handleDuck(false);
      }
    }

    particlesRef.current.forEach(p => {
      p.pos.x += p.velocity.x;
      p.pos.y += p.velocity.y;
      p.pos.z += p.velocity.z;
      p.velocity.z -= GRAVITY * 0.5;
      if (p.pos.z < GROUND_SURFACE_Z) {
        p.pos.z = GROUND_SURFACE_Z;
        if (p.velocity.z < 0) p.velocity.z = 0;
      }
      p.life--;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);
  };

  // ---------------- RENDERING ----------------

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const skyTop = isNight ? '#0f172a' : COLORS.SKY_TOP;
    const skyBottom = isNight ? '#1e293b' : COLORS.SKY_BOTTOM;

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, skyTop);
    grad.addColorStop(1, skyBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const parallaxX = distanceRef.current;

    // Draw Clouds
    cloudsRef.current.forEach(c => {
      // Project cloud manually to ignore camera X partially for parallax
      const scale = VOXEL_SIZE;
      const cx = width * 0.3;
      const cy = height * 0.8;

      const relX = (c.pos.x - parallaxX) * 0.05 + c.pos.x * 0.1; // Slow parallax
      const wrappedX = ((relX % 3000) + 3000) % 3000 - 1000;

      const p = toScreen(wrappedX + parallaxX, c.pos.y, c.pos.z, cx, cy, scale);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      // Simple puff cloud
      const s = c.size.w * scale * 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, s, 0, Math.PI * 2);
      ctx.arc(p.x + s, p.y + s * 0.2, s * 0.8, 0, Math.PI * 2);
      ctx.arc(p.x - s * 0.8, p.y + s * 0.1, s * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Heat Haze Distortion (Subtle oscillating patches in distance)
    const hazeTime = timeRef.current * 2;
    for (let i = 0; i < 5; i++) {
      const hX = ((parallaxX * 0.4 + i * 400) % 2000);
      const hY = height * 0.7 + Math.sin(hazeTime + i) * 10;
      ctx.fillStyle = COLORS.HEAT_HAZE;
      ctx.fillRect(hX - 200, hY, 400, 150);
    }

    const mFar = isNight ? '#0f172a' : COLORS.MOUNTAIN_FAR;
    const mNear = isNight ? '#1e293b' : COLORS.MOUNTAIN_NEAR;

    drawLandscapeLayer(ctx, width, height, parallaxX * 0.05, mFar, 250, 180, 400, timeRef.current * 0.2, true); // Mesas
    drawLandscapeLayer(ctx, width, height, parallaxX * 0.15, mNear, 120, 60, 250, timeRef.current * 0.5, false); // Closer ridges
  };

  const drawLandscapeLayer = (
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    scroll: number,
    color: string,
    yBaseOffset: number,
    amplitude: number,
    period: number,
    time: number = 0,
    isMesa: boolean = false
  ) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-50, h);

    const step = isMesa ? 40 : 20;
    for (let x = -50; x <= w + 50; x += step) {
      const worldX = x + scroll;
      let noise;

      if (isMesa) {
        // Flat-topped mesas
        const mesaNoise = Math.sin(worldX / period);
        noise = mesaNoise > 0.7 ? -amplitude : (mesaNoise < -0.7 ? -amplitude * 0.6 : 0);
        // Add some jagginess
        noise += Math.sin(worldX / 20) * 5;
      } else {
        const sway = Math.sin(time * 0.5 + worldX / 800) * 10;
        noise = Math.sin(worldX / period + time * 0.2) * amplitude +
          Math.sin(worldX / (period * 0.6) - time * 0.3) * (amplitude * 0.3) + sway;
      }

      const y = h - yBaseOffset + noise;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w + 50, h);
    ctx.fill();
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {


    drawBackground(ctx, width, height);

    const dino = dinoRef.current;
    const scale = VOXEL_SIZE;

    // Chase Cam Setup (Back View)
    const camX = dino.pos.x;
    const centerX = width * 0.3;
    const centerY = height * 0.8;

    // Moving Ground Plains (Infinite feel)
    // Centered on camX to ensure it never "runs out"
    drawCube(
      ctx,
      { x: camX - 15000, y: -10000, z: GROUND_SURFACE_Z - GROUND_DEPTH },
      { w: 30000, d: 20000, h: GROUND_DEPTH },
      isNight ? '#2d3748' : COLORS.GROUND_BASE,
      centerX,
      centerY,
      scale
    );

    // Path Strip (Moving with camera)
    drawCube(
      ctx,
      { x: camX - 15000, y: -PATH_WIDTH / 2, z: PATH_SURFACE_Z - PATH_THICKNESS },
      { w: 30000, d: PATH_WIDTH, h: PATH_THICKNESS },
      isNight ? '#3a4a5b' : COLORS.PATH,
      centerX,
      centerY,
      scale
    );
    const renderList: any[] = [];

    // Ground Texture & Details - Dense and Varied
    // Aligned to 30 (the step size) to prevent jittering/popping
    const groundZ = GROUND_SURFACE_Z;
    const overlayZ = DETAIL_OVERLAY_Z;
    const rippleZ = groundZ;
    const laneBuffer = LANE_WIDTH * 2.75;
    const startX = Math.floor((camX - 500) / 40) * 40;
    const endX = startX + 2400;

    for (let x = startX; x < endX; x += 40) {
      for (let y = -520; y <= 520; y += 40) {
        // Distance culling: Don't render far-out decorations laterally
        const distSq = (x - camX) * (x - camX) + y * y;
        if (distSq > 1500 * 1500) continue;

        // High-frequency noise for placement
        const hash = Math.sin(x * 0.041 + y * 0.127) * 43758.5453;
        const rand = hash - Math.floor(hash);
        const jitterX = (Math.sin(hash) * 0.5 + 0.5) * 12;
        const jitterY = (Math.cos(hash) * 0.5 + 0.5) * 12;

        // Low-frequency noise for large color patches
        const patchHash = Math.sin(Math.floor(x / 200) * 0.5 + Math.floor(y / 200) * 0.8);
        const patchType = patchHash - Math.floor(patchHash);

        // 1. Large Sand Color Patches
        if (rand > 0.95) {
          renderList.push({
            type: 'detail_patch',
            pos: { x: x + rand * 20, y: y + rand * 20, z: overlayZ },
            size: { w: 40 + rand * 60, d: 40 + rand * 60, h: 0 },
            color: patchType > 0.5 ? COLORS.SAND_LIGHT + '22' : COLORS.SAND_DARK + '22',
            parallax: 1.0
          });
        }

        // 2. Sand Ripples
        if (rand > 0.8 && rand < 0.85) {
          renderList.push({
            type: 'detail_ripple',
            pos: { x: x + rand * 10, y: y, z: rippleZ },
            size: { w: 20 + rand * 30, d: 2, h: 0.2 },
            color: COLORS.SAND_DARK + '44',
            parallax: 1.0
          });
        }

        // 3. Pebbles
        if (rand < 0.08) {
          const pebbleCount = 1 + Math.floor(rand * 50);
          for (let i = 0; i < pebbleCount; i++) {
            const px = x + (Math.sin(rand * 10 + i) * 15);
            const py = y + (Math.cos(rand * 10 + i) * 15);
            renderList.push({
              type: 'detail_pebble',
              pos: { x: px, y: py, z: overlayZ },
              size: { w: 1 + rand * 2, d: 1 + rand * 2, h: 0.6 + rand * 1.2 },
              color: i % 2 === 0 ? COLORS.PEBBLE_LIGHT : COLORS.PEBBLE_DARK,
              parallax: 1.0
            });
          }
        }

        // 4. Speckles
        if (rand > 0.4 && rand < 0.55) {
          renderList.push({
            type: 'detail_speckle',
            pos: { x: x + rand * 25, y: y + (1 - rand) * 25, z: overlayZ },
            size: { w: 1, d: 1, h: 0 },
            color: COLORS.SAND_DARK + '88',
            parallax: 1.0
          });
        }

        if (Math.abs(y) < laneBuffer) continue;

        const parallax = 1.0;
        const clusterNoise = (Math.sin(x * 0.019 + y * 0.073) * 9999) % 1;

        // Scattered Desert Rocks - multi-block clusters
        if (rand > 0.985) {
          renderList.push({
            type: 'decor_rock_cluster',
            pos: { x: x + jitterX * 0.5, y: y + jitterY * 0.5, z: groundZ },
            size: { w: 6 + rand * 8, d: 5 + rand * 7, h: 4 + rand * 7 },
            color: rand > 0.995 ? COLORS.ROCK_DARK : COLORS.SANDSTONE_DARK,
            accent: rand > 0.995 ? COLORS.ROCK_LIGHT : COLORS.SANDSTONE_LIGHT,
            parallax
          });
        }

        // Sandstone shards / spires
        else if (rand > 0.965) {
          renderList.push({
            type: 'decor_spire',
            pos: { x: x + jitterX, y: y + jitterY * 0.8, z: groundZ },
            size: { w: 3 + rand * 2, d: 3 + rand * 1.5, h: 10 + rand * 12 },
            color: COLORS.SANDSTONE_LIGHT,
            parallax
          });
        }

        // Dry bush tufts
        else if (rand < 0.015) {
          renderList.push({
            type: 'decor_bush',
            pos: { x: x + jitterX, y: y + jitterY, z: groundZ },
            size: { w: 4, d: 4, h: 6 + rand * 8 },
            color: COLORS.BUSH,
            parallax
          });
        }

        // Bone piles
        else if (rand > 0.045 && rand < 0.052) {
          renderList.push({
            type: 'decor_bones',
            pos: { x: x + jitterX * 0.6, y: y + jitterY * 0.4, z: groundZ },
            size: { w: 6, d: 5, h: 2 + rand * 2 },
            color: COLORS.BONE,
            parallax
          });
        }

        // Driftwood / dead branches
        else if (clusterNoise > 0.72 && clusterNoise < 0.745) {
          renderList.push({
            type: 'decor_driftwood',
            pos: { x: x + jitterX * 0.3, y: y + jitterY * 0.5, z: groundZ },
            size: { w: 8 + clusterNoise * 6, d: 2 + clusterNoise * 2, h: 2 + clusterNoise * 2 },
            color: COLORS.DRIFTWOOD,
            parallax
          });
        }

        // Small succulents
        else if (rand < 0.02) {
          renderList.push({
            type: 'detail_grass',
            pos: { x: x + jitterX * 0.5, y: y + jitterY * 0.5, z: groundZ },
            size: { w: 3, d: 3, h: 6 + rand * 10 },
            color: COLORS.CACTUS_MAIN,
            parallax: parallax,
          });
        }
      }
    }

    // Entities
    obstaclesRef.current.forEach(obs => renderList.push(obs));
    particlesRef.current.forEach(p => renderList.push({
      type: 'particle',
      pos: p.pos,
      size: { w: p.size, d: p.size, h: p.size },
      color: p.color
    }));

    renderList.push({
      type: 'dino_proxy',
      pos: dino.pos,
      size: dino.size,
      dinoRef: dino
    });

    // REVERSED DEPTH SORT for Chase View
    renderList.sort((a, b) => {
      const pA = a.parallax || 1;
      const pB = b.parallax || 1;
      const ax = camX + (a.pos.x - camX) * pA;
      const bx = camX + (b.pos.x - camX) * pB;
      const depthA = ax + a.pos.y * 1.5 + (a.id || 0) * 0.001;
      const depthB = bx + b.pos.y * 1.5 + (b.id || 0) * 0.001;
      return depthB - depthA;
    });

    // Draw Voxels
    renderList.forEach(obj => {
      const pFactor = obj.parallax || 1;
      const drawRelativeX = (obj.pos.x - camX) * pFactor;

      const drawObj = {
        ...obj,
        pos: { ...obj.pos, x: camX + drawRelativeX }
      };

      if (!['particle', 'detail_patch', 'detail_speckle', 'detail_ripple'].includes(obj.type)) {
        // Shadows for all main entities
        // Adjust shadow based on entity type logic if needed
        drawDynamicShadow(ctx, drawObj, centerX, centerY, scale, camX);
      }

      if (obj.type === 'dino_proxy') {
        drawDetailedDino(ctx, obj.dinoRef, centerX, centerY, scale, camX);
      } else if (obj.obstacleType === ObstacleType.CACTUS_SMALL || obj.obstacleType === ObstacleType.CACTUS_LARGE) {
        drawDetailedCactus(ctx, drawObj, centerX, centerY, scale, camX);
      } else if (obj.obstacleType === ObstacleType.PTERODACTYL) {
        drawBird(ctx, drawObj, centerX, centerY, scale, camX);
      } else if (obj.obstacleType === ObstacleType.ROCK) {
        drawRock(ctx, drawObj, centerX, centerY, scale, camX);
      } else if (obj.type === 'decor_rock_cluster') {
        drawRockCluster(ctx, drawObj, centerX, centerY, scale, camX);
      } else if (obj.type === 'decor_spire') {
        drawSandstoneSpire(ctx, drawObj, centerX, centerY, scale, camX);
      } else if (obj.type === 'decor_bush') {
        drawBushTuft(ctx, drawObj, centerX, centerY, scale, camX);
      } else if (obj.type === 'decor_bones') {
        drawBonePile(ctx, drawObj, centerX, centerY, scale, camX);
      } else if (obj.type === 'decor_driftwood') {
        drawDriftwood(ctx, drawObj, centerX, centerY, scale, camX);
      } else if (['detail_patch', 'detail_speckle', 'detail_ripple'].includes(obj.type)) {
        drawFlatTile(ctx, drawObj, centerX, centerY, scale, camX);
      } else if (obj.type === 'detail_pebble') {
        drawVoxelEntity(ctx, drawObj, centerX, centerY, scale, camX); // Pebbles are tiny cubes
      } else {
        drawVoxelEntity(ctx, drawObj, centerX, centerY, scale, camX);
      }
    });


  };

  const drawDynamicShadow = (ctx: CanvasRenderingContext2D, obj: any, cx: number, cy: number, scale: number, camX: number) => {
    const x = obj.pos.x - camX;
    const y = obj.pos.y;
    const w = obj.size.w;
    const d = obj.size.d;
    const z = obj.pos.z;

    // Shadow opacity based on height
    const hFactor = Math.max(0, 1 - z / 80);
    if (hFactor <= 0) return;

    // Project shadow: Simple isometric projection to Z=0
    // Use transform to shear/skew
    const pCenter = toScreen(x + w / 2, y + d / 2, 0, cx, cy, scale);

    ctx.save();
    ctx.translate(pCenter.x, pCenter.y);
    // Skew for diagonal light source
    ctx.transform(1, 0.5, -0.5, 0.5, 0, 0);

    ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * hFactor})`;
    const sW = (w * scale);
    const sD = (d * scale);

    // Draw centered rect in transformed space
    ctx.fillRect(-sW / 2, -sD / 2, sW, sD);

    ctx.restore();
  };

  const drawFlatTile = (ctx: CanvasRenderingContext2D, obj: any, cx: number, cy: number, scale: number, camX: number) => {
    const x = obj.pos.x - camX;
    const y = obj.pos.y;
    const z = obj.pos.z;
    const w = obj.size.w;
    const d = obj.size.d;

    const p1 = toScreen(x, y, z, cx, cy, scale);
    const p2 = toScreen(x + w, y, z, cx, cy, scale);
    const p3 = toScreen(x + w, y + d, z, cx, cy, scale);
    const p4 = toScreen(x, y + d, z, cx, cy, scale);

    ctx.fillStyle = obj.color;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.fill();
  }

  const drawVoxelEntity = (ctx: CanvasRenderingContext2D, obj: any, cx: number, cy: number, scale: number, camX: number) => {
    const drawPos = { x: obj.pos.x - camX, y: obj.pos.y, z: obj.pos.z };
    drawCube(ctx, drawPos, obj.size, obj.color, cx, cy, scale);
  };

  const drawRock = (ctx: CanvasRenderingContext2D, obj: any, cx: number, cy: number, scale: number, camX: number) => {
    const x = obj.pos.x - camX;
    const y = obj.pos.y;
    const z = obj.pos.z;
    const w = obj.size.w;
    const d = obj.size.d;
    const h = obj.size.h;

    // Multi-part rock for irregularity
    // Base
    drawCube(ctx, { x, y, z }, { w: w, d: d, h: h * 0.6 }, COLORS.ROCK_DARK, cx, cy, scale);
    // Top offset
    drawCube(ctx, { x: x + 2, y: y + 1, z: z + h * 0.6 }, { w: w - 4, d: d - 2, h: h * 0.4 }, COLORS.ROCK_LIGHT, cx, cy, scale);
    // Side rubble
    drawCube(ctx, { x: x - 2, y: y + d / 2, z: z }, { w: 3, d: 3, h: h * 0.3 }, COLORS.ROCK_DARK, cx, cy, scale);
    // Other side
    drawCube(ctx, { x: x + w - 1, y: y + 2, z: z }, { w: 2, d: 2, h: h * 0.2 }, COLORS.ROCK_LIGHT, cx, cy, scale);
  };

  const drawRockCluster = (ctx: CanvasRenderingContext2D, obj: any, cx: number, cy: number, scale: number, camX: number) => {
    const x = obj.pos.x - camX;
    const y = obj.pos.y;
    const z = obj.pos.z;
    const w = obj.size.w;
    const d = obj.size.d;
    const h = obj.size.h;

    const baseColor = obj.color || COLORS.ROCK_DARK;
    const accentColor = obj.accent || COLORS.ROCK_LIGHT;

    drawCube(ctx, { x, y, z }, { w, d, h: h * 0.55 }, baseColor, cx, cy, scale);
    drawCube(ctx, { x: x + w * 0.25, y: y + d * 0.2, z: z + h * 0.4 }, { w: w * 0.6, d: d * 0.65, h: h * 0.45 }, accentColor, cx, cy, scale);
    drawCube(ctx, { x: x - 1.5, y: y + d * 0.55, z }, { w: 3, d: 3, h: h * 0.25 }, baseColor, cx, cy, scale);
    drawCube(ctx, { x: x + w * 0.75, y: y - d * 0.15, z }, { w: 3, d: 2.5, h: h * 0.2 }, accentColor, cx, cy, scale);
  };

  const drawSandstoneSpire = (ctx: CanvasRenderingContext2D, obj: any, cx: number, cy: number, scale: number, camX: number) => {
    const x = obj.pos.x - camX;
    const y = obj.pos.y;
    const z = obj.pos.z;
    const w = obj.size.w;
    const d = obj.size.d;
    const h = obj.size.h;

    const base = obj.color || COLORS.SANDSTONE_DARK;
    const highlight = COLORS.SANDSTONE_LIGHT;

    drawCube(ctx, { x, y, z }, { w, d, h: h * 0.7 }, base, cx, cy, scale);
    drawCube(ctx, { x: x + w * 0.2, y: y + d * 0.2, z: z + h * 0.55 }, { w: w * 0.6, d: d * 0.6, h: h * 0.45 }, highlight, cx, cy, scale);
  };

  const drawBushTuft = (ctx: CanvasRenderingContext2D, obj: any, cx: number, cy: number, scale: number, camX: number) => {
    const x = obj.pos.x - camX;
    const y = obj.pos.y;
    const z = obj.pos.z;
    const w = obj.size.w;
    const d = obj.size.d;
    const h = obj.size.h;

    const base = obj.color || COLORS.BUSH;
    const highlight = COLORS.BUSH_HIGHLIGHT;

    drawCube(ctx, { x, y, z }, { w, d, h: Math.max(3, h * 0.45) }, base, cx, cy, scale);
    drawCube(ctx, { x: x + w * 0.2, y: y + d * 0.35, z: z + h * 0.2 }, { w: w * 0.6, d: d * 0.4, h: h * 0.4 }, highlight, cx, cy, scale);
    drawCube(ctx, { x: x - 1, y: y + d * 0.2, z: z + h * 0.1 }, { w: 2, d: 2, h: h * 0.35 }, base, cx, cy, scale);
    drawCube(ctx, { x: x + w - 1, y: y - 1, z: z + h * 0.15 }, { w: 2, d: 2, h: h * 0.3 }, base, cx, cy, scale);
  };

  const drawBonePile = (ctx: CanvasRenderingContext2D, obj: any, cx: number, cy: number, scale: number, camX: number) => {
    const x = obj.pos.x - camX;
    const y = obj.pos.y;
    const z = obj.pos.z;
    const w = obj.size.w;
    const d = obj.size.d;
    const h = obj.size.h;

    drawCube(ctx, { x: x + 1, y: y + 1, z }, { w: Math.max(2, w - 2), d: Math.max(2, d - 2), h: h * 0.5 }, COLORS.BONE, cx, cy, scale);
    drawCube(ctx, { x: x - 1, y: y + d * 0.3, z: z + h * 0.1 }, { w: w + 2, d: 2, h: h * 0.4 }, COLORS.BONE_SHADOW, cx, cy, scale);
    drawCube(ctx, { x: x + w * 0.3, y: y - 1, z: z + h * 0.15 }, { w: 2, d: d + 2, h: h * 0.35 }, COLORS.BONE, cx, cy, scale);
    drawCube(ctx, { x: x + w * 0.6, y: y + d * 0.5, z: z + h * 0.35 }, { w: 1.5, d: 1.5, h: h * 0.5 }, COLORS.BONE_SHADOW, cx, cy, scale);
  };

  const drawDriftwood = (ctx: CanvasRenderingContext2D, obj: any, cx: number, cy: number, scale: number, camX: number) => {
    const x = obj.pos.x - camX;
    const y = obj.pos.y;
    const z = obj.pos.z;
    const w = obj.size.w;
    const d = obj.size.d;
    const h = obj.size.h;

    const base = obj.color || COLORS.DRIFTWOOD;
    const highlight = COLORS.DRIFTWOOD_LIGHT;

    drawCube(ctx, { x, y, z }, { w, d, h: Math.max(2, h * 0.7) }, base, cx, cy, scale);
    drawCube(ctx, { x: x + w * 0.55, y: y - d * 0.35, z: z + h * 0.3 }, { w: w * 0.35, d: d, h: h * 0.5 }, base, cx, cy, scale);
    drawCube(ctx, { x: x + w * 0.15, y: y + d * 0.4, z: z + h * 0.2 }, { w: w * 0.6, d: d * 0.5, h: h * 0.5 }, highlight, cx, cy, scale);
  };

  const drawDetailedCactus = (ctx: CanvasRenderingContext2D, obj: any, cx: number, cy: number, scale: number, camX: number) => {
    const x = obj.pos.x - camX;
    const y = obj.pos.y;
    const z = obj.pos.z;
    const w = obj.size.w;
    const h = obj.size.h;
    const d = obj.size.d;

    const c = COLORS.CACTUS_MAIN;
    const cLight = COLORS.CACTUS_LIGHT;

    if (obj.obstacleType === ObstacleType.CACTUS_LARGE) {
      // Main trunk
      drawCube(ctx, { x: x + w / 2 - 2.5, y: y + 1, z: z }, { w: 5, d: 4, h: h }, c, cx, cy, scale);
      drawCube(ctx, { x: x + w / 2 - 2.5, y: y + 1, z: z + h }, { w: 5, d: 4, h: 1 }, cLight, cx, cy, scale);

      // Arms pointing sideways (Y axis) for visibility in chase view
      // Right Arm (Screen Left)
      drawCube(ctx, { x: x + w / 2 - 1, y: y + 5, z: z + 6 }, { w: 3, d: 4, h: 3 }, c, cx, cy, scale); // out
      drawCube(ctx, { x: x + w / 2 - 1, y: y + 8, z: z + 6 }, { w: 3, d: 3, h: 6 }, c, cx, cy, scale); // up
      drawCube(ctx, { x: x + w / 2 - 1, y: y + 8, z: z + 12 }, { w: 3, d: 3, h: 1 }, cLight, cx, cy, scale); // top

      // Left Arm (Screen Right/Back)
      drawCube(ctx, { x: x + w / 2 - 1, y: y - 3, z: z + 8 }, { w: 3, d: 4, h: 3 }, c, cx, cy, scale); // out
      drawCube(ctx, { x: x + w / 2 - 1, y: y - 5, z: z + 8 }, { w: 3, d: 3, h: 4 }, c, cx, cy, scale); // up
      drawCube(ctx, { x: x + w / 2 - 1, y: y - 5, z: z + 12 }, { w: 3, d: 3, h: 1 }, cLight, cx, cy, scale); // top

    } else {
      // Small Cactus group
      // Main
      drawCube(ctx, { x: x + 2, y: y + 2, z: z }, { w: 4, d: 4, h: h }, c, cx, cy, scale);
      drawCube(ctx, { x: x + 2, y: y + 2, z: z + h }, { w: 4, d: 4, h: 1 }, cLight, cx, cy, scale);
      // Small side
      drawCube(ctx, { x: x, y: y - 1, z: z }, { w: 3, d: 3, h: h * 0.6 }, c, cx, cy, scale);
      drawCube(ctx, { x: x, y: y - 1, z: z + h * 0.6 }, { w: 3, d: 3, h: 1 }, cLight, cx, cy, scale);
    }
  };

  const drawDetailedDino = (ctx: CanvasRenderingContext2D, dino: Entity, cx: number, cy: number, scale: number, camX: number) => {
    const x = dino.pos.x - camX;
    const y = dino.pos.y;

    const squash = dino.squashFactor || 0;

    // Apply Squash and Stretch
    const sH = Math.max(0.1, 1 - squash);
    const sW = 1 + squash * 0.5;

    const w = dino.size.w * sW;
    const d = dino.size.d * sW;
    // const h = dino.size.h * sH; // unused

    const z = dino.pos.z;

    const dist = distanceRef.current;
    const isJumping = z > 1;
    const isDucking = dino.size.h < 8;

    // Animation Cycles - slowed down and simplified
    const cycle = dist * 0.15;
    const legSwing = isJumping ? 0 : Math.sin(cycle) * 1.5;
    const armSwing = isJumping ? -1 : Math.cos(cycle) * 0.8;
    // Removed bobbing for stability
    const runBob = 0;

    const cSkin = COLORS.DINO_SKIN;
    const cBelly = COLORS.DINO_BELLY;
    const cSpot = COLORS.DINO_SPOTS;
    const cEye = COLORS.DINO_EYE;

    // Core body height with bob
    const bodyZ = z + 4 * sH + runBob;

    // Adjust X/Y to center the squash
    const offX = (dino.size.w - w) / 2;
    const offY = (dino.size.d - d) / 2;
    const curX = x + offX;
    const curY = y + offY;

    // --- NECK & HEAD ---
    const headZ = isDucking ? bodyZ : bodyZ + 5 * sH;
    const headBaseX = isDucking ? curX + w + 4 : curX + w - 2;

    // Neck (if not ducking)
    if (!isDucking) {
      drawCube(ctx, { x: curX + w - 3, y: curY + 1.5 * sW, z: bodyZ + 4 * sH }, { w: 4, d: 4 * sW, h: 4 * sH }, cSkin, cx, cy, scale);
    }

    // Snout
    drawCube(ctx, { x: headBaseX + 6, y: curY + 1.5 * sW, z: headZ }, { w: 4, d: 4 * sW, h: 3 * sH }, cSkin, cx, cy, scale);
    // Head Main
    drawCube(ctx, { x: headBaseX, y: curY + 0.5 * sW, z: headZ }, { w: 6, d: 6 * sW, h: 6 * sH }, cSkin, cx, cy, scale);
    // Eye (Right)
    drawCube(ctx, { x: headBaseX + 3, y: curY + 6.6 * sW, z: headZ + 3 * sH }, { w: 1, d: 0.1, h: 1 }, cEye, cx, cy, scale);

    // --- ARMS ---
    const armZ = bodyZ + 2 * sH + runBob * 0.5;
    const armSwingX = isJumping ? -2 : Math.cos(cycle) * 2;
    // Right Arm
    drawCube(ctx, { x: curX + w - 3 - armSwingX, y: curY + 6 * sW, z: armZ }, { w: 3, d: 1.5 * sW, h: 1.5 * sH }, cSkin, cx, cy, scale);
    // Left Arm
    drawCube(ctx, { x: curX + w - 3 + armSwingX, y: curY - 1 * sW, z: armZ }, { w: 3, d: 1.5 * sW, h: 1.5 * sH }, cSkin, cx, cy, scale);

    // --- BODY ---
    if (isDucking) {
      // Ducking body
      drawCube(ctx, { x: curX, y: curY, z: bodyZ }, { w: w + 4, d: 7 * sW, h: 5 * sH }, cSkin, cx, cy, scale);
    } else {
      // Main Body Block
      // Bottom Belly Layer
      drawCube(ctx, { x: curX, y: curY + 0.5 * sW, z: bodyZ }, { w: w, d: 6 * sW, h: 2 * sH }, cBelly, cx, cy, scale);
      // Upper Body
      drawCube(ctx, { x: curX, y: curY, z: bodyZ + 2 * sH }, { w: w, d: 7 * sW, h: 4 * sH }, cSkin, cx, cy, scale);

      // Spots on back
      drawCube(ctx, { x: curX + 2, y: curY + 2 * sW, z: bodyZ + 5.5 * sH }, { w: 2, d: 2, h: 1 * sH }, cSpot, cx, cy, scale);
      drawCube(ctx, { x: curX + 6, y: curY + 4 * sW, z: bodyZ + 5 * sH }, { w: 2, d: 2, h: 1 * sH }, cSpot, cx, cy, scale);
      drawCube(ctx, { x: curX + 4, y: curY - 0 * sW, z: bodyZ + 4 * sH }, { w: 2, d: 1, h: 2 * sH }, cSpot, cx, cy, scale); // Side spot left
    }

    // --- LEGS ---
    const rLegX = curX + 2 - legSwing;
    const rLegZ = isJumping ? z + 1 : z;
    const lLegX = curX + 2 + legSwing;
    const lLegZ = isJumping ? z + 2 : z; // Asymmetric jump legs

    // Right Leg
    drawCube(ctx, { x: rLegX, y: curY + 5 * sW, z: rLegZ }, { w: 4, d: 2 * sW, h: 5 * sH }, cSkin, cx, cy, scale);
    // Left Leg
    drawCube(ctx, { x: lLegX, y: curY + 0 * sW, z: lLegZ }, { w: 4, d: 2 * sW, h: 5 * sH }, cSkin, cx, cy, scale);

    // --- TAIL (Closest) ---
    // We look at the back of this.
    const tailWag = Math.sin(cycle * 0.5) * 1.5;
    const tailX = curX - 4;
    const tailZ = bodyZ + 2 * sH + tailWag;

    // Tail Base (Wide and Tall)
    drawCube(ctx, { x: tailX, y: curY + 1.5 * sW, z: tailZ }, { w: 4, d: 4 * sW, h: 4 * sH }, cSkin, cx, cy, scale);
    // Tail Mid
    drawCube(ctx, { x: tailX - 3, y: curY + 2.5 * sW, z: tailZ + 0.5 }, { w: 3, d: 2 * sW, h: 3 * sH }, cSkin, cx, cy, scale);
    // Tail Tip
    drawCube(ctx, { x: tailX - 5, y: curY + 3 * sW, z: tailZ + 1 }, { w: 2, d: 1 * sW, h: 2 * sH }, cSkin, cx, cy, scale);
  };

  const drawBird = (ctx: CanvasRenderingContext2D, obj: any, cx: number, cy: number, scale: number, camX: number) => {
    const x = obj.pos.x - camX;
    const y = obj.pos.y;
    const z = obj.pos.z;
    const c = obj.color;

    const flap = Math.floor(Date.now() / 150) % 2 === 0;
    const wingZ = flap ? 4 : -2;

    drawCube(ctx, { x, y, z }, { w: 6, d: 3, h: 3 }, c, cx, cy, scale);
    // Neck/Head
    drawCube(ctx, { x: x - 3, y: y + 0.5, z: z + 1 }, { w: 3, d: 2, h: 4 }, c, cx, cy, scale);
    // Beak
    drawCube(ctx, { x: x - 5, y: y + 1, z: z + 3 }, { w: 2, d: 1, h: 1 }, COLORS.SAND_DETAIL, cx, cy, scale);

    drawCube(ctx, { x: x + 1, y: y - 5, z: z + 2 + wingZ }, { w: 4, d: 5, h: 1 }, COLORS.BIRD_WING, cx, cy, scale);
    drawCube(ctx, { x: x + 1, y: y + 3, z: z + 2 + wingZ }, { w: 4, d: 5, h: 1 }, COLORS.BIRD_WING, cx, cy, scale);
  };

  useEffect(() => {
    const loop = (time: number) => {
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (containerRef.current && canvasRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (canvasRef.current.width !== clientWidth || canvasRef.current.height !== clientHeight) {
          canvasRef.current.width = clientWidth;
          canvasRef.current.height = clientHeight;
        }

        update(dt);
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          draw(ctx, clientWidth, clientHeight);
        }
      }

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div ref={containerRef} className="font-sans relative w-full h-screen bg-gray-100 overflow-hidden select-none" onTouchStart={handleJump}>
      <canvas ref={canvasRef} className="w-full h-full block" />

      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center font-sans pointer-events-none z-20">
        {/* Score Display (Always Visible) */}
        {!((uiState === GameState.START || uiState === GameState.GAME_OVER)) && (
          <div className="flex items-center gap-4 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full shadow-sm border border-white/40">
            <div className="flex items-baseline gap-2">
              <div className="text-orange-600 font-bold text-[24px] tabular-nums leading-none tracking-tight">
                {Math.floor(currentScore).toString().padStart(5, '0')}
              </div>
              <div className="text-gray-500 font-bold text-[11px] tabular-nums uppercase">
                HI {Math.floor(highScore).toString()}
              </div>
            </div>
            <button
              onClick={forceReset}
              className="p-1.5 rounded-full hover:bg-gray-200/50 text-gray-500 hover:text-orange-600 transition-colors pointer-events-auto"
              title="Reset Game"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* GitHub Link (Top Left - Always Visible) */}
      <div className="absolute top-3 left-4 flex flex-col items-start font-sans pointer-events-none z-20">
        <a
          className="text-[10px] text-gray-400/40 hover:text-gray-600 font-medium pointer-events-auto transition-colors"
          href="https://github.com/jasonshaw0"
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/jasonshaw0
        </a>
      </div>


      {/* Unified Start / Game Over Screen Overlay */}
      {
        (uiState === GameState.START || uiState === GameState.GAME_OVER) && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-[2px]">

            <div className="relative w-full max-w-xl p-6 h-[600px] mx-5 bg-white/45 backdrop-blur-md rounded-2xl shadow-2xl border border-white/60 flex flex-col gap-2">

              {/* Header Grid */}
              <div className="grid grid-cols-1 items-start w-full relative z-10 shrink-0">
                <div className="text-center pt-1">
                  <div className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                    Built by <a href="https://github.com/jasonshaw0" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-orange-600 underline decoration-gray-300 underline-offset-2">Jason Shaw</a>
                  </div>
                </div>
                {/* Left: Score */}
                <div className="text-left pt-1">
                  {uiState === GameState.GAME_OVER && (
                    <p className="text-orange-600 font-bold text-xs tracking-wider">
                      PREVIOUS SCORE: {Math.floor(scoreRef.current)}
                    </p>
                  )}
                </div>

                {/* Center: Title */}
                <div className="text-center">
                  <h1 className="text-2xl font-black text-gray-800 tracking-tighter mb-1 leading-none">
                    {uiState === GameState.GAME_OVER ? 'GAME OVER' : 'ISO-DINO'}
                  </h1>
                  <div className="text-[12px] text-gray-500 font-medium mt-0">
                    <span className="font-bold text-[12px] text-gray-600">Chrome’s Classic Dino Runner Axonometrically Projected to 2.5 Dimensions</span><br></br>
                  </div>
                </div>


                {/* Right: Credits */}



                {/* Main Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center mt-8 gap-2 w-full -mt-4 min-h-0">
                  {/* Play Button */}
                  <button
                    onClick={resetGame}
                    className="group relative px-2 py-1 bg-gray-900 hover:bg-orange-600 text-white rounded-full font-bold transition-all shadow-lg hover:shadow-orange-500/30 active:scale-55 w-full max-w-[200px] shrink-0"
                  >
                    <span className="flex items-center scale-75 justify-center gap-2">
                      {uiState === GameState.GAME_OVER ? 'TRY AGAIN' : 'START RUNNING'}
                      <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform " fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                    <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-orange-400/50" />
                  </button>

                  {/* Hint */}
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest animate-pulse shrink-0">
                  </p>

                  <div className="w-full h-px bg-gray-100/50 max-w-[200px] shrink-0" />

                  {/* Technical Info Dropdown */}
                  <div className="w-full max-w-[320px] flex flex-col min-h-0">

                    <span>How does this work?</span>




                    <div className="mt-2 text-left p-2 text-[11px] leading-relaxed text-gray-600 space-y-3  overflow-y-auto custom-scrollbar">
                      <p>
                        <strong className="text-gray-900">True 2.5D Projection:</strong> This isn't a 3D engine. It uses a rigorous <span className="font-mono text-orange-600 bg-orange-50 px-1 rounded">axonometric projection</span> algorithm to mathematically map 3D coordinates (x, y, z) onto a 2D HTML5 Canvas plane.
                      </p>
                      <p>
                        <strong className="text-gray-900">Voxel-based Rendering:</strong> Every entity—from the dinosaur to the dust particles—is constructed from individual isometric cubes ("voxels") that are sorted by depth (Z-indexing) every single frame to ensure correct occlusion.
                      </p>
                      <p>
                        <strong className="text-gray-900">Dynamic Environment:</strong> The infinite terrain features procedural generation for ground details, per-block dynamic shadow casting based on height, and a parallax scrolling sky system.
                      </p>
                    </div>

                  </div>
                </div>
              </div>

            </div>
          </div>
        )
      }

      {/* Bottom Right: Secret Switch */}
      <div className="absolute bottom-2 right-2 flex flex-col items-center gap-0 z-30 opacity-20 hover:opacity-100 transition-opacity">
        <span className={`text-[7px] font-black uppercase tracking-tighter transition-all mb-0.5 opacity-30 ${isNight ? 'text-gray-400' : 'text-gray-500'}`}>
          {isCocaineMode ? '' : ''}
        </span>
        <button
          onClick={() => {
            cocaineModeRef.current = !cocaineModeRef.current;
            setIsCocaineMode(cocaineModeRef.current);
          }}
          className={`relative w-7 h-3.5 rounded-full transition-all duration-300 focus:outline-none shadow-inner opacity-40 hover:opacity-100 ${isCocaineMode ? 'bg-red-500 text-red-500 opacity-100' : 'bg-gray-400'}`}
        >
          <div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-white rounded-full shadow-md transition-transform duration-300 ${isCocaineMode ? 'translate-x-3.5 bg-red-800' : 'translate-x-0'}`} />
        </button>
      </div >

      {
        uiState === GameState.START && (
          <div className="absolute inset-x-0 bottom-24 flex items-center justify-center z-10">
            <div className="text-center p-2 bg-white/80 backdrop-blur-md rounded-xl shadow-xl border border-white/50 transform hover:scale-100 transition-all duration-300 cursor-pointer group" onClick={resetGame}>
              <h1 className="text-xl font-black text-gray-800 mb-1 tracking-tighter group-hover:text-blue-600 transition-colors">ISO-DINO</h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest animate-pulse">Click or Press Space to Start</p>
            </div>
          </div>
        )
      }

      {
        uiState === GameState.GAME_OVER && (
          <div className="absolute inset-x-0 bottom-24 flex items-center justify-center z-10">
            <div className="text-center p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-red-200/50 cursor-pointer group" onClick={resetGame}>
              <h2 className="text-2xl font-black text-gray-800 mb-1">GAME OVER</h2>
              <button className="text-white bg-gray-800/90 hover:bg-gray-900 px-6 py-2 rounded-full text-xs font-bold transition-all shadow-lg active:scale-95">
                RETRY
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default IsoDinoGame;
