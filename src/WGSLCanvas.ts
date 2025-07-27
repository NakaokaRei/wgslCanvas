import { WGSLCanvasOptions, Uniform, Texture, ShaderModule } from './types';

export class WGSLCanvas {
  private canvas: HTMLCanvasElement;
  private context: GPUCanvasContext | null = null;
  private device: GPUDevice | null = null;
  private adapter: GPUAdapter | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private vertexBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  private bindGroup: GPUBindGroup | null = null;
  
  private uniforms: Map<string, Uniform> = new Map();
  private textures: Map<string, Texture> = new Map();
  
  private animationId: number | null = null;
  private startTime: number = 0;
  private time: number = 0;
  private mouseX: number = 0;
  private mouseY: number = 0;
  
  private options: Required<WGSLCanvasOptions>;

  constructor(canvas?: HTMLCanvasElement | WGSLCanvasOptions, options?: WGSLCanvasOptions) {
    if (canvas instanceof HTMLCanvasElement) {
      this.canvas = canvas;
      this.options = this.mergeOptions(options);
    } else {
      const opts = this.mergeOptions(canvas);
      this.canvas = opts.canvas || document.createElement('canvas');
      this.options = opts;
    }
    
    this.setupCanvas();
    this.setupEventListeners();
  }

  private mergeOptions(options?: WGSLCanvasOptions): Required<WGSLCanvasOptions> {
    return {
      canvas: options?.canvas || document.createElement('canvas'),
      width: options?.width || 800,
      height: options?.height || 600,
      pixelRatio: options?.pixelRatio || window.devicePixelRatio || 1,
      autoResize: options?.autoResize ?? true,
      premultipliedAlpha: options?.premultipliedAlpha ?? true,
      preserveDrawingBuffer: options?.preserveDrawingBuffer ?? false,
      powerPreference: options?.powerPreference || 'high-performance'
    };
  }

