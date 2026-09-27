import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSystem } from '../context/SystemContext';

interface WorkstationProps {
  position?: [number, number, number];
}

export const Workstation: React.FC<WorkstationProps> = ({ position }) => {
  const {
    triggerSound,
    reducedMotion,
    lampOn,
    toggleLamp,
    lofiPlaying,
    toggleLofi,
  } = useSystem();

  const [monitorHovered, setMonitorHovered] = useState(false);
  const [verticalHovered, setVerticalHovered] = useState(false);
  const [pcHovered, setPcHovered] = useState(false);
  const [speakerHovered, setSpeakerHovered] = useState(false);
  const [keyboardHovered, setKeyboardHovered] = useState(false);
  const [mouseHovered, setMouseHovered] = useState(false);
  const [pcRgbMode, setPcRgbMode] = useState(0);
  const [monitorTab, setMonitorTab] = useState<'dev' | 'pong' | 'stack'>('dev');

  const { size } = useThree();
  const isMobile = size.width < 768;
  const isTablet = size.width >= 768 && size.width < 1024;
  const defaultShiftX = isMobile ? 0 : isTablet ? 0.45 : 0.85;
  const defaultShiftY = isMobile ? -0.72 : 0;
  const defaultScale = isMobile ? 0.68 : isTablet ? 0.85 : 1;
  const groupPosition: [number, number, number] = position ?? [defaultShiftX, defaultShiftY, 0];

  const groupRef = useRef<THREE.Group>(null);
  const pcFan1Ref = useRef<THREE.Object3D | null>(null);
  const pcFan2Ref = useRef<THREE.Object3D | null>(null);
  const pcFan3Ref = useRef<THREE.Object3D | null>(null);
  const pcFanRearRef = useRef<THREE.Object3D | null>(null);
  const screenBarLedRef = useRef<THREE.Mesh | null>(null);
  const pcFanLightRef = useRef<THREE.PointLight>(null);
  const pcInteriorLightRef = useRef<THREE.PointLight>(null);
  const pcBounceLightRef = useRef<THREE.PointLight>(null);

  interface RgbElement {
    mesh: THREE.Mesh;
    materials: THREE.MeshStandardMaterial[];
    phaseOffset: number;
  }
  const rgbElementsRef = useRef<RgbElement[]>([]);

  const cursorBlinkRef = useRef(0);
  const screenMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const verticalScreenMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  // Authentic Battlestation ARGB Profiles
  const PC_RGB_THEMES = [
    { name: 'Rainbow Spectrum', primary: '#00E5FF', secondary: '#EC4899', glow: '#8B5CF6' },
    { name: 'Cyber Neon', primary: '#A855F7', secondary: '#EC4899', glow: '#F472B6' },
    { name: 'Emerald Matrix', primary: '#10B981', secondary: '#34D399', glow: '#6EE7B7' },
    { name: 'Sunset Amber', primary: '#F59E0B', secondary: '#EF4444', glow: '#FDE68A' },
  ];
  const currentRgb = PC_RGB_THEMES[pcRgbMode % PC_RGB_THEMES.length];

  // Pong game state inside the curved monitor canvas
  const pongState = useRef({
    ballX: 512,
    ballY: 256,
    ballVx: 5,
    ballVy: 3.5,
    paddleY: 220,
    score: 0,
    aiPaddleY: 220,
  });

  // Load Blender 3D Model
  const { scene: originalScene } = useGLTF('/models/pc_setup.glb');
  const scene = useMemo(() => originalScene.clone(true), [originalScene]);

  // Dual Studio Monitor Screen Canvases & Textures
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // 1. Main Curved Ultrawide Canvas (1024 x 512)
    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = 1024;
    mainCanvas.height = 512;
    const mainTexture = new THREE.CanvasTexture(mainCanvas);
    mainTexture.minFilter = THREE.LinearFilter;
    mainTexture.magFilter = THREE.LinearFilter;

    const mainMat = new THREE.MeshBasicMaterial({
      map: mainTexture,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    screenMaterialRef.current = mainMat;

    // 2. Vertical Portrait Canvas (512 x 1024)
    const vertCanvas = document.createElement('canvas');
    vertCanvas.width = 512;
    vertCanvas.height = 1024;
    const vertTexture = new THREE.CanvasTexture(vertCanvas);
    vertTexture.minFilter = THREE.LinearFilter;
    vertTexture.magFilter = THREE.LinearFilter;

    const vertMat = new THREE.MeshBasicMaterial({
      map: vertTexture,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    verticalScreenMaterialRef.current = vertMat;

    return () => {
      mainTexture.dispose();
      vertTexture.dispose();
      mainMat.dispose();
      vertMat.dispose();
    };
  }, []);

  // Hook Blender meshes to textures, dynamic materials & references
  useEffect(() => {
    if (!scene) return;

    const rgbElements: {
      mesh: THREE.Mesh;
      materials: THREE.MeshStandardMaterial[];
      phaseOffset: number;
    }[] = [];

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.name === 'Screen_Ultrawide') {
          if (screenMaterialRef.current) {
            mesh.material = screenMaterialRef.current;
          }
        } else if (mesh.name === 'Screen_Vertical') {
          if (verticalScreenMaterialRef.current) {
            mesh.material = verticalScreenMaterialRef.current;
          }
        } else if (mesh.name === 'ScreenBar_LED') {
          screenBarLedRef.current = mesh;
        } else if (mesh.name.includes('Glass')) {
          // Crystal-clear tempered glass with subtle dark tint
          mesh.material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#0f172a'),
            transparent: true,
            opacity: 0.20,
            roughness: 0.04,
            metalness: 0.05,
            transmission: 0.92,
            ior: 1.52,
            depthWrite: false,
            side: THREE.DoubleSide,
          });
        } else if (
          mesh.name.includes('Ring') ||
          mesh.name.includes('RGB') ||
          mesh.name.includes('LED') ||
          mesh.name.includes('Logo') ||
          mesh.name === 'Mouse_Wheel'
        ) {
          const rawMats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          const standardMats: THREE.MeshStandardMaterial[] = [];

          rawMats.forEach((m) => {
            if (m) {
              const cloned = m.clone() as THREE.MeshStandardMaterial;
              cloned.roughness = 0.2;
              cloned.metalness = 0.1;
              if (cloned.emissive) {
                cloned.emissiveIntensity = 5.0;
              }
              standardMats.push(cloned);
            }
          });

          mesh.material = Array.isArray(mesh.material) ? standardMats : standardMats[0];

          let phase = 0.0;
          if (mesh.name.includes('Fan_1')) phase = 0.0;
          else if (mesh.name.includes('Fan_2')) phase = 0.22;
          else if (mesh.name.includes('Fan_3')) phase = 0.44;
          else if (mesh.name.includes('Fan_Rear')) phase = 0.65;
          else if (mesh.name.includes('AIO_Ring')) phase = 0.75;
          else if (mesh.name.includes('AIO_Logo')) phase = 0.82;
          else if (mesh.name.includes('RAM')) phase = 0.88;
          else if (mesh.name.includes('GPU')) phase = 0.52;
          else if (mesh.name.includes('Top_RGB')) phase = 0.35;
          else if (mesh.name.includes('KB_RGB_Left')) phase = 0.12;
          else if (mesh.name.includes('KB_RGB_Center')) phase = 0.26;
          else if (mesh.name.includes('KB_RGB_Right')) phase = 0.42;
          else if (mesh.name.includes('Key_Space_RGB')) phase = 0.22;
          else if (mesh.name.includes('Mouse_Wheel')) phase = 0.55;
          else if (mesh.name.includes('Mouse_Underglow') || mesh.name.includes('Mouse_RGB')) phase = 0.72;
          else if (mesh.name.includes('Mouse')) phase = 0.65;

          rgbElements.push({
            mesh,
            materials: standardMats,
            phaseOffset: phase,
          });
        }
      }

      if (child.name === 'PC_Fan_1') pcFan1Ref.current = child;
      if (child.name === 'PC_Fan_2') pcFan2Ref.current = child;
      if (child.name === 'PC_Fan_3') pcFan3Ref.current = child;
      if (child.name === 'PC_Fan_Rear') pcFanRearRef.current = child;
    });

    rgbElementsRef.current = rgbElements;
  }, [scene]);

  // Update dynamic Lamp state
  useEffect(() => {
    if (screenBarLedRef.current && screenBarLedRef.current.material) {
      const mat = screenBarLedRef.current.material as THREE.MeshStandardMaterial;
      if (mat.emissive) {
        if (lampOn) {
          mat.emissive.set('#FEF08A');
          mat.emissiveIntensity = 2.0;
        } else {
          mat.emissive.set('#000000');
          mat.emissiveIntensity = 0;
        }
      }
    }
  }, [lampOn]);

  // Real-time Canvas Rendering Loop
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    cursorBlinkRef.current = Math.floor(time * 2) % 2;

    // ==========================================
    // 1. MAIN CURVED ULTRAWIDE MONITOR RENDERING
    // ==========================================
    const mainMat = screenMaterialRef.current;
    if (mainMat && mainMat.map) {
      const texture = mainMat.map as THREE.CanvasTexture;
      const canvas = texture.image as HTMLCanvasElement;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Pristine White Theme Background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 1024, 512);

          // Top Title Bar (macOS / VS Code Light)
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(0, 0, 1024, 38);
          ctx.fillStyle = '#E2E8F0';
          ctx.fillRect(0, 37, 1024, 1);

          // Traffic light buttons
          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(22, 19, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.arc(38, 19, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.arc(54, 19, 5, 0, Math.PI * 2);
          ctx.fill();

          // Editor Navigation Tabs
          const tabs: { id: 'dev' | 'pong' | 'stack'; label: string; x: number }[] = [
            { id: 'dev', label: '1. NexaAgent.tsx [RUNNING]', x: 76 },
            { id: 'stack', label: '2. SERVER CONSOLE', x: 260 },
            { id: 'pong', label: '3. PLAY PONG', x: 410 },
          ];

          tabs.forEach((tab) => {
            const isSelected = monitorTab === tab.id;
            ctx.fillStyle = isSelected ? '#FFFFFF' : '#F1F5F9';
            ctx.fillRect(tab.x, 6, 170, 31);
            if (isSelected) {
              ctx.fillStyle = '#2563EB';
              ctx.fillRect(tab.x, 6, 170, 2.5);
              ctx.fillStyle = '#E2E8F0';
              ctx.fillRect(tab.x, 6, 1, 31);
              ctx.fillRect(tab.x + 169, 6, 1, 31);
            }
            ctx.fillStyle = isSelected ? '#0F172A' : '#64748B';
            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.fillText(tab.label, tab.x + 10, 24);
          });

          // Top Right Status Telemetry
          if (lofiPlaying) {
            ctx.fillStyle = '#16A34A';
            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.fillText('LO-FI AUDIO ♫', 830, 23);
            for (let i = 0; i < 5; i++) {
              const barH = 3 + Math.abs(Math.sin(time * 5 + i * 1.2)) * 10;
              ctx.fillRect(925 + i * 6, 26 - barH, 3.5, barH);
            }
          } else {
            const pulse = 0.5 + Math.sin(time * 4) * 0.5;
            ctx.fillStyle = `rgba(16, 185, 129, ${pulse})`;
            ctx.beginPath();
            ctx.arc(935, 19, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#10B981';
            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.fillText('WHITE BATTLESTATION', 944, 23);
          }

          // TAB 1: Real-Time Streaming Code Editor
          if (monitorTab === 'dev') {
            // Main Code Window
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(16, 48, 640, 310);
            ctx.strokeStyle = '#E2E8F0';
            ctx.lineWidth = 1;
            ctx.strokeRect(16, 48, 640, 310);

            // Line numbers Gutter
            ctx.fillStyle = '#F8FAFC';
            ctx.fillRect(16, 48, 38, 310);
            ctx.strokeStyle = '#E2E8F0';
            ctx.beginPath();
            ctx.moveTo(54, 48);
            ctx.lineTo(54, 358);
            ctx.stroke();

            const codeLines = [
              { num: 1, text: '// Yash Hogade · Final-Year CE @ AISSMS COE Pune', color: '#64748B' },
              { num: 2, text: 'import { useState, useEffect } from "react";', color: '#7C3AED' },
              { num: 3, text: 'import { NexaAIClient } from "@/services/nexa";', color: '#2563EB' },
              { num: 4, text: '', color: '#1E293B' },
              { num: 5, text: 'export const NexaConversationalAgent = () => {', color: '#0F172A' },
              { num: 6, text: '  const [status, setStatus] = useState("STREAMING");', color: '#059669' },
              { num: 7, text: '  const [tokenBuffer, setTokens] = useState<string[]>([]);', color: '#0D9488' },
              { num: 8, text: '  const [modelSpeed] = useState("48.6 tok/s");', color: '#D97706' },
              { num: 9, text: '', color: '#1E293B' },
              { num: 10, text: '  async function executeAgentPrompt(query: string) {', color: '#7C3AED' },
              { num: 11, text: '    const stream = await NexaAIClient.streamResponse(query);', color: '#2563EB' },
              { num: 12, text: '    for await (const chunk of stream) {', color: '#D97706' },
              { num: 13, text: '      setTokens((prev) => [...prev, chunk.text]);', color: '#059669' },
              { num: 14, text: '    }', color: '#7C3AED' },
              { num: 15, text: '  }', color: '#0F172A' },
            ];

            ctx.font = '10px "JetBrains Mono", monospace';
            codeLines.forEach((line, index) => {
              const y = 68 + index * 18;
              ctx.fillStyle = '#94A3B8';
              ctx.fillText(`${line.num}`, 22, y);

              ctx.fillStyle = line.color;
              ctx.fillText(line.text, 64, y);
            });

            // Live Typing Stream
            const streamWords = [
              'await NexaClient.dispatch({ event: "AGENT_CONVERSATION_ACTIVE" });',
              '// Latency: 12ms · White Battlestation telemetry synced',
              'const agentPayload = { status: 200, role: "assistant" };',
              'emitLiveTelemetry({ fps: 60, status: "NOMINAL" });',
            ];
            const currentLineIdx = Math.floor(time * 0.7) % streamWords.length;
            const fullText = streamWords[currentLineIdx];
            const charCount = Math.floor((time * 28) % (fullText.length + 15));
            const typedText = fullText.slice(0, Math.min(charCount, fullText.length));

            const streamY = 68 + 15 * 18;
            ctx.fillStyle = '#94A3B8';
            ctx.fillText('16', 22, streamY);
            ctx.fillStyle = '#2563EB';
            ctx.fillText(typedText, 64, streamY);

            if (cursorBlinkRef.current === 1) {
              const textWidth = ctx.measureText(typedText).width;
              ctx.fillStyle = '#2563EB';
              ctx.fillRect(66 + textWidth, streamY - 10, 6, 12);
            }

            // Right-Side System Telemetry (Clean White Card)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(666, 48, 342, 310);
            ctx.strokeStyle = '#E2E8F0';
            ctx.strokeRect(666, 48, 342, 310);

            ctx.fillStyle = '#F8FAFC';
            ctx.fillRect(666, 48, 342, 28);
            ctx.fillStyle = '#0F172A';
            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.fillText('SYSTEM HEALTH & TELEMETRY', 678, 66);

            // Waveform Graphic (CPU Workload)
            ctx.strokeStyle = '#2563EB';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let x = 0; x < 318; x += 3) {
              const waveY =
                135 +
                Math.sin(time * 4 + x * 0.05) * 16 +
                Math.cos(time * 2 + x * 0.1) * 8;
              if (x === 0) ctx.moveTo(678 + x, waveY);
              else ctx.lineTo(678 + x, waveY);
            }
            ctx.stroke();

            // Telemetry Stat Cards
            const stats = [
              { label: 'CPU LOAD', val: `${Math.round(24 + Math.sin(time * 3) * 6)}%`, col: '#2563EB' },
              { label: 'GPU RTX', val: '41°C', col: '#10B981' },
              { label: 'RAM', val: '14.8 GB', col: '#8B5CF6' },
              { label: 'STREAM', val: '48.6 tps', col: '#F59E0B' },
            ];
            stats.forEach((st, i) => {
              const sx = 678 + (i % 2) * 160;
              const sy = 175 + Math.floor(i / 2) * 55;
              ctx.fillStyle = '#F8FAFC';
              ctx.fillRect(sx, sy, 150, 46);
              ctx.strokeStyle = '#E2E8F0';
              ctx.strokeRect(sx, sy, 150, 46);

              ctx.fillStyle = '#64748B';
              ctx.font = '9px "JetBrains Mono", monospace';
              ctx.fillText(st.label, sx + 10, sy + 18);
              ctx.fillStyle = st.col;
              ctx.font = 'bold 14px "JetBrains Mono", monospace';
              ctx.fillText(st.val, sx + 10, sy + 38);
            });

            // Live Mini Status Chip
            ctx.fillStyle = '#F0FDF4';
            ctx.fillRect(678, 295, 318, 48);
            ctx.strokeStyle = '#BBF7D0';
            ctx.strokeRect(678, 295, 318, 48);
            ctx.fillStyle = '#059669';
            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.fillText('● NEXA AI INFERENCE ENGINE ONLINE', 690, 316);
            ctx.fillStyle = '#065F46';
            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.fillText('AISSMS COE · Yash Hogade · White Setup Active', 690, 332);

            // Bottom Integrated Terminal (Clean Light Theme)
            ctx.fillStyle = '#F8FAFC';
            ctx.fillRect(16, 368, 992, 132);
            ctx.strokeStyle = '#E2E8F0';
            ctx.strokeRect(16, 368, 992, 132);

            ctx.fillStyle = '#F1F5F9';
            ctx.fillRect(16, 368, 992, 22);
            ctx.fillStyle = '#475569';
            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.fillText('INTEGRATED TERMINAL // bash · node v22.12.0 · vite dev (5174)', 26, 383);

            const logs = [
              `[${new Date().toLocaleTimeString()}] HTTP 200 GET /api/v1/nexa/status (14ms)`,
              `[${new Date().toLocaleTimeString()}] WebSocket Handshake established [protocol: WSS]`,
              `[${new Date().toLocaleTimeString()}] Agent stream generation active: 48.6 tokens/sec`,
              `[${new Date().toLocaleTimeString()}] Blender 3D Battlestation GLB loaded @ 60fps`,
            ];
            ctx.font = '9px "JetBrains Mono", monospace';
            logs.forEach((log, lIdx) => {
              ctx.fillStyle = lIdx === 3 ? '#2563EB' : '#334155';
              ctx.fillText(`$ ${log}`, 26, 408 + lIdx * 20);
            });
          }

          // TAB 2: Server Console (Clean Light Theme)
          else if (monitorTab === 'stack') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(16, 48, 992, 452);
            ctx.strokeStyle = '#E2E8F0';
            ctx.strokeRect(16, 48, 992, 452);

            ctx.fillStyle = '#2563EB';
            ctx.font = 'bold 15px "JetBrains Mono", monospace';
            ctx.fillText('YASH.DEV // HIGH-PERFORMANCE PRODUCTION STACK', 40, 85);

            const stackItems = [
              '• Frontend: React 19 · TypeScript · Three.js · Tailwind CSS',
              '• Backend: Node.js · Express · REST APIs · WebSockets · MongoDB',
              '• 3D Asset: Blender 4.2 LTS · Procedural Bevels & PBR Shading',
              '• Systems: SPPU AISSMS COE Pune · Computer Engineering 2026',
            ];
            ctx.fillStyle = '#334155';
            ctx.font = '12px "JetBrains Mono", monospace';
            stackItems.forEach((item, sIdx) => {
              ctx.fillText(item, 40, 130 + sIdx * 35);
            });
          }

          // TAB 3: Interactive Retro Pong (Clean Light Theme)
          else if (monitorTab === 'pong') {
            const p = pongState.current;
            p.ballX += p.ballVx;
            p.ballY += p.ballVy;
            if (p.ballY <= 65 || p.ballY >= 480) p.ballVy *= -1;

            p.aiPaddleY += (p.ballY - (p.aiPaddleY + 35)) * 0.08;
            p.paddleY += (p.ballY - (p.paddleY + 35)) * 0.12;

            if (p.ballX <= 50 && p.ballY >= p.paddleY && p.ballY <= p.paddleY + 70) {
              p.ballVx = Math.abs(p.ballVx) * 1.02;
              p.score += 1;
            }
            if (p.ballX >= 970 && p.ballY >= p.aiPaddleY && p.ballY <= p.aiPaddleY + 70) {
              p.ballVx = -Math.abs(p.ballVx) * 1.02;
            }
            if (p.ballX < 20 || p.ballX > 1000) {
              p.ballX = 512;
              p.ballY = 256;
              p.ballVx = 5;
            }

            ctx.fillStyle = '#F8FAFC';
            ctx.fillRect(16, 48, 992, 452);
            ctx.strokeStyle = '#E2E8F0';
            ctx.strokeRect(16, 48, 992, 452);

            ctx.fillStyle = '#0F172A';
            ctx.font = 'bold 18px "JetBrains Mono", monospace';
            ctx.fillText(`SCORE: ${p.score}`, 480, 80);

            ctx.fillStyle = '#2563EB';
            ctx.fillRect(36, p.paddleY, 12, 70);

            ctx.fillStyle = '#EF4444';
            ctx.fillRect(976, p.aiPaddleY, 12, 70);

            ctx.fillStyle = '#F59E0B';
            ctx.beginPath();
            ctx.arc(p.ballX, p.ballY, 7, 0, Math.PI * 2);
            ctx.fill();
          }

          // Interactive Hover Callout Banner on Monitor
          if (monitorHovered) {
            ctx.fillStyle = 'rgba(37, 99, 235, 0.95)';
            ctx.fillRect(36, 420, 952, 60);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px "Space Grotesk", sans-serif';
            ctx.fillText('CLICK MONITOR TO SWITCH APPS // LIVE WORKSTATION RUNNING ↗', 56, 456);
          }

          texture.needsUpdate = true;
        }
      }
    }

    // ==========================================
    // 2. VERTICAL PORTRAIT MONITOR RENDERING (LIGHT THEME)
    // ==========================================
    const vertMat = verticalScreenMaterialRef.current;
    if (vertMat && vertMat.map) {
      const texture = vertMat.map as THREE.CanvasTexture;
      const canvas = texture.image as HTMLCanvasElement;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(0, 0, 512, 1024);

          // Top Sunset Mountain Wallpaper Silhouette (Exact Match to Reference Photo)
          const grad = ctx.createLinearGradient(0, 0, 0, 240);
          grad.addColorStop(0, '#F59E0B');
          grad.addColorStop(0.35, '#F43F5E');
          grad.addColorStop(0.7, '#881337');
          grad.addColorStop(1, '#311042');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 512, 240);

          // Mountain Silhouettes in Rich Crimson & Dark Indigo
          ctx.fillStyle = '#4C0519';
          ctx.beginPath();
          ctx.moveTo(0, 240);
          ctx.lineTo(0, 160);
          ctx.lineTo(90, 130);
          ctx.lineTo(190, 175);
          ctx.lineTo(310, 120);
          ctx.lineTo(420, 165);
          ctx.lineTo(512, 135);
          ctx.lineTo(512, 240);
          ctx.fill();

          ctx.fillStyle = '#1E1B4B';
          ctx.beginPath();
          ctx.moveTo(0, 240);
          ctx.lineTo(0, 190);
          ctx.lineTo(120, 170);
          ctx.lineTo(240, 205);
          ctx.lineTo(380, 165);
          ctx.lineTo(512, 195);
          ctx.lineTo(512, 240);
          ctx.fill();

          // Watchtower Silhouette (Reference photo detail)
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(305, 104, 10, 16);
          ctx.fillRect(301, 100, 18, 4);

          // Header Overlay
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 15px "JetBrains Mono", monospace';
          ctx.fillText('YASH.DEV // NODE 01', 24, 42);
          ctx.fillStyle = '#FED7AA';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText('VERTICAL EXPANSION DISPLAY', 24, 62);

          // Hardware Health Status Section (Clean White Card)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(16, 252, 480, 190);
          ctx.strokeStyle = '#E2E8F0';
          ctx.strokeRect(16, 252, 480, 190);

          ctx.fillStyle = '#0F172A';
          ctx.font = 'bold 12px "JetBrains Mono", monospace';
          ctx.fillText('HARDWARE ENGINE METRICS', 32, 280);

          const vertStats = [
            { name: 'CPU: AMD Ryzen 9', detail: '24% · 4.85 GHz · 45W', pct: 0.24, color: '#2563EB' },
            { name: 'GPU: GeForce RTX 4080 (White)', detail: '41°C · 38% Load · 16GB', pct: 0.38, color: '#10B981' },
            { name: 'RAM: DDR5 6000MHz White', detail: '14.8 / 32.0 GB in Use', pct: 0.46, color: '#8B5CF6' },
            { name: 'NVMe Gen4 SSD', detail: 'Read: 6850 MB/s', pct: 0.72, color: '#F59E0B' },
          ];

          vertStats.forEach((st, sIdx) => {
            const sy = 300 + sIdx * 34;
            ctx.fillStyle = '#475569';
            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            ctx.fillText(st.name, 32, sy);
            ctx.fillStyle = '#64748B';
            ctx.font = '9px "JetBrains Mono", monospace';
            ctx.fillText(st.detail, 270, sy);

            ctx.fillStyle = '#F1F5F9';
            ctx.fillRect(32, sy + 6, 448, 6);
            ctx.fillStyle = st.color;
            ctx.fillRect(32, sy + 6, 448 * st.pct, 6);
          });

          // Active Project File Tree Explorer (Clean White Card)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(16, 458, 480, 240);
          ctx.strokeStyle = '#E2E8F0';
          ctx.strokeRect(16, 458, 480, 240);

          ctx.fillStyle = '#0F172A';
          ctx.font = 'bold 12px "JetBrains Mono", monospace';
          ctx.fillText('PROJECT EXPLORER [AISSMS / 2026]', 32, 486);

          const treeItems = [
            { icon: '📁', name: 'src/components3d/Workstation.tsx', active: true },
            { icon: '📁', name: 'public/models/pc_setup.glb', active: true },
            { icon: '📁', name: 'src/agents/nexa/NexaConversationalAgent.tsx', active: true },
            { icon: '📁', name: 'src/services/apiClient.ts', active: false },
            { icon: '📁', name: 'src/context/SystemProvider.tsx', active: false },
            { icon: '📁', name: 'src/sections/HeroSection.tsx', active: false },
            { icon: '📁', name: 'src/sections/ProjectsSection.tsx', active: false },
          ];

          treeItems.forEach((item, tIdx) => {
            const ty = 514 + tIdx * 24;
            if (item.active) {
              ctx.fillStyle = '#EFF6FF';
              ctx.fillRect(24, ty - 14, 464, 20);
            }
            ctx.fillStyle = item.active ? '#2563EB' : '#334155';
            ctx.font = item.active
              ? 'bold 10px "JetBrains Mono", monospace'
              : '10px "JetBrains Mono", monospace';
            ctx.fillText(`${item.icon}  ${item.name}`, 36, ty);
          });

          // Live Container Daemon Log Stream
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(16, 714, 480, 294);
          ctx.strokeStyle = '#E2E8F0';
          ctx.strokeRect(16, 714, 480, 294);

          ctx.fillStyle = '#F1F5F9';
          ctx.fillRect(16, 714, 480, 28);
          ctx.fillStyle = '#0284C7';
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.fillText('LIVE CONTAINER DAEMON // docker-compose.yml', 28, 732);

          const vertLogs = [
            `[13:45:01] container nexa-core-v2: HEALTHCHECK OK`,
            `[13:45:06] redis-cache: cluster node 1 ready`,
            `[13:45:12] vite-dev-server: 2476 modules hot-reloaded`,
            `[13:45:18] fan-controller: CHASSIS_FANS @ 3600 RPM [TURBO]`,
            `[13:45:25] Three.js canvas buffer refreshed @ 60 FPS`,
            `[13:45:31] GET /v1/health 200 OK (0.8ms)`,
            `[13:45:39] GPU_TEMP: 38°C | COOLING: 100% MAXIMUM`,
            `[13:45:47] Ready for user interaction.`,
          ];

          ctx.font = '9px "JetBrains Mono", monospace';
          vertLogs.forEach((vlog, vIdx) => {
            ctx.fillStyle = vIdx >= 6 ? '#059669' : '#475569';
            ctx.fillText(`> ${vlog}`, 28, 762 + vIdx * 26);
          });

          texture.needsUpdate = true;
        }
      }
    }
  });

  // Pre-calculated fan normal rotation axes for realistic aerofoil spin (straight along Z-axis)
  const frontFanAxis = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const rearFanAxis = useMemo(() => new THREE.Vector3(0, 0, -1), []);

  // Smooth Fan Rotations & Real-Time Dynamic ARGB Lighting in useFrame
  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();

    if (!reducedMotion) {
      // 3600 RPM High Performance Turbo Fan Speed
      // (3600 RPM / 60) * 2 * PI = 376.99 rad/s base angular velocity.
      // Scaled by anti-stroboscopic visual sampling with micro-turbulence so the 3600 RPM high-speed blur
      // remains continuously visible across 60Hz/120Hz/144Hz displays without wagon-wheel freeze.
      const FAN_RPM = 3600;
      const baseAngularVelocity = (FAN_RPM * 2 * Math.PI) / 60; // 376.99 rad/s
      const turboSpeed = (baseAngularVelocity / 6.0) + Math.sin(time * 8.0) * 4.0;
      const rot = delta * turboSpeed;
      if (pcFan1Ref.current) pcFan1Ref.current.rotateOnWorldAxis(frontFanAxis, rot);
      if (pcFan2Ref.current) pcFan2Ref.current.rotateOnWorldAxis(frontFanAxis, rot);
      if (pcFan3Ref.current) pcFan3Ref.current.rotateOnWorldAxis(frontFanAxis, rot);
      if (pcFanRearRef.current) pcFanRearRef.current.rotateOnWorldAxis(rearFanAxis, rot);
    }

    // Dynamic ARGB Lighting Animation Loop
    if (rgbElementsRef.current.length > 0) {
      if (pcRgbMode === 0) {
        // Mode 0: Vibrant Rainbow Wave across individual fans and interior components
        rgbElementsRef.current.forEach((el) => {
          const hue = (time * 0.22 + el.phaseOffset) % 1.0;
          const col = new THREE.Color().setHSL(hue, 1.0, 0.55);
          el.materials.forEach((mat) => {
            if (mat.emissive) {
              mat.emissive.copy(col);
              mat.color.copy(col);
              mat.emissiveIntensity = 4.5;
            }
          });
        });

        // Sync scene wash lights with dynamic colors
        const frontHue = (time * 0.22 + 0.2) % 1.0;
        const intHue = (time * 0.22 + 0.7) % 1.0;
        if (pcFanLightRef.current) {
          pcFanLightRef.current.color.setHSL(frontHue, 1.0, 0.6);
          pcFanLightRef.current.intensity = 3.5;
        }
        if (pcInteriorLightRef.current) {
          pcInteriorLightRef.current.color.setHSL(intHue, 1.0, 0.6);
          pcInteriorLightRef.current.intensity = 3.8;
        }
        if (pcBounceLightRef.current) {
          pcBounceLightRef.current.color.setHSL(frontHue, 1.0, 0.5);
          pcBounceLightRef.current.intensity = 1.8;
        }
      } else {
        // Fixed Themes (Cyber Neon, Emerald Matrix, Sunset Amber) with breathing pulse
        const pulse = 3.8 + Math.sin(time * 3.0) * 0.8;
        const primaryCol = new THREE.Color(currentRgb.primary);
        const secCol = new THREE.Color(currentRgb.secondary);

        rgbElementsRef.current.forEach((el) => {
          const useSec = el.phaseOffset > 0.5;
          const targetColor = useSec ? secCol : primaryCol;
          el.materials.forEach((mat) => {
            if (mat.emissive) {
              mat.emissive.copy(targetColor);
              mat.color.copy(targetColor);
              mat.emissiveIntensity = pulse;
            }
          });
        });

        if (pcFanLightRef.current) {
          pcFanLightRef.current.color.copy(primaryCol);
          pcFanLightRef.current.intensity = 3.2 + Math.sin(time * 3.0) * 0.6;
        }
        if (pcInteriorLightRef.current) {
          pcInteriorLightRef.current.color.copy(secCol);
          pcInteriorLightRef.current.intensity = 3.5 + Math.cos(time * 3.0) * 0.7;
        }
        if (pcBounceLightRef.current) {
          pcBounceLightRef.current.color.copy(new THREE.Color(currentRgb.glow));
          pcBounceLightRef.current.intensity = 1.8;
        }
      }
    }
  });

  // Handle PC Tower Click (cycling RGB themes)
  const handlePcClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    triggerSound('click');
    setPcRgbMode((prev) => (prev + 1) % PC_RGB_THEMES.length);
  };

  // Handle Monitor Click (cycling tabs)
  const handleMonitorClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    triggerSound('click');
    setMonitorTab((prev) => (prev === 'dev' ? 'pong' : prev === 'pong' ? 'stack' : 'dev'));
  };

  return (
    <group ref={groupRef} position={groupPosition} scale={defaultScale}>
      {/* 3D Blender Battlestation Model */}
      <primitive object={scene} />

      {/* Interactive Click / Hover Zone for Monitor */}
      <mesh
        position={[-0.08, 0.28, -0.20]}
        onClick={handleMonitorClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setMonitorHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setMonitorHovered(false);
          document.body.style.cursor = 'auto';
        }}
        visible={false}
      >
        <boxGeometry args={[1.48, 0.65, 0.15]} />
      </mesh>

      {/* Interactive Click / Hover Zone for Vertical Monitor */}
      <mesh
        position={[-0.99, 0.30, -0.01]}
        rotation={[0, -0.48, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          setVerticalHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setVerticalHovered(false);
          document.body.style.cursor = 'auto';
        }}
        visible={false}
      >
        <boxGeometry args={[0.48, 0.88, 0.12]} />
      </mesh>

      {/* Interactive Click / Hover Zone for PC Tower */}
      <mesh
        position={[0.96, 0.04, -0.04]}
        rotation={[0, 0, 0]}
        onClick={handlePcClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setPcHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setPcHovered(false);
          document.body.style.cursor = 'auto';
        }}
        visible={false}
      >
        <boxGeometry args={[0.30, 0.72, 0.54]} />
      </mesh>

      {/* Interactive Click / Hover Zone for Speakers */}
      <mesh
        position={[-0.58, -0.22, -0.16]}
        onClick={(e) => {
          e.stopPropagation();
          toggleLofi();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setSpeakerHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setSpeakerHovered(false);
          document.body.style.cursor = 'auto';
        }}
        visible={false}
      >
        <boxGeometry args={[0.16, 0.24, 0.18]} />
      </mesh>

      <mesh
        position={[0.50, -0.22, -0.16]}
        onClick={(e) => {
          e.stopPropagation();
          toggleLofi();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setSpeakerHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setSpeakerHovered(false);
          document.body.style.cursor = 'auto';
        }}
        visible={false}
      >
        <boxGeometry args={[0.16, 0.24, 0.18]} />
      </mesh>

      {/* Interactive Click Zone for ScreenBar Light */}
      <mesh
        position={[-0.08, 0.59, -0.16]}
        onClick={(e) => {
          e.stopPropagation();
          toggleLamp();
        }}
        visible={false}
      >
        <boxGeometry args={[0.62, 0.06, 0.08]} />
      </mesh>

      {/* PC Front Fans ARGB Wash Light */}
      <pointLight
        ref={pcFanLightRef}
        position={[0.96, 0.04, 0.28]}
        color={currentRgb.primary}
        intensity={3.5}
        distance={1.8}
        decay={2}
      />

      {/* PC Interior Hardware Wash Light */}
      <pointLight
        ref={pcInteriorLightRef}
        position={[0.92, 0.12, -0.04]}
        color={currentRgb.secondary}
        intensity={3.8}
        distance={1.6}
        decay={2}
      />

      {/* PC Desk Spill / Tabletop Bounce Light */}
      <pointLight
        ref={pcBounceLightRef}
        position={[0.82, -0.18, 0.06]}
        color={currentRgb.glow}
        intensity={1.8}
        distance={1.2}
        decay={2}
      />

      {/* Warm Illumination when ScreenBar Lamp is On */}
      {lampOn && (
        <>
          <spotLight
            position={[-0.08, 0.58, -0.14]}
            target-position={[-0.08, -0.32, 0.14]}
            color="#FEF08A"
            intensity={4.2}
            angle={Math.PI / 2.6}
            penumbra={0.65}
            distance={3.2}
            castShadow
          />
          <pointLight
            position={[-0.08, 0.60, -0.25]}
            color="#E0F2FE"
            intensity={1.2}
            distance={1.6}
          />
        </>
      )}

      {/* Hover Tooltip for PC Tower */}
      {pcHovered && (
        <Html position={[0.96, 0.46, -0.04]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#0F172A] border border-[#2563EB] shadow-2xl text-[10px] font-mono whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
            🖥️ BATTLESTATION PC // {currentRgb.name.toUpperCase()} • 3600 RPM TURBO (CLICK TO CYCLE RGB)
          </div>
        </Html>
      )}

      {/* Hover Tooltip for Vertical Monitor */}
      {verticalHovered && (
        <Html position={[-0.99, 0.76, -0.01]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#0F172A] border border-[#2563EB] shadow-2xl text-[10px] font-mono whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
            📊 VERTICAL MONITOR // TELEMETRY & PROJECT TREE
          </div>
        </Html>
      )}

      {/* Hover Tooltip for Studio Speakers */}
      {speakerHovered && (
        <Html position={[-0.58, -0.06, -0.16]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#0F172A] border border-[#2563EB] shadow-2xl text-[10px] font-mono whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
            🔊 YAMAHA STUDIO MONITORS // CLICK TO {lofiPlaying ? 'MUTE' : 'PLAY'} LO-FI
          </div>
        </Html>
      )}
      {/* Tabletop & Peripherals Accent Light for Keyboard & Mouse */}
      <pointLight
        position={[0.10, 0.15, 0.32]}
        color="#F8FAFC"
        intensity={1.8}
        distance={2.0}
        decay={2}
      />

      {/* Interactive Click / Hover Zone for EvoFox Mechanical Keyboard */}
      <mesh
        position={[-0.04, -0.30, 0.16]}
        rotation={[-0.11, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          triggerSound('click');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setKeyboardHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setKeyboardHovered(false);
          document.body.style.cursor = 'auto';
        }}
        visible={false}
      >
        <boxGeometry args={[0.34, 0.06, 0.15]} />
      </mesh>

      {/* Interactive Click / Hover Zone for Wireless Gaming Mouse */}
      <mesh
        position={[0.26, -0.30, 0.16]}
        onClick={(e) => {
          e.stopPropagation();
          triggerSound('click');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setMouseHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setMouseHovered(false);
          document.body.style.cursor = 'auto';
        }}
        visible={false}
      >
        <boxGeometry args={[0.10, 0.06, 0.14]} />
      </mesh>

      {/* Hover Tooltip for Mechanical Keyboard */}
      {keyboardHovered && (
        <Html position={[-0.04, -0.18, 0.16]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#0F172A] border border-[#2563EB] shadow-2xl text-[10px] font-mono whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
            ⌨️ EVOFOX 75% // CNC SPACE GREY • ROTARY VOLUME KNOB • MULTI-ZONE ARGB
          </div>
        </Html>
      )}

      {/* Hover Tooltip for Gaming Mouse */}
      {mouseHovered && (
        <Html position={[0.26, -0.18, 0.16]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#0F172A] border border-[#2563EB] shadow-2xl text-[10px] font-mono whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
            🖱️ WIRELESS GAMING MOUSE // 26,000 DPI • DUAL HALO WHEEL & FLOWING ARGB
          </div>
        </Html>
      )}
    </group>
  );
};

useGLTF.preload('/models/pc_setup.glb');
