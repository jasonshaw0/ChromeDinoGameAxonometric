import { Point3D, Size3D } from '../types';
import { VIEW_ANGLE } from '../constants';

// Isometric Projection Helper
// X goes South-East, Y goes South-West, Z goes Up
export const toScreen = (x: number, y: number, z: number, centerX: number, centerY: number, scale: number) => {
  // Simple isometric projection
  // x increases to the right-down
  // y increases to the left-down
  const isoX = (x - y) * Math.cos(VIEW_ANGLE);
  const isoY = (x + y) * Math.sin(VIEW_ANGLE) - z;

  return {
    x: centerX + isoX * scale,
    y: centerY + isoY * scale,
  };
};

// Draw a "Voxel" Cube (Prism)
export const drawCube = (
  ctx: CanvasRenderingContext2D,
  pos: Point3D,
  size: Size3D,
  color: string,
  centerX: number,
  centerY: number,
  scale: number
) => {
  const { x, y, z } = pos;
  const { w, d, h } = size;

  // Colors
  // For chase view (looking from -X, -Y), we see faces x=0 and y=0.
  const rightColor = shadeColor(color, -10); // Face Y=0 (Right)
  const leftColor = shadeColor(color, -20);  // Face X=0 (Left/Back)
  const topColor = shadeColor(color, 20);    // Face Z=h (Top)

  // Vertices
  // Top Face (Z = z + h)
  const pTopBack = toScreen(x, y, z + h, centerX, centerY, scale);
  const pTopRight = toScreen(x + w, y, z + h, centerX, centerY, scale);
  const pTopFront = toScreen(x + w, y + d, z + h, centerX, centerY, scale);
  const pTopLeft = toScreen(x, y + d, z + h, centerX, centerY, scale);

  // Bottom Points for vertical faces (Z = z)
  const pBotBack = toScreen(x, y, z, centerX, centerY, scale); // 0,0,0 (Closest corner)
  const pBotRight = toScreen(x + w, y, z, centerX, centerY, scale);
  const pBotLeft = toScreen(x, y + d, z, centerX, centerY, scale);
  // Note: pBotFront (w,d,0) is hidden

  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = shadeColor(color, -30);

  // Draw Left Face (Plane X=0) - Defined by Y-axis and Z-axis at x
  // Visible because we look from -X
  ctx.fillStyle = leftColor;
  ctx.beginPath();
  ctx.moveTo(pBotBack.x, pBotBack.y);
  ctx.lineTo(pBotLeft.x, pBotLeft.y);
  ctx.lineTo(pTopLeft.x, pTopLeft.y);
  ctx.lineTo(pTopBack.x, pTopBack.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw Right Face (Plane Y=0) - Defined by X-axis and Z-axis at y
  // Visible because we look from -Y (kinda, y=0 is the right edge)
  ctx.fillStyle = rightColor;
  ctx.beginPath();
  ctx.moveTo(pBotBack.x, pBotBack.y);
  ctx.lineTo(pBotRight.x, pBotRight.y);
  ctx.lineTo(pTopRight.x, pTopRight.y);
  ctx.lineTo(pTopBack.x, pTopBack.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Draw Top Face (Plane Z=h)
  // Drawn last because it's on top
  ctx.fillStyle = topColor;
  ctx.beginPath();
  ctx.moveTo(pTopBack.x, pTopBack.y);
  ctx.lineTo(pTopRight.x, pTopRight.y);
  ctx.lineTo(pTopFront.x, pTopFront.y);
  ctx.lineTo(pTopLeft.x, pTopLeft.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
};

// Helper to lighten/darken hex color
function shadeColor(color: string, percent: number) {
  let R = parseInt(color.substring(1, 3), 16);
  let G = parseInt(color.substring(3, 5), 16);
  let B = parseInt(color.substring(5, 7), 16);

  R = Math.floor((R * (100 + percent)) / 100);
  G = Math.floor((G * (100 + percent)) / 100);
  B = Math.floor((B * (100 + percent)) / 100);

  R = R < 255 ? R : 255;
  G = G < 255 ? G : 255;
  B = B < 255 ? B : 255;

  R = Math.round(R);
  G = Math.round(G);
  B = Math.round(B);

  const RR = R.toString(16).length === 1 ? '0' + R.toString(16) : R.toString(16);
  const GG = G.toString(16).length === 1 ? '0' + G.toString(16) : G.toString(16);
  const BB = B.toString(16).length === 1 ? '0' + B.toString(16) : B.toString(16);

  return '#' + RR + GG + BB;
}