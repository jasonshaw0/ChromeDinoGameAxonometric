# IsoDino

A 2.5D axonometric projection of Chrome's classic Dinosaur Game, built with React and TypeScript.

## Features

- True axonometric projection (not a 3D engine)
- Voxel-based rendering
- Procedural infinite terrain
- Day/Night cycle
- "Chase View" camera angle

## Implementation Details

This project uses a rigorous mathematical projection to map 3D coordinates (x, y, z) onto a 2D HTML5 Canvas plane without using WebGL or 3D libraries. Every entity is constructed from individual isometric cubes ("voxels") sorted by depth every frame.

## Credits

Built by Jason Shaw
