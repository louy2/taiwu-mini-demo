# Design Document - Wuxia Game

## Game Concepts

### Character Attributes
*   **True Qi (Qi/真气)**: The core energy source. Max 280.
*   **Neili Type (内力属性)**: Determines stat growth per Zhenqi. Types: 'Hunyuan', 'Vajra', 'PureYang', etc.
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

### Combat Mechanics
*   **Turn-based**: Rounds of approx 1s.
*   **Resources**:
    *   **Shi (势)**: Gained on hit. Consumed by Destruction skills.
    *   **TiQi (提气)**: Regenerates 1200/s. Max 30000. Consumed by Protection skills.
*   **Hit Rate**:
    *   If Attacker Power > Defender Parry: `Rate = Power / Parry`
    *   Else: `Rate = (Power / Parry) / 2`
*   **Damage**:
    *   `Total = External + Internal`
    *   `External = Base * ExtRatio * (Pen/Res) * Decay(Pen/Res)`
    *   `Internal = Base * IntRatio * (QiBreach/QiGuard) * Decay(QiBreach/QiGuard)`
    *   `Decay(ratio) = 12.51 / (12.51 + ratio)`
*   **Injury**: 1 Mark per 200 Damage. 12 Marks = Defeat.

### Estate
*   **Market**: Produces Money (MarketLevel * 100).
*   **Ancestral Hall**: Produces Prestige (HallLevel * 10).
*   **Meditation (Month Flow)**: Triggers production and Qi growth.
