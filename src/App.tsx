/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GameState, PlayerData, ActivePowerUp, BiomeType, RunStats, SkillId, ShopItem, ItemCategory, GameSettings, WeatherType } from './types';
import { loadPlayerData, savePlayerData, processRunProgression, DEFAULT_PLAYER_DATA } from './storage/storage';
import { GameEngine } from './engine/gameEngine';
import { GameCanvas } from './components/GameCanvas';
import { MainMenu } from './components/MainMenu';
import { InGameHUD } from './components/InGameHUD';
import { GameOverModal } from './components/GameOverModal';
import { SkillsModal } from './components/SkillsModal';
import { MissionsModal } from './components/MissionsModal';
import { AchievementsModal } from './components/AchievementsModal';
import { ShopModal } from './components/ShopModal';
import { SettingsModal } from './components/SettingsModal';
import { PauseModal } from './components/PauseModal';
import { PreGameTutorialModal } from './components/PreGameTutorialModal';
import { CareerStatsModal } from './components/CareerStatsModal';
import { TitlesModal } from './components/TitlesModal';
import { TITLES_LIST } from './data/titles';
import { audioManager } from './engine/audio';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [playerData, setPlayerData] = useState<PlayerData>(() => loadPlayerData());
  const [showPreGameTutorial, setShowPreGameTutorial] = useState<boolean>(false);
  const engineRef = useRef<GameEngine | null>(null);

  const equippedTitle = TITLES_LIST.find((t) => t.id === playerData.activeTitleId) || TITLES_LIST[0];

  // In-Game HUD States
  const [distance, setDistance] = useState<number>(0);
  const [runCoins, setRunCoins] = useState<number>(0);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [currentBiome, setCurrentBiome] = useState<BiomeType>('KARKH_MANSOUR');
  const [currentWeather, setCurrentWeather] = useState<WeatherType>('SUNNY_MORNING');
  const [multiplier, setMultiplier] = useState<number>(1);
  const [latestRunStats, setLatestRunStats] = useState<RunStats | null>(null);

  // Initialize audio volumes from stored settings
  useEffect(() => {
    audioManager.setVolumes(playerData.settings.musicVolume, playerData.settings.sfxVolume);
  }, []);

  // Save changes to localStorage
  const updatePlayer = (updater: (prev: PlayerData) => PlayerData) => {
    setPlayerData((prev) => {
      const next = updater(prev);
      savePlayerData(next);
      return next;
    });
  };

  // ==================== GAMEPLAY ACTIONS ====================
  const handleRequestStartGame = () => {
    // Show quick controls tutorial before every game
    setShowPreGameTutorial(true);
  };

  const handleLaunchGame = (isHeadstart: boolean = false) => {
    setShowPreGameTutorial(false);
    setGameState('PLAYING');
    setDistance(0);
    setRunCoins(0);
    setActivePowerUps([]);
    setMultiplier(1);
    if (engineRef.current) {
      engineRef.current.startRun(isHeadstart);
    }
  };

  const handlePauseGame = () => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
      if (engineRef.current) {
        engineRef.current.pauseRun();
      }
    }
  };

  const handleResumeGame = () => {
    if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      if (engineRef.current) {
        engineRef.current.resumeRun();
      }
    }
  };

  const handleRestartFromPause = () => {
    if (engineRef.current) {
      engineRef.current.stopRun();
    }
    handleLaunchGame();
  };

  const handleReturnHomeFromPause = () => {
    if (engineRef.current) {
      engineRef.current.stopRun();
    }
    setGameState('MENU');
  };

  const handleReturnHomeFromGameOver = () => {
    if (engineRef.current) {
      engineRef.current.stopRun();
    }
    setGameState('MENU');
  };

  const handlePlayAgainFromGameOver = () => {
    if (engineRef.current) {
      engineRef.current.stopRun();
    }
    handleRequestStartGame();
  };

  const handleHUDUpdate = (
    dist: number,
    coins: number,
    powers: ActivePowerUp[],
    biome: BiomeType,
    multi: number,
    weather: WeatherType
  ) => {
    setDistance(dist);
    setRunCoins(coins);
    setActivePowerUps(powers);
    setCurrentBiome(biome);
    setCurrentWeather(weather);
    setMultiplier(multi);
  };

  const handleGameOver = (stats: RunStats) => {
    setLatestRunStats(stats);
    // Process progression and update missions/achievements/XP reliably with latest state
    setPlayerData((prev) => {
      const { updatedPlayer } = processRunProgression(prev, stats);
      savePlayerData(updatedPlayer);
      return updatedPlayer;
    });
    setGameState('GAMEOVER');
  };

  // ==================== SKILLS & UPGRADES ====================
  const handleUpgradeSkill = (skillId: SkillId, cost: number) => {
    updatePlayer((prev) => ({
      ...prev,
      iqd: prev.iqd - cost,
      skills: {
        ...prev.skills,
        [skillId]: (prev.skills[skillId] || 1) + 1,
      },
    }));
  };

  // ==================== MISSIONS & ACHIEVEMENTS & TITLES ====================
  const handleClaimMission = (missionId: string, rewardIQD: number, rewardXP: number) => {
    updatePlayer((prev) => ({
      ...prev,
      iqd: prev.iqd + rewardIQD,
      xp: prev.xp + rewardXP,
      missions: prev.missions.map((m) =>
        m.id === missionId ? { ...m, isClaimed: true } : m
      ),
    }));
  };

  const handleClaimDailyChallenge = (challengeId: string, rewardIQD: number, rewardXP: number) => {
    updatePlayer((prev) => ({
      ...prev,
      iqd: prev.iqd + rewardIQD,
      xp: prev.xp + rewardXP,
      dailyChallenges: (prev.dailyChallenges || []).map((dc) =>
        dc.id === challengeId ? { ...dc, isClaimed: true } : dc
      ),
    }));
  };

  const handleClaimAchievement = (achievementId: string, rewardIQD: number, rewardXP: number) => {
    updatePlayer((prev) => ({
      ...prev,
      iqd: prev.iqd + rewardIQD,
      xp: prev.xp + rewardXP,
      achievements: prev.achievements.map((a) =>
        a.id === achievementId ? { ...a, isClaimed: true } : a
      ),
    }));
  };

  const handleSelectTitle = (titleId: string) => {
    updatePlayer((prev) => ({
      ...prev,
      activeTitleId: titleId,
    }));
  };

  // ==================== SHOP & CUSTOMIZATION ====================
  const handleBuyItem = (item: ShopItem) => {
    updatePlayer((prev) => {
      if (item.category === 'BOOSTER') {
        if (item.id === 'booster_revive_heart') {
          return {
            ...prev,
            iqd: prev.iqd - item.price,
            reviveTokens: prev.reviveTokens + 1,
          };
        }
        return {
          ...prev,
          iqd: prev.iqd - item.price,
        };
      }

      return {
        ...prev,
        iqd: prev.iqd - item.price,
        unlockedItems: [...prev.unlockedItems, item.id],
      };
    });
  };

  const handleEquipItem = (category: ItemCategory, itemId: string) => {
    updatePlayer((prev) => {
      const nextCustom = { ...prev.customization };
      if (category === 'OUTFIT') nextCustom.equippedOutfit = itemId;
      if (category === 'SHOES') nextCustom.equippedShoes = itemId;
      if (category === 'TRAIL') nextCustom.equippedTrail = itemId;
      if (category === 'ACCESSORY') nextCustom.equippedAccessory = itemId;

      if (engineRef.current) {
        engineRef.current.updateCustomization(nextCustom);
      }

      return {
        ...prev,
        customization: nextCustom,
      };
    });
  };

  // ==================== SETTINGS ====================
  const handleUpdateSettings = (newSettings: Partial<GameSettings>) => {
    updatePlayer((prev) => {
      const nextSettings = { ...prev.settings, ...newSettings };
      if (engineRef.current && newSettings.graphicsQuality) {
        engineRef.current.setQuality(newSettings.graphicsQuality);
      }
      return {
        ...prev,
        settings: nextSettings,
      };
    });
  };

  const handleResetProgress = () => {
    setPlayerData({ ...DEFAULT_PLAYER_DATA });
    savePlayerData({ ...DEFAULT_PLAYER_DATA });
    setGameState('MENU');
    if (engineRef.current) {
      engineRef.current.playerData = { ...DEFAULT_PLAYER_DATA };
      engineRef.current.character.applyCustomization(DEFAULT_PLAYER_DATA.customization);
    }
  };

  const handleToggleSound = () => {
    const isCurrentlyMuted = playerData.settings.musicVolume === 0;
    const newVol = isCurrentlyMuted ? 0.7 : 0;
    handleUpdateSettings({ musicVolume: newVol, sfxVolume: newVol });
    audioManager.setVolumes(newVol, newVol);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D WebGL Canvas Layer */}
      <GameCanvas
        gameState={gameState}
        playerData={playerData}
        engineRef={engineRef}
        onHUDUpdate={handleHUDUpdate}
        onGameOver={handleGameOver}
      />

      {/* In-Game Active HUD Layer */}
      {gameState === 'PLAYING' && (
        <InGameHUD
          distance={distance}
          coins={runCoins}
          activePowerUps={activePowerUps}
          biome={currentBiome}
          multiplier={multiplier}
          weather={currentWeather}
          equippedTitle={equippedTitle}
          playerData={playerData}
          onPause={handlePauseGame}
          onClaimDailyChallenge={handleClaimDailyChallenge}
          onClaimMission={handleClaimMission}
        />
      )}

      {/* Main Menu Screen */}
      {gameState === 'MENU' && (
        <MainMenu
          playerData={playerData}
          onNavigate={(state) => setGameState(state)}
          onStartGame={handleRequestStartGame}
        />
      )}

      {/* Pre-Game Controls Tutorial Modal (Shown before every run) */}
      {showPreGameTutorial && (
        <PreGameTutorialModal onStart={() => handleLaunchGame()} />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResumeGame}
          onRestart={handleRestartFromPause}
          onHome={handleReturnHomeFromPause}
          musicVolume={playerData.settings.musicVolume}
          sfxVolume={playerData.settings.sfxVolume}
          onToggleSound={handleToggleSound}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'GAMEOVER' && latestRunStats && (
        <GameOverModal
          runStats={latestRunStats}
          playerData={playerData}
          onPlayAgain={handlePlayAgainFromGameOver}
          onReturnHome={handleReturnHomeFromGameOver}
        />
      )}

      {/* Skills Modal */}
      {gameState === 'SKILLS' && (
        <SkillsModal
          playerData={playerData}
          onClose={() => setGameState('MENU')}
          onUpgradeSkill={handleUpgradeSkill}
        />
      )}

      {/* Missions Modal */}
      {gameState === 'MISSIONS' && (
        <MissionsModal
          playerData={playerData}
          onClose={() => setGameState('MENU')}
          onClaimMission={handleClaimMission}
          onClaimDailyChallenge={handleClaimDailyChallenge}
        />
      )}

      {/* Achievements Modal */}
      {gameState === 'ACHIEVEMENTS' && (
        <AchievementsModal
          playerData={playerData}
          onClose={() => setGameState('MENU')}
          onClaimAchievement={handleClaimAchievement}
        />
      )}

      {/* Career Stats & Performance History Modal */}
      {gameState === 'CAREER_STATS' && (
        <CareerStatsModal
          playerData={playerData}
          onClose={() => setGameState('MENU')}
        />
      )}

      {/* Honorary Titles Modal */}
      {gameState === 'TITLES' && (
        <TitlesModal
          playerData={playerData}
          onClose={() => setGameState('MENU')}
          onSelectTitle={handleSelectTitle}
        />
      )}

      {/* Shop Modal */}
      {gameState === 'SHOP' && (
        <ShopModal
          playerData={playerData}
          onClose={() => setGameState('MENU')}
          onBuyItem={handleBuyItem}
          onEquipItem={handleEquipItem}
        />
      )}

      {/* Settings Modal */}
      {gameState === 'SETTINGS' && (
        <SettingsModal
          settings={playerData.settings}
          onClose={() => setGameState('MENU')}
          onUpdateSettings={handleUpdateSettings}
          onResetProgress={handleResetProgress}
        />
      )}
    </main>
  );
}
