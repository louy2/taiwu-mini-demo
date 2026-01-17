# Design Document - Wuxia Game

## Game Concepts

### Character Attributes
*   **True Qi (Qi/真气)**: The core energy source. Max 280.
*   **Neili Type (内力属性)**: Determines stat growth per Zhenqi.
    *   **Bonuses per Point (Power/Parry, Pen/Res, QiBreach/Guard)**:
        *   **金刚 (Vajra)**: [10, 16, 4]
        *   **紫霞 (Purple Mist)**: [4, 6, 14]
        *   **玄阴 (Dark Yin)**: [4, 4, 16]
        *   **纯阳 (Pure Yang)**: [6, 10, 10]
        *   **归元 (Return Origin)**: [6, 14, 6]
        *   **混元 (Chaos Origin)**: [6, 10, 10]
*   **Base Stats**: 50-60 random initial.
*   **Effective Stats**: Base + (Allocated Qi * Multiplier).

### KungFu System (功法)
*   **Internal KungFu (内功)**:
    *   Provides passive bonuses (via Neili Type multipliers).
    *   Provides slots for Destruction/Protection skills.
    *   **Multiple Internal Logic**:
        *   Can equip up to **3** Internal KungFu simultaneously.
        *   **Slots Stack**: The Destruction/Protection slots from all equipped internals are summed up.
        *   **Active/Meditation Internal**: One equipped internal is designated as "Active". This determines the Neili Type used for stat calculation and "Month Flow" events.
        *   **Unique**: Cannot equip duplicate KungFu (by name/ID).
*   **Destruction (摧破)**: Active combat skills (consume Shi).
*   **Protection (护体)**: Defensive skills (consume TiQi).
*   **Inventory**: Duplicates are handled by an internal counter (Level +1), not new slots.

### Equipment System (装备)
*   **Types**: Weapon (Weapons), Armor (Armor).
*   **Stats**: Provide flat bonuses to stats (Power, Parry, etc.).
*   **Inventory**: Stored in 'Bag'. Duplicates increase item count.

### Combat Mechanics
*   **Turn-based**: Rounds of approx 1s.
*   **Resources**:
    *   **Shi (势)**: Gained **only** on Normal Attack Hit. Consumed by Destruction skills.
    *   **TiQi (提气)**: Regenerates 1200/s. Max 30000. Consumed by Protection skills.
*   **Hit Rate**:
    *   If Attacker Power > Defender Parry: `Rate = Power / Parry`
    *   Else: `Rate = (Power / Parry) / 2`
    *   *Note*: Displayed Hit Rate can exceed 100%.
*   **Damage**:
    *   `Total = External + Internal`
    *   `External = Base * ExtRatio * (Pen/Res) * Decay(Pen/Res)`
    *   `Internal = Base * IntRatio * (QiBreach/QiGuard) * Decay(QiBreach/QiGuard)`
    *   `Decay(ratio) = 12.51 / (12.51 + ratio)`
*   **Injury**: 1 Mark per 200 Damage. 12 Marks = Defeat.
*   **Logs**:
    *   Skills display their specific name (e.g., "Use [Taizu Long Fist]").
    *   Normal attacks use simplified format (e.g., "Attack Enemy's Chest").

### Estate
*   **Market**: Produces Money (MarketLevel * 100).
*   **Ancestral Hall**: Produces Prestige (HallLevel * 10).
*   **Meditation (Month Flow)**: Triggers production and Qi growth.

### New Player Experience
*   **Welcome Gift**: New saves (or first load) receive 1000 Money and 1000 Prestige.
