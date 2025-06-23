# Moonbit Integration Guide

This guide describes how to integrate Moonbit-compiled JavaScript with the TypeScript HackNSlash codebase.

## Current Status

### ✅ Completed
1. **Moonbit Domain Model**: Created Moonbit implementation of the core domain types and logic
   - Types defined in `moonbit/src/types.mbt`
   - Damage calculation in `moonbit/src/damage.mbt`
   - Loot generation in `moonbit/src/loot.mbt`
   - JS bindings in `moonbit/src/js_bindings.mbt`

2. **TypeScript Integration Layer**: Created adapter pattern for integration
   - Interface defined in `src/moonbit/interface.ts`
   - Adapter implementation in `src/moonbit/adapter.ts`
   - Integration flag in `src/core/loot.ts`

3. **Build Configuration**: Set up Moonbit build for JS target
   - Build script at `moonbit/build.sh`
   - Configuration in `moonbit/moon.mod.json`

### ✅ Recently Completed
1. **JavaScript Generation**: Successfully configured Moonbit to generate JavaScript
   - Added `moon.pkg.json` with export configuration
   - JavaScript files are generated at `moonbit/target/js/release/build/hacknslash.js`
   - TypeScript declarations are also generated

2. **Module Loading**: Implemented dynamic module loading
   - Updated `adapter.ts` to load the generated Moonbit module
   - Integration flag is now enabled by default
   - Successfully tested connection and basic functionality

## Integration Architecture

```
TypeScript Code
      ↓
  adapter.ts (Adapter Layer)
      ↓
  interface.ts (Type Definitions)
      ↓
  Moonbit JS Module (Generated)
      ↓
  Moonbit Core Logic
```

## How to Enable Integration

1. **Build Moonbit Code**:
   ```bash
   cd moonbit
   ./build.sh
   ```

2. **Enable Integration Flag**:
   ```typescript
   // In src/moonbit/adapter.ts
   export const ENABLE_MOONBIT_INTEGRATION = true;
   ```

3. **Initialize Moonbit**:
   ```typescript
   import { initializeMoonbit } from './moonbit/adapter';
   
   await initializeMoonbit();
   ```

## API Usage

### Item Generation
```typescript
// Uses Moonbit if available, falls back to TypeScript
const item = await generateItem(baseItem, level, rarity);
```

### Damage Calculation
```typescript
import { calculateDamageViaMoonbit } from './moonbit/adapter';

const result = await calculateDamageViaMoonbit(
  attackerJson,
  defenderResistance,
  'Physical',
  false
);
```

## Type Mapping

| TypeScript | Moonbit |
|------------|---------|
| `Item` | `Item` struct with nested records |
| `ItemRarity` | `ItemRarity` enum |
| `Level` | `Level` struct with `value: Int` |
| `ItemId` | `ItemId` struct with `value: String` |

## Known Issues

1. **Random Number Generation**: Moonbit's `@random.Rand` doesn't support seeding in the current API
2. **JSON Serialization**: Manual JSON construction in Moonbit, no built-in JSON library
3. **Item Generation**: Moonbit's `generate_item_for_js` currently returns minimal item data
   - Prefix/suffix generation not fully implemented
   - Item modifiers need proper implementation

## Next Steps

1. ~~Research Moonbit's JavaScript module generation~~ ✅
2. ~~Implement proper module loading in adapter~~ ✅
3. Complete Moonbit implementation
   - Implement full item generation with prefix/suffix
   - Add proper JSON serialization for complex types
   - Implement damage calculation logic
4. Add comprehensive type conversion functions
5. Create more integration tests
6. Performance benchmarking between TypeScript and Moonbit implementations

## References

- [Moonbit Documentation](https://www.moonbitlang.com/)
- [Moonbit GitHub](https://github.com/moonbitlang/moonbit)
- TypeScript Adapter Pattern: `src/moonbit/adapter.ts`