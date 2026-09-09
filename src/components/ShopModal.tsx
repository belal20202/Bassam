/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayerData, ItemCategory, ShopItem } from '../types';
import { SHOP_ITEMS } from '../data/items';
import { X, ShoppingBag, Check, Sparkles, Shirt, Footprints, Flame, Glasses, Rocket } from 'lucide-react';
import { audioManager } from '../engine/audio';

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

  const isUnlocked = (itemId: string) => {
    return playerData.unlockedItems.includes(itemId);
  };

  const handleBuy = (item: ShopItem) => {
    if (playerData.iqd < item.price) return;
    audioManager.playLevelUp();
    onBuyItem(item);
  };

  const handleEquip = (item: ShopItem) => {
    audioManager.playButtonClick();
    onEquipItem(item.category, item.id);
  };

  return (
    <div id="shop-modal" className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">متجر أزياء وتجهيزات بسام</h2>
              <p className="text-[11px] text-slate-400">تخصيص ملابس وأحذية وتأثيرات الركض</p>
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
        <div className="flex items-center gap-1.5 p-2 bg-slate-950/50 border-b border-slate-800 overflow-x-auto no-scrollbar">
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

        {/* Shop Grid */}
        <div className="p-3 sm:p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 flex-1 custom-scrollbar">
          {filteredItems.map((item) => {
            const unlocked = isUnlocked(item.id) || item.price === 0;
            const equipped = isEquipped(item);
            const canAfford = playerData.iqd >= item.price;

            return (
              <div
                key={item.id}
                className={`bg-slate-800/70 border rounded-xl p-3 flex flex-col justify-between transition-all ${
                  equipped
                    ? 'border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                    : 'border-slate-700/70 hover:border-slate-600'
                }`}
              >
                <div>
                  {/* Top Preview Swatch & Rarity */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-lg shadow-sm border border-slate-600 flex items-center justify-center text-white"
                        style={{ backgroundColor: item.colorHex }}
                      >
                        <Sparkles className="w-3 h-3" />
                      </div>
                      {item.secondaryColorHex && (
                        <div
                          className="w-4 h-4 rounded-md -mr-2.5 shadow-sm border border-slate-600"
                          style={{ backgroundColor: item.secondaryColorHex }}
                        />
                      )}
                    </div>
                    {getRarityBadge(item.rarity)}
                  </div>

                  <h3 className="font-bold text-xs sm:text-sm text-white break-words leading-snug">{item.name}</h3>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed break-words">{item.description}</p>
                  
                  {item.perkDescription && (
                    <div className="mt-2 text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-1 rounded-lg break-words leading-snug flex items-start gap-1">
                      <span className="shrink-0">✨</span>
                      <span className="break-words">{item.perkDescription}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Button */}
                <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                  {equipped ? (
                    <div className="w-full flex items-center justify-center gap-1.5 bg-purple-950/80 border border-purple-500/60 text-purple-300 py-1.5 rounded-lg text-xs font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>مُرتدى</span>
                    </div>
                  ) : unlocked ? (
                    <button
                      onClick={() => handleEquip(item)}
                      className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-1.5 rounded-lg text-xs transition-colors shadow-sm"
                    >
                      ارتداء
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(item)}
                      disabled={!canAfford}
                      className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-bold text-xs transition-all ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 active:scale-95 shadow-sm'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span>شراء</span>
                      <span className="font-mono font-bold text-[11px] whitespace-nowrap">({item.price.toLocaleString('en-US')} د.ع)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
