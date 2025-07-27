# WGSL Canvas

A TypeScript library for rendering WGSL shaders with WebGPU, inspired by [glsl-canvas](https://github.com/actarian/glsl-canvas).

🎨 **[Live Demo](https://nakaokarei.github.io/wgslCanvas/)**

https://github.com/user-attachments/assets/17d938d8-6d3d-419a-b30a-ceeb9f1f38db

## Features

- Easy-to-use API for WebGPU shader rendering
- Built-in uniforms (time, resolution, mouse)
- TypeScript support
- Animation loop management
- Responsive canvas sizing

## Installation

```bash
npm install wgsl-canvas
```

## Usage

```typescript
import { WGSLCanvas } from 'wgsl-canvas';

// Create a new WGSL canvas
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;
const wgslCanvas = new WGSLCanvas(canvas);

// Load a fragment shader
const shader = `
@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(uv.x, uv.y, 0.5, 1.0);
}
`;

await wgslCanvas.load(shader);

// Start animation
wgslCanvas.play();
```

## Default Uniforms

The following uniforms are automatically available in your shaders:

```wgsl
struct Uniforms {
  time: f32,              // Time in seconds since start
  resolution: vec2<f32>,  // Canvas resolution in pixels
  mouse: vec2<f32>,       // Mouse position in pixels
};
```

## API

### Constructor

```typescript
new WGSLCanvas(canvas?: HTMLCanvasElement | WGSLCanvasOptions, options?: WGSLCanvasOptions)
```

### Methods

- `async init()`: Initialize WebGPU context
- `async load(fragment: string, vertex?: string)`: Load shaders
- `play()`: Start animation loop
- `pause()`: Pause animation
- `toggle()`: Toggle play/pause
- `resize(width?: number, height?: number)`: Resize canvas
- `destroy()`: Clean up resources

## Development

```bash
# Install dependencies
npm install

# Build library
npm run build

# Run demo
npm run demo

# Type checking
npm run typecheck
```

## Browser Support

This library requires WebGPU support. Currently supported in:
- Chrome 113+
- Edge 113+
- Chrome Canary with WebGPU flag enabled

## License

MIT
