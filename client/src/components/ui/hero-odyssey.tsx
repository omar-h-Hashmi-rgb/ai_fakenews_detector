import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface ElasticHueSliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
}

const ElasticHueSlider: React.FC<ElasticHueSliderProps> = ({
    value,
    onChange,
    min = 0,
    max = 360,
    step = 1,
    label = 'Adjust Hue',
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);

    const progress = ((value - min) / (max - min));
    const thumbPosition = progress * 100; // Percentage

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);

    return (
        <div className="scale-50 relative w-full max-w-xs flex flex-col items-center" ref={sliderRef}>
            {label && <label htmlFor="hue-slider-native" className="text-gray-300 text-sm mb-1">{label}</label>}
            <div className="relative w-full h-5 flex items-center">
                <input
                    id="hue-slider-native"
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchEnd={handleMouseUp}
                    className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer z-20"
                    style={{ WebkitAppearance: 'none' }}
                />
                <div className="absolute left-0 w-full h-1 bg-gray-700 rounded-full z-0"></div>
                <div
                    className="absolute left-0 h-1 bg-blue-500 rounded-full z-10"
                    style={{ width: `${thumbPosition}%` }}
                ></div>
                <motion.div
                    className="absolute top-1/2 transform -translate-y-1/2 z-30"
                    style={{ left: `${thumbPosition}%` }}
                    animate={{ scale: isDragging ? 1.2 : 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: isDragging ? 20 : 30 }}
                >
                </motion.div>
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={value}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs text-gray-500 mt-2"
                >
                    {value}°
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

interface FeatureItemProps {
    name: string;
    value: string;
    position: string;
}

interface LightningProps {
    hue?: number;
    xOffset?: number;
    speed?: number;
    intensity?: number;
    size?: number;
}

const Lightning: React.FC<LightningProps> = ({
    hue = 230,
    xOffset = 0,
    speed = 1,
    intensity = 1,
    size = 1,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        const gl = canvas.getContext("webgl");
        if (!gl) {
            console.error("WebGL not supported");
            return;
        }

        const vertexShaderSource = `
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

        const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uHue;
      uniform float uXOffset;
      uniform float uSpeed;
      uniform float uIntensity;
      uniform float uSize;
      
      #define OCTAVE_COUNT 10

      // Convert HSV to RGB.
      vec3 hsv2rgb(vec3 c) {
          vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0,4.0,2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
          return c.z * mix(vec3(1.0), rgb, c.y);
      }

      float hash11(float p) {
          p = fract(p * .1031);
          p *= p + 33.33;
          p *= p + p;
          return fract(p);
      }

      float hash12(vec2 p) {
          vec3 p3 = fract(vec3(p.xyx) * .1031);
          p3 += dot(p3, p3.yzx + 33.33);
          return fract((p3.x + p3.y) * p3.z);
      }

      mat2 rotate2d(float theta) {
          float c = cos(theta);
          float s = sin(theta);
          return mat2(c, -s, s, c);
      }

      float noise(vec2 p) {
          vec2 ip = floor(p);
          vec2 fp = fract(p);
          float a = hash12(ip);
          float b = hash12(ip + vec2(1.0, 0.0));
          float c = hash12(ip + vec2(0.0, 1.0));
          float d = hash12(ip + vec2(1.0, 1.0));
          
          vec2 t = smoothstep(0.0, 1.0, fp);
          return mix(mix(a, b, t.x), mix(c, d, t.x), t.y);
      }

      float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < OCTAVE_COUNT; ++i) {
              value += amplitude * noise(p);
              p *= rotate2d(0.45);
              p *= 2.0;
              amplitude *= 0.5;
          }
          return value;
      }

      void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
          // Normalized pixel coordinates.
          vec2 uv = fragCoord / iResolution.xy;
          uv = 2.0 * uv - 1.0;
          uv.x *= iResolution.x / iResolution.y;
          // Apply horizontal offset.
          uv.x += uXOffset;
          
          // Adjust uv based on size and animate with speed.
          uv += 2.0 * fbm(uv * uSize + 0.8 * iTime * uSpeed) - 1.0;
          
          float dist = abs(uv.x);
          // Compute base color using hue.
          vec3 baseColor = hsv2rgb(vec3(uHue / 360.0, 0.7, 0.8));
          // Compute color with intensity and speed affecting time.
          vec3 col = baseColor * pow(mix(0.0, 0.07, hash11(iTime * uSpeed)) / dist, 1.0) * uIntensity;
          col = pow(col, vec3(1.0));
          fragColor = vec4(col, 1.0);
      }

      void main() {
          mainImage(gl_FragColor, gl_FragCoord.xy);
      }
    `;

        const compileShader = (source: string, type: number): WebGLShader | null => {
            const shader = gl.createShader(type);
            if (!shader) return null;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error("Shader compile error:", gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        };

        const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
        const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
        if (!vertexShader || !fragmentShader) return;

        const program = gl.createProgram();
        if (!program) return;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Program linking error:", gl.getProgramInfoLog(program));
            return;
        }
        gl.useProgram(program);

        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const aPosition = gl.getAttribLocation(program, "aPosition");
        gl.enableVertexAttribArray(aPosition);
        gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

        const iResolutionLocation = gl.getUniformLocation(program, "iResolution");
        const iTimeLocation = gl.getUniformLocation(program, "iTime");
        const uHueLocation = gl.getUniformLocation(program, "uHue");
        const uXOffsetLocation = gl.getUniformLocation(program, "uXOffset");
        const uSpeedLocation = gl.getUniformLocation(program, "uSpeed");
        const uIntensityLocation = gl.getUniformLocation(program, "uIntensity");
        const uSizeLocation = gl.getUniformLocation(program, "uSize");

        const startTime = performance.now();
        const render = () => {
            resizeCanvas();
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(iResolutionLocation, canvas.width, canvas.height);
            const currentTime = performance.now();
            gl.uniform1f(iTimeLocation, (currentTime - startTime) / 1000.0);
            gl.uniform1f(uHueLocation, hue);
            gl.uniform1f(uXOffsetLocation, xOffset);
            gl.uniform1f(uSpeedLocation, speed);
            gl.uniform1f(uIntensityLocation, intensity);
            gl.uniform1f(uSizeLocation, size);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
        };
    }, [hue, xOffset, speed, intensity, size]);

    return <canvas ref={canvasRef} className="w-full h-full relative" />;
};