  private setupCanvas(): void {
    this.canvas.width = this.options.width * this.options.pixelRatio;
    this.canvas.height = this.options.height * this.options.pixelRatio;
    this.canvas.style.width = `${this.options.width}px`;
    this.canvas.style.height = `${this.options.height}px`;
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * this.options.pixelRatio;
      this.mouseY = (e.clientY - rect.top) * this.options.pixelRatio;
    });

    if (this.options.autoResize) {
      window.addEventListener('resize', () => this.resize());
    }
  }

  async init(): Promise<void> {
    if (!navigator.gpu) {
      throw new Error('WebGPU is not supported in this browser');
    }

    this.adapter = await navigator.gpu.requestAdapter({
      powerPreference: this.options.powerPreference
    });

    if (!this.adapter) {
      throw new Error('Failed to get GPU adapter');
    }

    this.device = await this.adapter.requestDevice();
    this.context = this.canvas.getContext('webgpu');

    if (!this.context) {
      throw new Error('Failed to get WebGPU context');
    }

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: presentationFormat,
      alphaMode: this.options.premultipliedAlpha ? 'premultiplied' : 'opaque'
    });

    this.setupVertexBuffer();
  }

  private setupVertexBuffer(): void {
    if (!this.device) return;

    // Full screen quad vertices
    const vertices = new Float32Array([
      -1.0, -1.0,
       1.0, -1.0,
      -1.0,  1.0,
       1.0,  1.0,
    ]);

    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertices);
  }

  async load(fragment: string, vertex?: string): Promise<void> {
    if (!this.device || !this.context) {
      await this.init();
    }

    const vertexShader = vertex || this.getDefaultVertexShader();
    const fragmentShader = this.processFragmentShader(fragment);

    try {
      await this.createPipeline({ vertex: vertexShader, fragment: fragmentShader });
      console.log('Shader loaded successfully');
    } catch (error) {
      console.error('Failed to create pipeline:', error);
      throw error;
    }
  }

  private getDefaultVertexShader(): string {
    return `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn main(@location(0) position: vec2<f32>) -> VertexOutput {
  var output: VertexOutput;
  output.position = vec4<f32>(position, 0.0, 1.0);
  output.uv = (position + 1.0) * 0.5;
  output.uv.y = 1.0 - output.uv.y;
  return output;
}
`;
  }

  private processFragmentShader(shader: string): string {
    // Add default uniforms if not present
    // WebGPU requires proper alignment: vec2 and vec4 need to be 8-byte and 16-byte aligned
    const defaultUniforms = `
struct Uniforms {
  time: f32,
  _padding: f32,
  resolution: vec2<f32>,
  mouse: vec2<f32>,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
`;

    if (!shader.includes('struct Uniforms')) {
      shader = defaultUniforms + shader;
    }

    return shader;
  }

  private async createPipeline(shaderModule: ShaderModule): Promise<void> {
    if (!this.device || !this.context) return;

    const vertexModule = this.device.createShaderModule({
      code: shaderModule.vertex
    });

    const fragmentModule = this.device.createShaderModule({
      code: shaderModule.fragment
    });

    // Check for compilation errors
    const vertexInfo = await vertexModule.getCompilationInfo();
    if (vertexInfo.messages.length > 0) {
      console.error('Vertex shader compilation messages:', vertexInfo.messages);
    }

    const fragmentInfo = await fragmentModule.getCompilationInfo();
    if (fragmentInfo.messages.length > 0) {
      console.error('Fragment shader compilation messages:', fragmentInfo.messages);
    }

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: 'uniform' }
      }]
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout]
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: vertexModule,
        entryPoint: 'main',
        buffers: [{
          arrayStride: 8,
          attributes: [{
            format: 'float32x2',
            offset: 0,
            shaderLocation: 0
          }]
        }]
      },
      fragment: {
        module: fragmentModule,
        entryPoint: 'main',
        targets: [{
          format: presentationFormat
        }]
      },
      primitive: {
        topology: 'triangle-strip',
        stripIndexFormat: 'uint32'
      }
    });

    this.setupUniformBuffer();
  }

  private setupUniformBuffer(): void {
    if (!this.device) return;

    // WebGPU requires 16-byte alignment for uniform buffers
    // time (4 bytes) + padding (12 bytes) + resolution (8 bytes) + mouse (8 bytes)
    const uniformSize = 32; // 8 floats * 4 bytes
    
    this.uniformBuffer = this.device.createBuffer({
      size: uniformSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline!.getBindGroupLayout(0),
      entries: [{
        binding: 0,
        resource: { buffer: this.uniformBuffer }
      }]
    });
  }

  private updateUniforms(): void {
    if (!this.device || !this.uniformBuffer) return;

    const uniformData = new Float32Array([
      this.time,
      0, // padding
      this.canvas.width,
      this.canvas.height,
      this.mouseX,
      this.mouseY
    ]);

    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
  }

  private render = (timestamp: number): void => {
    if (!this.device || !this.context || !this.pipeline) return;

    this.time = (timestamp - this.startTime) / 1000.0;
    this.updateUniforms();

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store'
      }]
    });

    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup!);
    renderPass.setVertexBuffer(0, this.vertexBuffer!);
    renderPass.draw(4);
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);

    if (this.animationId !== null) {
      this.animationId = requestAnimationFrame(this.render);
    }
  };

  play(): void {
    if (this.animationId === null) {
      this.startTime = performance.now() - this.time * 1000;
      this.animationId = requestAnimationFrame(this.render);
    }
  }

  pause(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  toggle(): void {
    if (this.animationId === null) {
      this.play();
    } else {
      this.pause();
    }
  }

  resize(width?: number, height?: number): void {
    this.options.width = width || this.canvas.parentElement?.clientWidth || this.options.width;
    this.options.height = height || this.canvas.parentElement?.clientHeight || this.options.height;
    this.setupCanvas();
    
    if (this.context && this.device) {
      const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format: presentationFormat,
        alphaMode: this.options.premultipliedAlpha ? 'premultiplied' : 'opaque'
      });
    }
  }

  destroy(): void {
    this.pause();
    this.vertexBuffer?.destroy();
    this.uniformBuffer?.destroy();
    this.textures.forEach(texture => {
      texture.texture.destroy();
    });
    this.device?.destroy();
  }
}