# Ink UI コンポーネントライブラリ使用ガイド

## 概要

Ink UI (`@inkjs/ui`) は、Ink を使用した CLI アプリケーション用のリッチな UI コンポーネントライブラリです。React のパターンを使用して、インタラクティブなコマンドラインインターフェースを構築できます。

## インストール

```bash
npm install @inkjs/ui
```

## 主要コンポーネント

### 1. 入力コンポーネント

#### TextInput - テキスト入力

単一行のテキスト入力コンポーネント。オートコンプリート機能付き。

```tsx
import { TextInput } from '@inkjs/ui';

// 基本的な使用方法
<TextInput 
  placeholder="名前を入力..." 
  onChange={(value) => console.log(value)}
  onSubmit={(value) => console.log('送信:', value)}
/>

// オートコンプリート付き
<TextInput 
  placeholder="国を入力..." 
  suggestions={['日本', '韓国', '中国', '台湾']}
  onChange={setValue}
/>

// 動的な補完候補（関数として渡す）
<TextInput
  placeholder="コマンドを入力..."
  suggestions={(input) => {
    // 入力に基づいて動的に候補を生成
    return commands.filter(cmd => cmd.startsWith(input));
  }}
  onSubmit={handleCommand}
/>

// 無効化制御
<TextInput
  isDisabled={!isActive}
  placeholder="入力待機中..."
  defaultValue="初期値"
  onChange={setValue}
/>
```

**Props:**
- `isDisabled` (boolean): 入力を無効化
- `placeholder` (string): プレースホルダーテキスト
- `defaultValue` (string): 初期値
- `suggestions` (string[]): オートコンプリート候補（大文字小文字を区別）
- `onChange` (function): 値変更時のコールバック
- `onSubmit` (function): Enter キー押下時のコールバック

#### EmailInput - メールアドレス入力

メールアドレス入力専用コンポーネント。@ 入力後に人気のメールドメインを自動補完。

```tsx
import { EmailInput } from '@inkjs/ui';

<EmailInput
  placeholder="メールアドレスを入力..."
  onChange={setEmail}
  onSubmit={handleEmailSubmit}
/>
```

#### PasswordInput - パスワード入力

パスワードやAPIキーなどの機密情報入力用。入力値は自動的にマスクされます。

```tsx
import { PasswordInput } from '@inkjs/ui';

<PasswordInput
  placeholder="パスワード"
  onChange={setPassword}
  onSubmit={handlePasswordSubmit}
/>
```

#### ConfirmInput - 確認入力

Y/n 形式の確認入力コンポーネント。

```tsx
import { ConfirmInput } from '@inkjs/ui';

<ConfirmInput
  message="続行しますか？"
  onConfirm={(answer) => {
    if (answer) {
      // ユーザーが Yes を選択
    }
  }}
/>
```

### 2. 選択コンポーネント

#### Select - 単一選択

スクロール可能なオプションリストから1つを選択。

```tsx
import { Select } from '@inkjs/ui';

<Select
  options={[
    { label: '開発環境', value: 'development' },
    { label: 'ステージング環境', value: 'staging' },
    { label: '本番環境', value: 'production' }
  ]}
  defaultValue="development"
  onChange={(value) => console.log('選択:', value)}
  visibleOptionCount={3}  // 表示するオプション数
  highlightText="環境"    // ハイライトするテキスト
/>
```

**Props:**
- `options` (Array<{label: string, value: string}>): 選択肢
- `defaultValue` (string): 初期選択値
- `isDisabled` (boolean): 選択を無効化
- `visibleOptionCount` (number): 同時に表示するオプション数（デフォルト: 5）
- `highlightText` (string): ラベル内でハイライトするテキスト
- `onChange` (function): 選択変更時のコールバック

#### MultiSelect - 複数選択

複数のオプションを選択可能なコンポーネント。

```tsx
import { MultiSelect } from '@inkjs/ui';

<MultiSelect
  options={[
    { label: 'TypeScript', value: 'ts' },
    { label: 'JavaScript', value: 'js' },
    { label: 'Python', value: 'py' },
    { label: 'Go', value: 'go' }
  ]}
  defaultValue={['ts', 'js']}
  onChange={(values) => console.log('選択中:', values)}
  visibleOptionCount={4}
/>
```

### 3. ステータス・フィードバックコンポーネント

#### Spinner - ローディングインジケーター

処理中を示すスピナー。

```tsx
import { Spinner } from '@inkjs/ui';

<Spinner label="データを読み込み中..." />
```

**Props:**
- `label` (string): スピナーの横に表示するテキスト

#### ProgressBar - プログレスバー

パーセンテージベースの進捗表示。

```tsx
import { ProgressBar } from '@inkjs/ui';

<ProgressBar
  value={65}
  columns={30}  // バーの幅
/>
```

#### Badge - バッジ

ステータス表示用のバッジ。

```tsx
import { Badge } from '@inkjs/ui';

<Badge color="green">成功</Badge>
<Badge color="red">エラー</Badge>
<Badge color="yellow">警告</Badge>
<Badge color="blue">情報</Badge>
```

**Props:**
- `color` ('green' | 'red' | 'yellow' | 'blue'): バッジの色

#### StatusMessage - ステータスメッセージ

詳細なステータス説明を表示。

```tsx
import { StatusMessage } from '@inkjs/ui';

<StatusMessage variant="success">
  ✓ ファイルのアップロードが完了しました
</StatusMessage>

<StatusMessage variant="error">
  ✗ 接続エラーが発生しました
</StatusMessage>

<StatusMessage variant="warning">
  ⚠ メモリ使用量が高くなっています
</StatusMessage>

<StatusMessage variant="info">
  ℹ 新しいアップデートが利用可能です
</StatusMessage>
```

