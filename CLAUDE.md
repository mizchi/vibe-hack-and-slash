## Project Ideas

- Auto Battle Game Project
  - Using React Ink for terminal-based development
  - Initial design in terminal
  - Plan to extend to GUI later
  - Language: Potentially Japanese-driven project

## Game Design Concepts

- Auto-progressing game with explicit user control to stop/restart
- Monster defeat triggers equipment drops
- Players can choose equipment after each encounter
- Diablo-like loot system with random Prefix/Suffix for items
- Allows building customization through item selection
- Game divided into small sessions
- Partial persistent upgrades between sessions
- Always restart at Lv1 for each new session
- Master game data to be stored in `data/` directory

## 関数型プログラミングガイドライン

### 基本原則

1. **純粋関数の使用**
   - ドメインロジックは副作用のない純粋関数として実装する
   - 同じ入力に対して常に同じ出力を返す
   - 外部の状態を変更しない

2. **不変性**
   - データは不変として扱う
   - 状態の変更は新しいオブジェクトを作成して行う

3. **エラーハンドリング**
   - 例外を投げない
   - Result型でエラーハンドリングを行う
   - 全ての失敗可能な操作はResult<T, E>を返す

### プロジェクト構造

```
src/
├── core/       # 純粋なドメインモデルとビジネスロジック
├── infra/      # 副作用を含むインフラストラクチャ層
└── app/        # アプリケーション層（UIとインフラの統合）
```

### コーディングルール

1. **関数とスコープを使用**（クラスの代わりに）
2. **pipe関数による関数合成**を推奨
3. **ブランド型**を使用してプリミティブ値の型安全性を高める
4. **Railway Oriented Programming**パターンでエラーフローを管理

### 型安全性

- 不正な状態を表現不可能にする型設計
- ブランド型によるIDや値の区別
- 検証関数はResult型を返す

### テスト戦略

- 純粋関数は単体テストで網羅的にテスト
- 副作用を含む関数は統合テストでテスト
- モックの使用を最小限にする

## React Inkガイドライン

### Ctrl-Cハンドリング

React Inkアプリケーションは必ずCtrl-Cで終了できるようにする：

```typescript
import { useApp } from 'ink';

const App = () => {
  const { exit } = useApp();

  useEffect(() => {
    const handleSignal = () => {
      exit();
    };

    process.on('SIGINT', handleSignal);
    process.on('SIGTERM', handleSignal);

    return () => {
      process.off('SIGINT', handleSignal);
      process.off('SIGTERM', handleSignal);
    };
  }, [exit]);

  // アプリケーションロジック
};
```

または、レンダリング時にwaitUntilExitを使用：

```typescript
const { waitUntilExit } = render(<App />);

await waitUntilExit();
process.exit(0);
```