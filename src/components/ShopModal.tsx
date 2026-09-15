/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PlayerData, ItemCategory, ShopItem, PlayerCustomization } from '../types';
import { SHOP_ITEMS } from '../data/items';
import { X, ShoppingBag, Check, Sparkles, Shirt, Footprints, Flame, Glasses, Rocket, Eye, RotateCcw } from 'lucide-react';
import { audioManager } from '../engine/audio';
import { CharacterPreview3D } from './CharacterPreview3D';

interface ShopModalProps {
  playerData: PlayerData;
  onClose: () => void;
  onBuyItem: (item: ShopItem) => void;
  onEquipItem: (category: ItemCategory, itemId: string) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  playerData,
  onClose,
  onBuyItem,
  onEquipItem,
}) => {
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('OUTFIT');
  
  // Real-time Character Simulation state: reflects currently previewed or equipped clothing on Bassam
  const [previewCustomization, setPreviewCustomization] = useState<PlayerCustomization>({
    ...playerData.customization,
  });
  const [previewedItem, setPreviewedItem] = useState<ShopItem | null>(null);

  // Synchronize when equipped items change in PlayerData
  useEffect(() => {
    setPreviewCustomization({ ...playerData.customization });
  }, [playerData.customization]);

  const filteredItems = SHOP_ITEMS.filter((item) => item.category === activeCategory);

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'LEGENDARY':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] px-1.5 py-0.5 rounded-md font-bold">أسطوري</span>;
      case 'EPIC':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] px-1.5 py-0.5 rounded-md font-bold">ملحمي</span>;
      case 'RARE':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[9px] px-1.5 py-0.5 rounded-md font-bold">نادر</span>;
      default:
        return <span className="bg-slate-700/50 text-slate-400 text-[9px] px-1.5 py-0.5 rounded-md font-bold">شائع</span>;
    }
  };

  const isEquipped = (item: ShopItem) => {
    switch (item.category) {
      case 'OUTFIT': return playerData.customization.equippedOutfit === item.id;
      case 'SHOES': return playerData.customization.equippedShoes === item.id;
      case 'TRAIL': return playerData.customization.equippedTrail === item.id;
      case 'ACCESSORY': return playerData.customization.equippedAccessory === item.id;
      default: return false;
    }
  };

  const isCurrentlySimulated = (item: ShopItem) => {
    switch (item.category) {
      case 'OUTFIT': return previewCustomization.equippedOutfit === item.id;
      case 'SHOES': return previewCustomization.equippedShoes === item.id;
      case 'TRAIL': return previewCustomization.equippedTrail === item.id;
      case 'ACCESSORY': return previewCustomization.equippedAccessory === item.id;
      default: return false;
    }
  };

  const isUnlocked = (itemId: string) => {
    return playerData.unlockedItems.includes(itemId);
  };

  // Preview / Simulate item directly on the 3D character
  const handlePreview = (item: ShopItem) => {
    audioManager.playButtonClick();
    setPreviewedItem(item);
    setPreviewCustomization((prev) => {
      switch (item.category) {
        case 'OUTFIT':
          return { ...prev, equippedOutfit: item.id };
        case 'SHOES':
          return { ...prev, equippedShoes: item.id };
        case 'TRAIL':
          return { ...prev, equippedTrail: item.id };
        case 'ACCESSORY':
          return { ...prev, equippedAccessory: item.id };
        default:
          return prev;
      }
    });
  };

  const handleResetPreview = () => {
    audioManager.playButtonClick();
    setPreviewedItem(null);
    setPreviewCustomization({ ...playerData.customization });
  };

  const handleBuy = (item: ShopItem) => {
    if (playerData.iqd < item.price) return;
    audioManager.playLevelUp();
    onBuyItem(item);
    // Immediately simulate the purchased clothing on the character
    handlePreview(item);
  };

  const handleEquip = (item: ShopItem) => {
    audioManager.playButtonClick();
    onEquipItem(item.category, item.id);
    handlePreview(item);
  };

  return (
    <div id="shop-modal" className="fixed inset-0 z-30 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">متجر أزياء وتجهيزات بسام</h2>
              <p className="text-[11px] text-slate-400">محاكاة حية للملابس على الشخصية ثلاثية الأبعاد</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Badge */}
            <div className="flex items-center gap-1.5 bg-amber-950/70 border border-amber-500/40 px-2.5 py-1 rounded-xl shadow-inner">
              <div className="w-4 h-4 rounded-full bg-yellow-400 text-slate-950 flex items-center justify-center text-[9px] font-black">
                د.ع
              </div>
              <span className="font-mono font-bold text-yellow-300 text-xs">
                {playerData.iqd.toLocaleString('en-US')}
              </span>
            </div>

            <button
              onClick={() => {
                audioManager.playButtonClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 p-2 bg-slate-950/60 border-b border-slate-800 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => {
              audioManager.playButtonClick();
              setActiveCategory('OUTFIT');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
              activeCategory === 'OUTFIT'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>الملابس</span>
          </button>

          <button
            onClick={() => {
              audioManager.playButtonClick();
              setActiveCategory('SHOES');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
              activeCategory === 'SHOES'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>الأحذية</span>
          </button>

          <button
            onClick={() => {
              audioManager.playButtonClick();
              setActiveCategory('TRAIL');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
              activeCategory === 'TRAIL'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>التأثيرات</span>
          </button>

          <button
            onClick={() => {
              audioManager.playButtonClick();
              setActiveCategory('ACCESSORY');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
              activeCategory === 'ACCESSORY'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Glasses className="w-3.5 h-3.5" />
            <span>الإكسسوارات</span>
          </button>

          <button
            onClick={() => {
              audioManager.playButtonClick();
              setActiveCategory('BOOSTER');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-all ${
              activeCategory === 'BOOSTER'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>القدرات</span>
          </button>
        </div>

        {/* Main Body: 3D Character Simulation Panel + Items Catalog */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* 3D Character Clothes Simulation Column */}
          <div className="w-full md:w-80 lg:w-96 bg-slate-950/70 border-b md:border-b-0 md:border-l border-slate-800 flex flex-col p-3 shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>محاكاة الملابس الحية</span>
              </div>

              {previewedItem && (
                <button
                  onClick={handleResetPreview}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700 transition-colors"
                  title="العودة للمظهر الأصلي"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>المظهر الأصلي</span>
                </button>
              )}
            </div>

            {/* Interactive 3D Model View */}
            <div className="flex-1 min-h-[190px] md:min-h-[260px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative shadow-inner">
              <CharacterPreview3D
                customization={previewCustomization}
                height="h-full w-full min-h-[190px] md:min-h-[260px]"
                title="محاكاة بسام"
              />
            </div>

            {/* Currently Previewed Banner */}
            <div className="mt-2.5 p-2 rounded-lg bg-slate-900/90 border border-slate-700/60 text-center">
              <span className="text-[11px] text-slate-400">
                {previewedItem ? (
                  <>
                    معاينة: <strong className="text-amber-300">{previewedItem.name}</strong>
                  </>
                ) : (
                  'اضغط على أي زي أو حذاء لتجربته على بسام'
                )}
              </span>
            </div>
          </div>

          {/* Shop Items Catalog Grid */}
          <div className="p-3 sm:p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 custom-scrollbar">
            {filteredItems.map((item) => {
              const unlocked = isUnlocked(item.id) || item.price === 0;
              const equipped = isEquipped(item);
              const simulated = isCurrentlySimulated(item);
              const canAfford = playerData.iqd >= item.price;

              return (
                <div
                  key={item.id}
                  onClick={() => handlePreview(item)}
                  className={`bg-slate-800/80 border rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer ${
                    equipped
                      ? 'border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/50'
                      : simulated
                      ? 'border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.25)] ring-1 ring-amber-400/60'
                      : 'border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <div className="space-y-1.5">
                    {/* Top Preview Swatch & Rarity */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg shadow-sm border border-slate-600 flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: item.colorHex }}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        {item.secondaryColorHex && (
                          <div
                            className="w-5 h-5 rounded-md -mr-3 shadow-sm border border-slate-600 shrink-0"
                            style={{ backgroundColor: item.secondaryColorHex }}
                          />
                        )}
                        {simulated && (
                          <span className="flex items-center gap-1 text-[9px] text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                            <Eye className="w-2.5 h-2.5" />
                            <span>معاين على بسام</span>
                          </span>
                        )}
                      </div>
                      {getRarityBadge(item.rarity)}
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-white leading-snug break-words">{item.name}</h3>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed break-words">{item.description}</p>
                    </div>

                    {item.perkDescription && (
                      <div className="text-[10px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 p-1.5 rounded-lg leading-normal flex items-start gap-1.5">
                        <span className="shrink-0 text-xs">✨</span>
                        <span className="break-words">{item.perkDescription}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="mt-3 pt-2.5 border-t border-slate-700/70 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {equipped ? (
                      <div className="w-full flex items-center justify-center gap-1.5 bg-purple-950/80 border border-purple-500/60 text-purple-300 py-1.5 rounded-xl text-xs font-bold shadow-inner">
                        <Check className="w-4 h-4" />
                        <span>مُرتدى حالياً</span>
                      </div>
                    ) : unlocked ? (
                      <button
                        onClick={() => handleEquip(item)}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-1.5 rounded-xl text-xs transition-colors shadow-sm active:scale-98"
                      >
                        ارتداء
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuy(item)}
                        disabled={!canAfford}
                        className={`w-full flex items-center justify-center gap-2 py-1.5 px-2.5 rounded-xl font-bold text-xs transition-all ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 active:scale-98 shadow-md'
                            : 'bg-slate-800/90 text-slate-500 border border-slate-700/80 cursor-not-allowed'
                        }`}
                      >
                        <span>شراء</span>
                        <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-black/20 whitespace-nowrap">
                          {item.price.toLocaleString('en-US')} د.ع
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