#### Alert - アラート

ユーザーの注意を引く重要なメッセージ表示。

```tsx
import { Alert } from '@inkjs/ui';

<Alert variant="error" title="エラー">
  データベース接続に失敗しました。
  設定を確認してください。
</Alert>

<Alert variant="warning" title="警告">
  このアクションは取り消せません。
</Alert>

<Alert variant="info" title="お知らせ">
  新機能がリリースされました！
</Alert>

<Alert variant="success" title="完了">
  すべてのテストが成功しました。
</Alert>
```

### 4. リストコンポーネント

#### UnorderedList - 番号なしリスト

```tsx
import { UnorderedList } from '@inkjs/ui';

<UnorderedList>
  <UnorderedList.Item>
    <Text>項目 1</Text>
  </UnorderedList.Item>
  <UnorderedList.Item>
    <Text>項目 2</Text>
    <UnorderedList>
      <UnorderedList.Item>
        <Text>サブ項目 2.1</Text>
      </UnorderedList.Item>
    </UnorderedList>
  </UnorderedList.Item>
</UnorderedList>
```

#### OrderedList - 番号付きリスト

```tsx
import { OrderedList } from '@inkjs/ui';

<OrderedList>
  <OrderedList.Item>
    <Text>ステップ 1: 依存関係をインストール</Text>
  </OrderedList.Item>
  <OrderedList.Item>
    <Text>ステップ 2: 設定ファイルを作成</Text>
  </OrderedList.Item>
  <OrderedList.Item>
    <Text>ステップ 3: アプリケーションを起動</Text>
  </OrderedList.Item>
</OrderedList>
```

## テーマシステム

Ink UI はカスタマイズ可能なテーマシステムを提供しています。

### カスタムテーマの作成

```tsx
import { ThemeProvider, extendTheme, defaultTheme } from '@inkjs/ui';

const customTheme = extendTheme(defaultTheme, {
  components: {
    Spinner: {
      styles: {
        frame: () => ({
          color: 'magenta',
        }),
      },
    },
    Badge: {
      styles: {
        root: ({ colorScheme }) => ({
          color: colorScheme === 'green' ? 'greenBright' : undefined,
        }),
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={customTheme}>
      <YourComponents />
    </ThemeProvider>
  );
}
```

### コンポーネント内でのテーマ使用

```tsx
import { useComponentTheme } from '@inkjs/ui';

function CustomComponent() {
  const { theme } = useComponentTheme('CustomComponent');
  
  return (
    <Box {...theme.styles.root()}>
      {/* コンテンツ */}
    </Box>
  );
}
```

## 実践例：インタラクティブなフォーム

```tsx
import React, { useState } from 'react';
import { Box, Text } from 'ink';
import {
  TextInput,
  EmailInput,
  PasswordInput,
  Select,
  MultiSelect,
  Spinner,
  Alert,
  Badge
} from '@inkjs/ui';

function InteractiveForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    environment: '',
    features: []
  });

  if (step === 1) {
    return (
      <Box flexDirection="column">
        <Text>ユーザー名を入力してください:</Text>
        <TextInput
          placeholder="ユーザー名..."
          onSubmit={(value) => {
            setFormData({ ...formData, name: value });
            setStep(2);
          }}
        />
      </Box>
    );
  }

  if (step === 2) {
    return (
      <Box flexDirection="column">
        <Text>メールアドレスを入力してください:</Text>
        <EmailInput
          placeholder="email@example.com"
          onSubmit={(value) => {
            setFormData({ ...formData, email: value });
            setStep(3);
          }}
        />
      </Box>
    );
  }

  if (step === 3) {
    return (
      <Box flexDirection="column">
        <Text>環境を選択してください:</Text>
        <Select
          options={[
            { label: '開発環境', value: 'dev' },
            { label: '本番環境', value: 'prod' }
          ]}
          onChange={(value) => {
            setFormData({ ...formData, environment: value });
            setStep(4);
          }}
        />
      </Box>
    );
  }

  if (step === 4) {
    return (
      <Box flexDirection="column">
        <Text>有効にする機能を選択してください:</Text>
        <MultiSelect
          options={[
            { label: 'ロギング', value: 'logging' },
            { label: 'モニタリング', value: 'monitoring' },
            { label: 'バックアップ', value: 'backup' },
            { label: 'キャッシュ', value: 'cache' }
          ]}
          onChange={(values) => {
            setFormData({ ...formData, features: values });
            setStep(5);
          }}
        />
      </Box>
    );
  }

  if (step === 5) {
    return (
      <Box flexDirection="column">
        <Spinner label="設定を保存中..." />
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Alert variant="success" title="完了">
        設定が正常に保存されました！
      </Alert>
      <Box marginTop={1}>
        <Badge color="green">環境: {formData.environment}</Badge>
      </Box>
    </Box>
  );
}
```

## 注意事項

1. **Uncontrolled Components**: 多くのコンポーネントは uncontrolled で、値の変更は `onChange` コールバックで監視します
2. **テーマのカスタマイズ**: 各コンポーネントのスタイルはテーマで定義されており、`ThemeProvider` を使用してカスタマイズできます
3. **アクセシビリティ**: CLI 環境での制限により、一般的な Web アクセシビリティ機能の一部は利用できません
4. **パフォーマンス**: 大量のオプションを持つ Select/MultiSelect は、適切な `visibleOptionCount` を設定してパフォーマンスを最適化してください

## 参考リンク

- [Ink UI GitHub リポジトリ](https://github.com/vadimdemedes/ink-ui)
- [Ink ドキュメント](https://github.com/vadimdemedes/ink)
- [Create Ink App](https://github.com/vadimdemedes/create-ink-app)