import { WGSLCanvas } from '../src/WGSLCanvas';

// Store canvas instances and shaders
const canvases: Map<string, WGSLCanvas> = new Map();
const shaders: Map<string, string> = new Map();

// Error handling
function showError(message: string) {
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.innerHTML = `<div class="error">${message}</div>`;
  }
}

// Simple red shader
const redShader = `
@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}
`;

// Basic gradient shader
const gradientShader = `
@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let color = vec3<f32>(uv.x, uv.y, (uniforms.time * 0.5) % 1.0);
  return vec4<f32>(color, 1.0);
}
`;

// Wave pattern shader
const waveShader = `
@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let wave = sin(uv.x * 10.0 + uniforms.time * 2.0) * 0.5 + 0.5;
  let wave2 = sin(uv.y * 10.0 + uniforms.time * 1.5) * 0.5 + 0.5;
  let color = vec3<f32>(wave, wave2, (wave + wave2) * 0.5);
  return vec4<f32>(color, 1.0);
}
`;

// Plasma effect shader
const plasmaShader = `
@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let x = uv.x * uniforms.resolution.x / uniforms.resolution.y;
  let y = uv.y;
  
  var color: f32 = 0.0;
  color += sin(x * 6.0 + uniforms.time * 1.0) * 0.5;
  color += sin(y * 8.0 + uniforms.time * 1.5) * 0.5;
  color += sin((x + y) * 6.0 + uniforms.time * 2.0) * 0.5;
  color += cos(sqrt(x * x + y * y) * 12.0 - uniforms.time * 4.0) * 0.5;
  
  let r = sin(color * 3.14159) * 0.5 + 0.5;
  let g = sin(color * 3.14159 + 2.094) * 0.5 + 0.5;
  let b = sin(color * 3.14159 + 4.188) * 0.5 + 0.5;
  
  return vec4<f32>(r, g, b, 1.0);
}
`;

// Interactive mouse shader
const mouseShader = `
@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let mouse = uniforms.mouse / uniforms.resolution;
  let dist = distance(uv, mouse);
  
  // WGSL doesn't have smoothstep built-in, so we'll create our own
  let edge0 = 0.18;
  let edge1 = 0.2;
  let t = clamp((dist - edge0) / (edge1 - edge0), 0.0, 1.0);
  let circle = 1.0 - t * t * (3.0 - 2.0 * t);
  
  let glow = 1.0 / (dist * 10.0 + 1.0);
  
  let r = circle + glow * 0.5;
  let g = circle * 0.5 + glow * 0.3;
  let b = circle * 0.8 + glow * 0.8;
  
  return vec4<f32>(r, g, b, 1.0);
}
`;

// Initialize canvases
async function initCanvases() {
  try {
    // Check WebGPU support
    if (!navigator.gpu) {
      showError('WebGPU is not supported in your browser. Please use a modern browser with WebGPU support.');
      return;
    }

    // Store shaders for editor
    shaders.set('demo0', redShader);
    shaders.set('demo1', gradientShader);
    shaders.set('demo2', waveShader);
    shaders.set('demo3', plasmaShader);
    shaders.set('demo4', mouseShader);

    // Populate textareas with shaders
    for (const [demoId, shader] of shaders) {
      const textarea = document.getElementById(`shader-${demoId}`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = shader;
      }
    }

    // Canvas 0: Simple Red
    const canvas0 = document.getElementById('canvas0') as HTMLCanvasElement;
    if (canvas0) {
      const wgslCanvas0 = new WGSLCanvas(canvas0, {
        width: 400,
        height: 300,
        autoResize: false
      });
      await wgslCanvas0.load(redShader);
      wgslCanvas0.play();
      canvases.set('canvas0', wgslCanvas0);
    }

    // Canvas 1: Basic Gradient
    const canvas1 = document.getElementById('canvas1') as HTMLCanvasElement;
    if (canvas1) {
      const wgslCanvas1 = new WGSLCanvas(canvas1, {
        width: 400,
        height: 300,
        autoResize: false
      });
      await wgslCanvas1.load(gradientShader);
      wgslCanvas1.play();
      canvases.set('canvas1', wgslCanvas1);
    }

    // Canvas 2: Wave Pattern
    const canvas2 = document.getElementById('canvas2') as HTMLCanvasElement;
    if (canvas2) {
      const wgslCanvas2 = new WGSLCanvas(canvas2, {
        width: 400,
        height: 300,
        autoResize: false
      });
      await wgslCanvas2.load(waveShader);
      wgslCanvas2.play();
      canvases.set('canvas2', wgslCanvas2);
    }

    // Canvas 3: Plasma Effect
    const canvas3 = document.getElementById('canvas3') as HTMLCanvasElement;
    if (canvas3) {
      const wgslCanvas3 = new WGSLCanvas(canvas3, {
        width: 400,
        height: 300,
        autoResize: false
      });
      try {
        await wgslCanvas3.load(plasmaShader);
        wgslCanvas3.play();
        canvases.set('canvas3', wgslCanvas3);
      } catch (error) {
        console.error('Error loading plasma shader:', error);
      }
    }

    // Canvas 4: Interactive Mouse
    const canvas4 = document.getElementById('canvas4') as HTMLCanvasElement;
    if (canvas4) {
      const wgslCanvas4 = new WGSLCanvas(canvas4, {
        width: 400,
        height: 300,
        autoResize: false
      });
      try {
        await wgslCanvas4.load(mouseShader);
        wgslCanvas4.play();
        canvases.set('canvas4', wgslCanvas4);
      } catch (error) {
        console.error('Error loading mouse shader:', error);
      }
    }

  } catch (error) {
    console.error('Error initializing WGSL Canvas:', error);
    showError(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Toggle canvas play/pause
(window as any).toggleCanvas = (canvasId: string) => {
  const canvas = canvases.get(canvasId);
  if (canvas) {
    canvas.toggle();
  }
};

// Debounce function to avoid too frequent updates
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Update shader in real-time
const debouncedUpdateShader = debounce(async (demoId: string) => {
  const textarea = document.getElementById(`shader-${demoId}`) as HTMLTextAreaElement;
  const canvasId = `canvas${demoId.slice(-1)}`;
  const canvas = canvases.get(canvasId);
  const errorDiv = document.getElementById(`error-${demoId}`);
  
  if (textarea && canvas && errorDiv) {
    const newShader = textarea.value;
    
    try {
      // Try to load the new shader
      await canvas.load(newShader);
      
      // If successful, store the new shader and hide error
      shaders.set(demoId, newShader);
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    } catch (error) {
      // Show error message
      console.error('Shader compilation error:', error);
      errorDiv.style.display = 'block';
      errorDiv.textContent = error instanceof Error ? error.message : 'Unknown shader compilation error';
    }
  }
}, 300);

// Export updateShader function
(window as any).updateShader = (demoId: string) => {
  debouncedUpdateShader(demoId);
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCanvases);
} else {
  initCanvases();
}