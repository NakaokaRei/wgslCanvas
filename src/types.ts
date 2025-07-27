export interface WGSLCanvasOptions {
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  pixelRatio?: number;
  autoResize?: boolean;
  premultipliedAlpha?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: GPUPowerPreference;
}

export interface Uniform {
  name: string;
  type: 'f32' | 'vec2<f32>' | 'vec3<f32>' | 'vec4<f32>' | 'mat4x4<f32>' | 'texture' | 'sampler';
  value?: number | number[] | Float32Array;
}

export interface Texture {
  source: ImageBitmap | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
  texture: GPUTexture;
  sampler: GPUSampler;
}

export interface ShaderModule {
  vertex: string;
  fragment: string;
}