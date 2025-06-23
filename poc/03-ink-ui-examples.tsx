#!/usr/bin/env tsx
import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import {
  TextInput,
  EmailInput,
  PasswordInput,
  Select,
  MultiSelect,
  Spinner,
  ProgressBar,
  Badge,
  StatusMessage,
  Alert,
  UnorderedList,
  OrderedList,
  ThemeProvider,
  extendTheme,
  defaultTheme
} from '@inkjs/ui';

// カスタムテーマの定義
const customTheme = extendTheme(defaultTheme, {
  components: {
    Spinner: {
      styles: {
        frame: () => ({
          color: 'cyan',
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

// プロジェクト設定の型定義
interface ProjectConfig {
  projectName: string;
  projectType: string;
  author: string;
  email: string;
  password: string;
  environment: string;
  features: string[];
  useTypeScript: boolean;
  packageManager: string;
}

// ウィザードのステップ
type WizardStep = 
  | 'welcome'
  | 'projectName'
  | 'projectType'
  | 'author'
  | 'email'
  | 'password'
  | 'environment'
  | 'features'
  | 'typescript'
  | 'packageManager'
  | 'confirm'
  | 'processing'
  | 'complete';

const ProjectSetupWizard: React.FC = () => {
  const { exit } = useApp();
  const [step, setStep] = useState<WizardStep>('welcome');
  const [config, setConfig] = useState<Partial<ProjectConfig>>({});
  const [progress, setProgress] = useState(0);
  
  // Select/MultiSelect用の一時的な選択値
  const [tempProjectType, setTempProjectType] = useState('web');
  const [tempEnvironment, setTempEnvironment] = useState('development');
  const [tempFeatures, setTempFeatures] = useState(['eslint', 'prettier']);
  const [tempPackageManager, setTempPackageManager] = useState('npm');

  // Ctrl-Cハンドリング
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

  // すべてのステップで同じ数のフックを使用
  useInput((input, key) => {
    // MultiSelectのステップではスペースキーを無視
    if (step === 'features' && input === ' ') {
      return;
    }

    if (step === 'welcome') {
      if (input === 'y' || input === 'Y') {
        setStep('projectName');
      }
      if (input === 'n' || input === 'N') {
        exit();
      }
    }
    
    // プロジェクトタイプでEnterキーで確定
    if (step === 'projectType' && key.return) {
      setConfig({ ...config, projectType: tempProjectType });
      setStep('author');
    }
    
    // 環境選択でEnterキーで確定
    if (step === 'environment' && key.return) {
      setConfig({ ...config, environment: tempEnvironment });
      setStep('features');
    }
    
    // 機能選択でEnterキーで確定
    if (step === 'features' && key.return) {
      setConfig({ ...config, features: tempFeatures });
      setStep('typescript');
    }
    
    // パッケージマネージャーでEnterキーで確定
    if (step === 'packageManager' && key.return) {
      setConfig({ ...config, packageManager: tempPackageManager });
      setStep('confirm');
    }
    
    if (step === 'typescript') {
      if (input === 'y' || input === 'Y') {
        setConfig({ ...config, useTypeScript: true });
        setStep('packageManager');
      }
      if (input === 'n' || input === 'N') {
        setConfig({ ...config, useTypeScript: false });
        setStep('packageManager');
      }
    }
    
    if (step === 'confirm') {
      if (input === 'y' || input === 'Y') {
        setStep('processing');
      }
      if (input === 'n' || input === 'N') {
        setStep('projectName');
      }
    }
  });

  // 処理のシミュレーション
  useEffect(() => {
    if (step === 'processing') {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setStep('complete');
            return 100;
          }
          return prev + 10;
        });
      }, 200);
      
      return () => clearInterval(timer);
    }
  }, [step]);

  // ウェルカム画面
  if (step === 'welcome') {
    return (
      <Box flexDirection="column" padding={1}>
        <Alert variant="info" title="プロジェクトセットアップウィザード">
          新しいプロジェクトの設定を行います。
          各ステップで必要な情報を入力してください。
        </Alert>
        
        <Box marginTop={1}>
          <StatusMessage variant="info">
            開始する準備ができました
          </StatusMessage>
        </Box>
        
        <Box marginTop={1}>
          <Text>続行するには <Text bold color="green">y</Text> を、キャンセルするには <Text bold color="red">n</Text> を押してください</Text>
        </Box>
      </Box>
    );
  }

  // プロジェクト名入力
  if (step === 'projectName') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Badge color="blue">ステップ 1/10</Badge>
        </Box>
        
        <Text bold>プロジェクト名を入力してください:</Text>
        
        <Box marginTop={1}>
          <TextInput
            placeholder="my-awesome-project"
            suggestions={['my-app', 'awesome-project', 'hello-world']}
            onSubmit={(value) => {
              setConfig({ ...config, projectName: value });
              setStep('projectType');
            }}
          />
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>ヒント: 英数字とハイフンが使用できます</Text>
        </Box>
      </Box>
    );
  }

  // プロジェクトタイプ選択
  if (step === 'projectType') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Badge color="blue">ステップ 2/10</Badge>
        </Box>
        
        <Text bold>プロジェクトタイプを選択してください:</Text>
        
        <Box marginTop={1}>
          <Select
            options={[
              { label: 'Web アプリケーション', value: 'web' },
              { label: 'CLI ツール', value: 'cli' },
              { label: 'REST API', value: 'api' },
              { label: 'デスクトップアプリ', value: 'desktop' },
              { label: 'モバイルアプリ', value: 'mobile' },
              { label: 'ライブラリ', value: 'library' }
            ]}
            defaultValue={tempProjectType}
            onChange={(value) => {
              setTempProjectType(value);
            }}
            visibleOptionCount={4}
          />
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>↑↓ で選択、Enter で確定</Text>
        </Box>
      </Box>
    );
  }

  // 作者名入力
  if (step === 'author') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Badge color="blue">ステップ 3/10</Badge>
        </Box>
        
        <Text bold>作者名を入力してください:</Text>
        
        <Box marginTop={1}>
          <TextInput
            placeholder="山田太郎"
            onSubmit={(value) => {
              setConfig({ ...config, author: value });
              setStep('email');
            }}
          />
        </Box>
      </Box>
    );
  }

  // メールアドレス入力
  if (step === 'email') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Badge color="blue">ステップ 4/10</Badge>
        </Box>
        
        <Text bold>メールアドレスを入力してください:</Text>
        
        <Box marginTop={1}>
          <EmailInput
            placeholder="you@example.com"
            onSubmit={(value) => {
              setConfig({ ...config, email: value });
              setStep('password');
            }}
          />
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>ヒント: @ を入力すると一般的なドメインが自動補完されます</Text>
          <Text dimColor>（例: @g → @gmail.com, @y → @yahoo.com）</Text>
        </Box>
      </Box>
    );
  }

  // パスワード入力
  if (step === 'password') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Badge color="blue">ステップ 5/10</Badge>
        </Box>
        
        <Text bold>パスワードを設定してください:</Text>
        
        <Box marginTop={1}>
          <PasswordInput
            placeholder="8文字以上"
            onSubmit={(value) => {
              setConfig({ ...config, password: value });
              setStep('environment');
            }}
          />
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>入力内容は * でマスクされます</Text>
        </Box>
      </Box>
    );
  }

  // 環境選択
  if (step === 'environment') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Badge color="blue">ステップ 6/10</Badge>
        </Box>
        
        <Text bold>デフォルトの環境を選択してください:</Text>
        
        <Box marginTop={1}>
          <Select
            options={[
              { label: '開発環境 (development)', value: 'development' },
              { label: 'ステージング環境 (staging)', value: 'staging' },
              { label: '本番環境 (production)', value: 'production' }
            ]}
            defaultValue={tempEnvironment}
            onChange={(value) => {
              setTempEnvironment(value);
            }}
          />
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>↑↓ で選択、Enter で確定</Text>
        </Box>
      </Box>
    );
  }

  // 機能選択（複数選択）
  if (step === 'features') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Badge color="blue">ステップ 7/10</Badge>
        </Box>
        
        <Text bold>有効にする機能を選択してください (複数選択可):</Text>
        
        <Box marginTop={1}>
          <MultiSelect
            options={[
              { label: 'ESLint (コード品質チェック)', value: 'eslint' },
              { label: 'Prettier (コードフォーマット)', value: 'prettier' },
              { label: 'Jest (テストフレームワーク)', value: 'jest' },
              { label: 'GitHub Actions (CI/CD)', value: 'github-actions' },
              { label: 'Docker サポート', value: 'docker' },
              { label: 'Git フック (Husky)', value: 'husky' },
              { label: 'コミット規約 (Commitizen)', value: 'commitizen' }
            ]}
            defaultValue={tempFeatures}
            onChange={(values) => {
              setTempFeatures(values);
            }}
            visibleOptionCount={5}
          />
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>↑↓ で移動、スペースで選択/解除、Enter で確定</Text>
        </Box>
      </Box>
    );
  }

  // TypeScript使用確認
  if (step === 'typescript') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Badge color="blue">ステップ 8/10</Badge>
        </Box>
        
        <Text bold>TypeScript を使用しますか？</Text>
        
        <Box marginTop={1}>
          <Text><Text bold color="green">y</Text> = はい / <Text bold color="red">n</Text> = いいえ</Text>
        </Box>
      </Box>
    );
  }

  // パッケージマネージャー選択
  if (step === 'packageManager') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Badge color="blue">ステップ 9/10</Badge>
        </Box>
        
        <Text bold>パッケージマネージャーを選択してください:</Text>
        
        <Box marginTop={1}>
          <Select
            options={[
              { label: 'npm', value: 'npm' },
              { label: 'yarn', value: 'yarn' },
              { label: 'pnpm', value: 'pnpm' },
              { label: 'bun', value: 'bun' }
            ]}
            defaultValue={tempPackageManager}
            onChange={(value) => {
              setTempPackageManager(value);
            }}
            highlightText="p"
          />
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>↑↓ で選択、Enter で確定</Text>
        </Box>
      </Box>
    );
  }

  // 確認画面
  if (step === 'confirm') {
    const finalConfig = config as ProjectConfig;
    
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1}>
          <Badge color="yellow">ステップ 10/10</Badge>
        </Box>
        
        <Alert variant="warning" title="設定内容の確認">
          以下の内容でプロジェクトを作成します。
        </Alert>
        
        <Box marginTop={1} flexDirection="column">
          <Text bold underline>プロジェクト設定:</Text>
          
          <Box marginTop={1}>
            <UnorderedList>
              <UnorderedList.Item>
                <Text>プロジェクト名: <Text color="green">{finalConfig.projectName}</Text></Text>
              </UnorderedList.Item>
              <UnorderedList.Item>
                <Text>タイプ: <Text color="green">{finalConfig.projectType}</Text></Text>
              </UnorderedList.Item>
              <UnorderedList.Item>
                <Text>作者: <Text color="green">{finalConfig.author}</Text></Text>
              </UnorderedList.Item>
              <UnorderedList.Item>
                <Text>メール: <Text color="green">{finalConfig.email}</Text></Text>
              </UnorderedList.Item>
              <UnorderedList.Item>
                <Text>環境: <Text color="green">{finalConfig.environment}</Text></Text>
              </UnorderedList.Item>
              <UnorderedList.Item>
                <Text>TypeScript: <Text color={finalConfig.useTypeScript ? 'green' : 'red'}>
                  {finalConfig.useTypeScript ? '有効' : '無効'}
                </Text></Text>
              </UnorderedList.Item>
              <UnorderedList.Item>
                <Text>パッケージマネージャー: <Text color="green">{finalConfig.packageManager}</Text></Text>
              </UnorderedList.Item>
            </UnorderedList>
          </Box>
          
          <Box marginTop={1}>
            <Text bold>有効な機能:</Text>
            <Box marginLeft={2}>
              {finalConfig.features.map((feature, index) => (
                <Box key={feature}>
                  <Text>• {feature}</Text>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
        
        <Box marginTop={2}>
          <Text bold>この内容でプロジェクトを作成しますか？</Text>
          <Text><Text bold color="green">y</Text> = 作成する / <Text bold color="red">n</Text> = キャンセル</Text>
        </Box>
      </Box>
    );
  }

  // 処理中画面
  if (step === 'processing') {
    return (
      <Box flexDirection="column" padding={1}>
        <Spinner label="プロジェクトを作成中..." />
        
        <Box marginTop={1}>
          <ProgressBar value={progress} columns={40} />
        </Box>
        
        <Box marginTop={1}>
          <Text dimColor>進捗: {progress}%</Text>
        </Box>
        
        <Box marginTop={2} flexDirection="column">
          <OrderedList>
            <OrderedList.Item>
              <Text dimColor={progress < 30}>ディレクトリ構造を作成</Text>
            </OrderedList.Item>
            <OrderedList.Item>
              <Text dimColor={progress < 50}>設定ファイルを生成</Text>
            </OrderedList.Item>
            <OrderedList.Item>
              <Text dimColor={progress < 70}>依存関係をインストール</Text>
            </OrderedList.Item>
            <OrderedList.Item>
              <Text dimColor={progress < 90}>初期コミットを作成</Text>
            </OrderedList.Item>
          </OrderedList>
        </Box>
      </Box>
    );
  }

  // 完了画面
  if (step === 'complete') {
    const finalConfig = config as ProjectConfig;
    
    return (
      <Box flexDirection="column" padding={1}>
        <Alert variant="success" title="セットアップ完了！">
          プロジェクト「{finalConfig.projectName}」が正常に作成されました。
        </Alert>
        
        <Box marginTop={2} flexDirection="column">
          <StatusMessage variant="success">
            ✓ すべての設定が正常に適用されました
          </StatusMessage>
        </Box>
        
        <Box marginTop={2}>
          <Text bold>次のステップ:</Text>
          <Box marginTop={1}>
            <OrderedList>
              <OrderedList.Item>
                <Text>cd {finalConfig.projectName}</Text>
              </OrderedList.Item>
              <OrderedList.Item>
                <Text>{finalConfig.packageManager} run dev</Text>
              </OrderedList.Item>
            </OrderedList>
          </Box>
        </Box>
        
        <Box marginTop={2} gap={1}>
          <Badge color="green">準備完了</Badge>
          <Badge color="blue">{finalConfig.projectType}</Badge>
          {finalConfig.useTypeScript && <Badge color="yellow">TypeScript</Badge>}
        </Box>
        
        <Box marginTop={2}>
          <Text dimColor>Ctrl+C で終了</Text>
        </Box>
      </Box>
    );
  }

  return null;
};

// メインアプリケーション
const App: React.FC = () => {
  return (
    <ThemeProvider theme={customTheme}>
      <ProjectSetupWizard />
    </ThemeProvider>
  );
};

// アプリケーションの起動
const main = async () => {
  // Check if we're in a proper TTY environment
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error('This application requires an interactive terminal (TTY).');
    console.error('It cannot run in non-interactive environments like CI/CD pipelines.');
    console.error('\nTo use this wizard:');
    console.error('1. Run in a proper terminal (not in CI/CD)');
    console.error('2. Use arrow keys to select options');
    console.error('3. Press Enter to confirm selections');
    console.error('4. For EmailInput, type @ to see domain suggestions');
    process.exit(1);
  }

  const { waitUntilExit } = render(<App />);
  
  try {
    await waitUntilExit();
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
};

main();