const FeatureItem: React.FC<FeatureItemProps> = ({ name, value, position }) => {
    return (
        <div className={`absolute ${position} z-10 group transition-all duration-300 hover:scale-110`}>
            <div className="flex items-center gap-2 relative">
                <div className="relative">
                    <div className="w-2 h-2 bg-white rounded-full group-hover:animate-pulse"></div>
                    <div className="absolute -inset-1 bg-white/20 rounded-full blur-sm opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className=" text-white relative">
                    <div className="font-medium group-hover:text-white transition-colors duration-300">{name}</div>
                    <div className="text-white/70 text-sm group-hover:text-white/70 transition-colors duration-300">{value}</div>
                    <div className="absolute -inset-2 bg-white/10 rounded-lg blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </div>
            </div>
        </div>
    );
};

export const HeroSection: React.FC = () => {
    const [lightningHue, setLightningHue] = useState(220);
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5,
                ease: "easeOut" as const
            }
        }
    };

    return (
        <div className="relative w-full bg-black text-white overflow-hidden font-sans">
            {/* Main container with space for content */}
            <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-screen flex flex-col">
                {/* Navigation */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="px-4 backdrop-blur-3xl bg-black/50 rounded-full py-4 flex justify-between items-center mb-8"
                >
                    <div className="flex items-center">
                        <div className="text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>
                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                                <path d="M20 5L5 20L20 35L35 20L20 5Z" stroke="white" strokeWidth="2" />
                            </svg>
                        </div>
                        <div className="flex items-center space-x-6 ml-8">
                            <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-full text-sm transition-colors">Start Detector</button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-800/80 backdrop-blur-sm rounded-full text-sm hover:bg-gray-700/80 transition-colors">Go Home</button>
                    </div>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full z-200 top-[20%] relative"
                >
                    <motion.div variants={itemVariants}>
                        <FeatureItem name="AI-Powered" value="Fact Checking" position="left-0 sm:left-10 top-20" />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <FeatureItem name="Real-time" value="Analysis" position="left-1/4 -top-12" />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <FeatureItem name="Detailed" value="Explanations" position="right-1/4 -top-12" />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <FeatureItem name="Fake News" value="Detection" position="right-0 sm:right-10 top-20" />
                    </motion.div>
                </motion.div>

                {/* Main hero content */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative z-30 flex flex-col items-center text-center max-w-4xl mx-auto flex-grow justify-center mt-[-100px]"
                >
                    <ElasticHueSlider
                        value={lightningHue}
                        onChange={setLightningHue}
                        label="Adjust Mood"
                    />
                    {/* Button: "Join us for free world" */}
                    <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/')}
                        className="flex items-center space-x-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full text-sm mb-6 transition-all duration-300 group mt-8"
                    >
                        <span>Start Analyzing Truth</span>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transform group-hover:translate-x-1 transition-transform duration-300">
                            <path d="M8 3L13 8L8 13M13 8H3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </motion.button>

                    <motion.h1
                        variants={itemVariants}
                        className="text-5xl md:text-7xl font-light mb-2 tracking-tight"
                    >
                        AI Fake News Detector
                    </motion.h1>

                    <motion.h2
                        variants={itemVariants}
                        className="text-3xl md:text-5xl pb-3 font-light bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent"
                    >
                        Illuminating The Truth
                    </motion.h2>

                    {/* Description */}
                    <motion.p
                        variants={itemVariants}
                        className="text-gray-400 mb-9 max-w-2xl text-lg"
                    >
                        Detect fake news, misinformation, and bias with advanced AI. Get confidence scores, sentiment analysis, and detailed explanations in seconds.
                    </motion.p>


                    <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/')}
                        className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors text-lg border border-white/10"
                    >
                        Verify News Now
                    </motion.button>
                </motion.div>
            </div>

            {/* Background elements */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 z-0"
            >
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/80"></div>

                {/* Glowing circle */}
                <div className="absolute top-[55%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-b from-blue-500/20 to-purple-600/10 blur-3xl"></div>

                {/* Central light beam - now using the state variable for hue */}
                <div className="absolute top-0 w-[100%] left-1/2 transform -translate-x-1/2 h-full opacity-60">
                    <Lightning
                        hue={lightningHue}
                        xOffset={0}
                        speed={1.6}
                        intensity={0.6}
                        size={2}
                    />
                </div>

                {/* Planet/sphere */}
                <div className="z-10 absolute top-[55%] left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] backdrop-blur-3xl rounded-full bg-[radial-gradient(circle_at_25%_90%,_#1e386b_15%,_#000000de_70%,_#000000ed_100%)]"></div>
            </motion.div>
        </div>
    );
};
