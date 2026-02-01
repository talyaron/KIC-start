import { RARITIES } from '../constants/gameData';

export const getRandomItem = (caseItems, luckBoost = 0) => {
    const roll = Math.random();

    // Rarities ordered from rarest to common
    const raritiesOrder = ['GOLD', 'COVERT', 'CLASSIFIED', 'RESTRICTED', 'MIL_SPEC'];

    let selectedRarityKey = 'MIL_SPEC';
    let cumulativeProbability = 0;

    // Apply luck boost: multiply the base chance of rare items
    // Re-balanced: lower multipliers to prevent "too much luck"
    for (const key of raritiesOrder.slice(0, -1)) {
        let chance = RARITIES[key].chance;
        if (luckBoost > 0 && ['GOLD', 'COVERT', 'CLASSIFIED', 'RESTRICTED'].includes(key)) {
            // Relative boost
            chance *= (1 + luckBoost);
        }

        cumulativeProbability += chance;
        if (roll <= cumulativeProbability) {
            selectedRarityKey = key;
            break;
        }
    }

    // Find items of rolled rarity
    let itemsOfRarity = caseItems.filter(item => item.rarity === selectedRarityKey);

    if (itemsOfRarity.length === 0) {
        // Fallback to any item if the specific rarity is missing in this case
        const fallbackItem = caseItems[Math.floor(Math.random() * caseItems.length)];
        selectedRarityKey = fallbackItem.rarity || 'MIL_SPEC';
        itemsOfRarity = [fallbackItem];
    }

    const selectedItem = itemsOfRarity[Math.floor(Math.random() * itemsOfRarity.length)];
    const rarKey = selectedItem.rarity || selectedRarityKey || 'MIL_SPEC';
    const rarInfo = RARITIES[rarKey] || RARITIES['MIL_SPEC'];

    // Calculate value based on rarity range
    const range = rarInfo.baseValue;
    const value = (Math.random() * (range[1] - range[0]) + range[0]).toFixed(2);

    return {
        ...selectedItem,
        value: parseFloat(value),
        rarityInfo: rarInfo,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
};

export const generateSpinnerItems = (caseItems, luckBoost = 0, count = 100) => {
    // Increased count to 100 for a longer, more dramatic spin
    return Array.from({ length: count }, () => getRandomItem(caseItems, luckBoost));
};
