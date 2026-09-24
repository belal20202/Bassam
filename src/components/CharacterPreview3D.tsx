/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PlayerCustomization } from '../types';
import { BassamCharacter, CharacterAction } from '../engine/character';
import { RotateCw, Sparkles, Hand, Eye, User, Wind } from 'lucide-react';

export type PreviewZoomMode = 'FULL' | 'FACE' | 'HANDS';

interface CharacterPreview3DProps {
  customization: PlayerCustomization;
  height?: string;
  className?: string;
  title?: string;
}

export const CharacterPreview3D: React.FC<CharacterPreview3DProps> = ({
  customization,
  height = 'h-64 sm:h-72',
  className = '',
  title = 'معاينة عداء بغداد «بسام» ثلاثية الأبعاد',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const characterRef = useRef<BassamCharacter | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const prevMouseXRef = useRef<number>(0);
  const rotationYRef = useRef<number>(0);

  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [selectedAction, setSelectedAction] = useState<CharacterAction>('IDLE');
  const [zoomMode, setZoomMode] = useState<PreviewZoomMode>('FULL');

  // Keep ref in sync for animation loop
  const selectedActionRef = useRef<CharacterAction>('IDLE');
  selectedActionRef.current = selectedAction;

  const zoomModeRef = useRef<PreviewZoomMode>('FULL');
  zoomModeRef.current = zoomMode;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const heightPx = container.clientHeight || 280;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / heightPx, 0.1, 50);
    camera.position.set(0, 1.10, 3.2);
    camera.lookAt(0, 0.92, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer with Antialiasing and Shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    keyLight.position.set(2.5, 4.0, 3.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 512;
    keyLight.shadow.mapSize.height = 512;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
    rimLight.position.set(-2.5, 3.0, -2.5);
    scene.add(rimLight);

    const warmFill = new THREE.DirectionalLight(0xf59e0b, 0.45);
    warmFill.position.set(0, -1.0, 2.0);
    scene.add(warmFill);

    // 5. Circular Display Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(0.9, 1.0, 0.1, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.6,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, -0.05, 0);
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    // Glowing rim ring around the pedestal
    const rimGeo = new THREE.TorusGeometry(0.92, 0.02, 12, 48);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.set(0, 0.01, 0);
    scene.add(rimMesh);

    // 6. Character Instance (بسام)
    const character = new BassamCharacter();
    character.currentAction = 'IDLE';
    character.group.position.set(0, 0, 0);
    character.applyCustomization(customization);
    scene.add(character.group);
    characterRef.current = character;

    // 7. Render Loop
    let clock = new THREE.Clock();
    const targetCamPos = new THREE.Vector3(0, 1.10, 3.2);
    const targetCamLook = new THREE.Vector3(0, 0.92, 0);
    const currentCamLook = new THREE.Vector3(0, 0.92, 0);

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (characterRef.current) {
        const act = selectedActionRef.current;
        if (characterRef.current.currentAction !== 'JUMP' && characterRef.current.currentAction !== 'SLIDE') {
          characterRef.current.currentAction = act;
        }

        if (act === 'RUN') {
          characterRef.current.updateAnimation(delta, 16, 1.0);
        } else if (act === 'FAST_RUN') {
          characterRef.current.updateAnimation(delta, 28, 1.8);
        } else if (act === 'JUMP') {
          characterRef.current.updateAnimation(delta, 12, 1.0);
        } else if (act === 'SLIDE') {
          characterRef.current.updateAnimation(delta, 14, 1.0);
        } else if (act === 'STUMBLE') {
          characterRef.current.updateAnimation(delta, 0, 1.0);
        } else {
          characterRef.current.updateAnimation(delta * 0.8, 0, 1.0);
        }

        if (autoRotate && !isDraggingRef.current) {
          rotationYRef.current += delta * 0.45;
        }
        characterRef.current.group.rotation.y = rotationYRef.current;
      }

      // Smooth Camera Transition for Full vs Face vs Hands zoom
      if (zoomModeRef.current === 'FACE') {
        targetCamPos.set(0, 1.82, 0.88);
        targetCamLook.set(0, 1.76, 0);
      } else if (zoomModeRef.current === 'HANDS') {
        targetCamPos.set(-0.30, 0.98, 0.65);
        targetCamLook.set(-0.25, 0.94, 0);
      } else {
        targetCamPos.set(0, 1.16, 3.4);
        targetCamLook.set(0, 0.96, 0);
      }

      camera.position.lerp(targetCamPos, delta * 5.0);
      currentCamLook.lerp(targetCamLook, delta * 5.0);
      camera.lookAt(currentCamLook);

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Character Customization dynamically whenever props change!
  useEffect(() => {
    if (characterRef.current) {
      characterRef.current.applyCustomization(customization);
    }
  }, [customization]);

  // Handle action triggers with physical jump & slide particle bursts
  const handleSelectAction = (act: CharacterAction) => {
    setSelectedAction(act);
    if (!characterRef.current) return;

    if (act === 'JUMP') {
      characterRef.current.jump();
    } else if (act === 'SLIDE') {
      characterRef.current.slide();
    } else {
      characterRef.current.currentAction = act;
    }
  };

  // Touch / Mouse Drag handlers to rotate character manually
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMouseXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMouseXRef.current;
    prevMouseXRef.current = e.clientX;
    rotationYRef.current += deltaX * 0.015;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      prevMouseXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - prevMouseXRef.current;
    prevMouseXRef.current = e.touches[0].clientX;
    rotationYRef.current += deltaX * 0.015;
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className={`relative bg-gradient-to-b from-slate-900/95 to-slate-950/98 border border-blue-500/30 rounded-2xl overflow-hidden shadow-xl select-none ${className}`}>
      {/* Header Controls Bar */}
      <div className="absolute top-2.5 right-3 left-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <span className="text-[11px] font-bold text-blue-300 bg-blue-950/80 border border-blue-500/40 px-2.5 py-0.5 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            {title}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Zoom Modes: Full, Face, Hands */}
          <div className="flex items-center bg-slate-900/90 border border-slate-700/70 rounded-lg p-0.5 gap-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => setZoomMode('FULL')}
              className={`p-1.5 rounded text-[10px] flex items-center gap-1 transition-all ${
                zoomMode === 'FULL'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض كامل الجسم"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">الجسم</span>
            </button>
            <button
              type="button"
              onClick={() => setZoomMode('FACE')}
              className={`p-1.5 rounded text-[10px] flex items-center gap-1 transition-all ${
                zoomMode === 'FACE'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="تكبير الوجه والملامح العربية"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">الوجه</span>
            </button>
            <button
              type="button"
              onClick={() => setZoomMode('HANDS')}
              className={`p-1.5 rounded text-[10px] flex items-center gap-1 transition-all ${
                zoomMode === 'HANDS'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="تكبير اليد والأصابع الطبيعية"
            >
              <Hand className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">اليد</span>
            </button>
          </div>

          {/* Animation Action Selector Chips */}
          <div className="hidden sm:flex items-center bg-slate-900/90 border border-slate-700/70 rounded-lg p-0.5 gap-0.5">
            {(
              [
                { id: 'IDLE', label: 'وقوف' },
                { id: 'RUN', label: 'ركض' },
                { id: 'FAST_RUN', label: 'ركض فائق' },
                { id: 'JUMP', label: 'قفز وهبوط' },
                { id: 'SLIDE', label: 'تزحلق' },
                { id: 'STUMBLE', label: 'تعثر' },
              ] as const
            ).map((act) => (
              <button
                key={act.id}
                type="button"
                onClick={() => handleSelectAction(act.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                  selectedAction === act.id
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>

          {/* Mobile animation toggle if screen is small */}
          <button
            type="button"
            onClick={() => handleSelectAction(selectedAction === 'RUN' ? 'IDLE' : 'RUN')}
            className={`sm:hidden p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all shadow-sm ${
              selectedAction === 'RUN'
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/60'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
            }`}
            title={selectedAction === 'RUN' ? 'إيقاف حركة الركض' : 'معاينة حركة الركض السريعة'}
          >
            <span className="text-[10px]">{selectedAction === 'RUN' ? 'ركض' : 'وقوف'}</span>
          </button>

          {/* Auto Rotate Toggle */}
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 shadow-sm transition-all text-xs flex items-center gap-1"
            title={autoRotate ? 'إيقاف التدوير التلقائي' : 'تشغيل التدوير التلقائي'}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'text-blue-400 animate-spin-slow' : 'text-slate-400'}`} />
            <span className="text-[10px] hidden sm:inline">{autoRotate ? 'تدوير' : 'ثابت'}</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Mount Point */}
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full ${height} cursor-grab active:cursor-grabbing flex items-center justify-center`}
      />

      {/* Subtle Hint */}
      <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none px-2">
        <span className="text-[10px] text-slate-400 bg-slate-900/85 px-2.5 py-0.5 rounded-full border border-slate-800/80 backdrop-blur-xs">
          اسحب بالماوس أو اللمس لتدوير بسام 360° | شكل رأس طبيعي، عيون لوزية، أنف وفم وشعر وأذن طبيعية، 5 أصابع مفصلية، وحركة ركض بشرية انسيابية
        </span>
      </div>
    </div>
  );
};
