# Moonbit HackNSlash Domain Model

This is a Moonbit implementation of the HackNSlash game domain model that compiles to JavaScript.

## Building

```bash
# Install Moonbit
# https://www.moonbitlang.com/

# Build to JavaScript
moon build --target js

# Output will be in build/hacknslash.js
```

## Usage from JavaScript

```javascript
// Import the compiled module
import * as hacknslash from './build/hacknslash.js';

// Create a new player
const playerJson = hacknslash.create_new_player("Hero", "Warrior");
const player = JSON.parse(playerJson);

// Generate an item
const itemJson = hacknslash.generate_item_for_js("Sword of Truth", 10, "Rare");
const item = JSON.parse(itemJson);

// Calculate damage
const damageJson = hacknslash.calculate_damage_for_js(
  JSON.stringify(player),
  JSON.stringify({ physical: 0.1, arcane: 0, fire: 0, lightning: 0, holy: 0 }),
  "Physical",
  false
);
const damage = JSON.parse(damageJson);
```

## Type Mappings

Moonbit types are mapped to JavaScript as follows:

- `String` → JavaScript string
- `Int` → JavaScript number
- `Double` → JavaScript number
- `Bool` → JavaScript boolean
- `Array[T]` → JavaScript array
- `Map[K,V]` → JavaScript object (when serialized)
- `Option[T]` → `T | null`
- Enums → String representation
- Structs → JavaScript objects (when serialized)

## Available Functions

### Player Management
- `create_new_player(name: String, class: String) -> String` - Creates a new player (returns JSON)
- `calculate_player_stats(player_json: String) -> String` - Calculates total player stats

### Combat
- `calculate_damage_for_js(attacker: String, resistance: String, element: String, is_skill: Bool) -> String` - Calculates damage
- `on_battle_event(event_type: String, data: String) -> String` - Handles battle events

### Items
- `generate_item_for_js(name: String, level: Int, rarity: String) -> String` - Generates a new item
- `get_item_name_js(item: Item) -> String` - Gets display name for an item
- `get_item_stats_js(item: Item) -> Array[String]` - Gets formatted stats for an item

### Session
- `create_session(player_json: String) -> String` - Creates a new game session
- `update_session(session_id: String, action: String) -> String` - Updates session state

### Loot
- `generate_loot_table(tier: String, level: Int) -> String` - Generates loot table for a monster

## Integration with TypeScript

You can create TypeScript definitions for better type safety:

```typescript
// hacknslash.d.ts
declare module './build/hacknslash.js' {
  export function create_new_player(name: string, className: string): string;
  export function calculate_damage_for_js(
    attacker: string,
    resistance: string,
    element: string,
    isSkill: boolean
  ): string;
  export function generate_item_for_js(
    name: string,
    level: number,
    rarity: string
  ): string;
  // ... other functions
}
```

## Development

The source code is organized as follows:

- `types.mbt` - Core type definitions
- `damage.mbt` - Damage calculation logic
- `loot.mbt` - Loot generation system
- `main.mbt` - Main entry point and helper functions
- `js_bindings.mbt` - JavaScript interop functions
- `js_export.mbt` - Export declarations

## Notes

- All data exchange with JavaScript is done through JSON serialization
- The implementation follows the same domain model as the TypeScript version
- Moonbit's type safety is preserved within the module
- Random number generation uses Moonbit's built-in `@random` module