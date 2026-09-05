/**
 * بسام (Bassam Runner) - Shop Engine
 * Costumes catalog, power-up upgrade purchasing, mystery chest RNG opening.
 */

class ShopManager {
  constructor(game) {
    this.game = game;
  }

  // Buy a costume
  buyOutfit(outfitId) {
    const outfit = CONFIG.CLOTHES.find(c => c.id === outfitId);
    if (!outfit) return { success: false, msg: "الزي غير متوفر" };

    if (SaveManager.data.ownedClothes.includes(outfitId)) {
      return { success: false, msg: "الزي مملوك بالفعل" };
    }

    if (SaveManager.spendCoins(outfit.price)) {
      SaveManager.data.ownedClothes.push(outfitId);
      SaveManager.data.selectedClothes = outfitId;
      SaveManager.save();
      this.game.player.updateEquippedOutfit();
      AudioManager.playPurchase();
      return { success: true, msg: `تهانينا! تم شراء ${outfit.name} وتفعيله` };
    } else {
      return { success: false, msg: "رصيد العملات غير كافٍ!" };
    }
  }

  // Equip an already-owned costume
  equipOutfit(outfitId) {
    if (SaveManager.data.ownedClothes.includes(outfitId)) {
      SaveManager.data.selectedClothes = outfitId;
      SaveManager.save();
      this.game.player.updateEquippedOutfit();
      AudioManager.playClick();
      return true;
    }
    return false;
  }

  // Open a Mystery Chest
  openChest(chestId) {
    const chest = CONFIG.CHESTS.find(c => c.id === chestId);
    if (!chest) return null;

    if (!SaveManager.spendCoins(chest.price)) {
      return { success: false, error: "not_enough_coins" };
    }

    AudioManager.playPurchase();

    // Determine rewards
    const coinReward = Utils.randInt(chest.coinMin, chest.coinMax);
    SaveManager.addCoins(coinReward);

    let unlockedOutfit = null;
    if (Math.random() < chest.outfitChance) {
      // Pick an outfit from the chest pool that player doesn't already own
      const unowned = chest.outfitPool.filter(id => !SaveManager.data.ownedClothes.includes(id));
      if (unowned.length > 0) {
        const pickedId = Utils.randChoice(unowned);
        SaveManager.data.ownedClothes.push(pickedId);
        unlockedOutfit = CONFIG.CLOTHES.find(c => c.id === pickedId);
      }
    }

    SaveManager.save();

    return {
      success: true,
      coins: coinReward,
      outfit: unlockedOutfit,
      chestName: chest.name,
      icon: chest.icon
    };
  }
}
