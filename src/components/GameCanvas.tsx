/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../engine/gameEngine';
import { GameState, PlayerData, ActivePowerUp, BiomeType, RunStats, WeatherType } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  playerData: PlayerData;
  engineRef: React.MutableRefObject<GameEngine | null>;
  onHUDUpdate: (
    distance: number,
    coins: number,
    activePowerUps: ActivePowerUp[],
    biome: BiomeType,
    multiplier: number,
    weather: WeatherType
  ) => void;
  onGameOver: (stats: RunStats) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  playerData,
  engineRef,
  onHUDUpdate,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, playerData, {
      onHUDUpdate,
      onGameOver,
    });
    engineRef.current = engine;

    // Handle container resize
    const handleResize = () => {
      if (canvasRef.current && engineRef.current) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        engineRef.current.resize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stopRun();
    };
  }, []);

  // Update playerData reference in engine when state changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.playerData = playerData;
      engineRef.current.character.applyCustomization(playerData.customization);
    }
  }, [playerData]);

  // Keep engine callbacks synchronized
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setCallbacks({
        onHUDUpdate,
        onGameOver,
      });
    }
  }, [onHUDUpdate, onGameOver]);

  // Pointer event handlers with instantaneous gesture detection
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    isSwipedRef.current = false;
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING' || !touchStartRef.current || !engineRef.current || isSwipedRef.current) return;
    
    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const swipeTriggerDist = 18; // Instantaneous 18px threshold

    if (absX > swipeTriggerDist || absY > swipeTriggerDist) {
      isSwipedRef.current = true;
      if (absX > absY) {
        // Horizontal Swipe: Left swipe -> Go Left, Right swipe -> Go Right
        if (dx < 0) {
          engineRef.current.handleSwipeLeft();
        } else {
          engineRef.current.handleSwipeRight();
        }
      } else {
        // Vertical Swipe: Up swipe -> Jump, Down swipe -> Slide
        if (dy < 0) {
          engineRef.current.handleSwipeUp();
        } else {
          engineRef.current.handleSwipeDown();
        }
      }
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING' || !touchStartRef.current || !engineRef.current) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    // Tap detection if player tapped without swiping
    if (!isSwipedRef.current) {
      const dx = e.clientX - touchStartRef.current.x;
      const dy = e.clientY - touchStartRef.current.y;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      if (Math.abs(dx) < 20 && Math.abs(dy) < 20) {
        // Tap on top 30% of screen -> Jump
        if (e.clientY < screenHeight * 0.3) {
          engineRef.current.handleSwipeUp();
        } 
        // Tap on left half -> move left
        else if (e.clientX < screenWidth * 0.5) {
          engineRef.current.handleSwipeLeft();
        } 
        // Tap on right half -> move right
        else {
          engineRef.current.handleSwipeRight();
        }
      }
    }

    touchStartRef.current = null;
    isSwipedRef.current = false;
  };

  const onPointerCancel = () => {
    touchStartRef.current = null;
    isSwipedRef.current = false;
  };

  // Keyboard Controls (Arrow keys, WASD, Arabic Layout, Space, Numpad)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING' || !engineRef.current) return;

      const code = e.code;
      const key = e.key;

      // MOVE LEFT (Left arrow, A, Q, Arabic 'ش')
      if (
        key === 'ArrowLeft' ||
        code === 'KeyA' ||
        key === 'a' ||
        key === 'A' ||
        key === 'q' ||
        key === 'Q' ||
        key === 'ش' ||
        code === 'Numpad4'
      ) {
        e.preventDefault();
        engineRef.current.handleSwipeLeft();
        return;
      }

      // MOVE RIGHT (Right arrow, D, Arabic 'ي')
      if (
        key === 'ArrowRight' ||
        code === 'KeyD' ||
        key === 'd' ||
        key === 'D' ||
        key === 'ي' ||
        code === 'Numpad6'
      ) {
        e.preventDefault();
        engineRef.current.handleSwipeRight();
        return;
      }

      // JUMP (UP, W, Z, Space, Arabic 'ص')
      if (
        key === 'ArrowUp' ||
        code === 'KeyW' ||
        key === 'w' ||
        key === 'W' ||
        key === 'z' ||
        key === 'Z' ||
        key === ' ' ||
        key === 'ص' ||
        code === 'Numpad8' ||
        code === 'Space'
      ) {
        e.preventDefault();
        engineRef.current.handleSwipeUp();
        return;
      }

      // SLIDE (DOWN, S, Arabic 'س')
      if (
        key === 'ArrowDown' ||
        code === 'KeyS' ||
        key === 's' ||
        key === 'S' ||
        key === 'س' ||
        code === 'Numpad2'
      ) {
        e.preventDefault();
        engineRef.current.handleSwipeDown();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <canvas
      id="bassam-game-canvas"
      ref={canvasRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className="fixed inset-0 w-full h-full object-cover z-0 cursor-grab active:cursor-grabbing touch-none select-none"
    />
  );
};
