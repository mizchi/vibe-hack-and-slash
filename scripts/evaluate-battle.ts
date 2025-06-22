#!/usr/bin/env tsx
import { query, type SDKMessage } from "@anthropic-ai/claude-code";
import { execSync } from "child_process";
import fs from "fs/promises";
import path from "path";

// 評価プロンプト
const EVALUATION_PROMPT = `
あなたはゲームデザインの専門家です。以下のハックアンドスラッシュゲームの分析レポートを読んで、プレイヤーの視点からゲームの面白さをヒューリスティックに評価してください。

評価の観点：
1. **戦闘の緊張感**: プレイヤーが常に集中を要求されるか、退屈しないか
2. **成長の実感**: 装備やレベルアップによる明確な強化を感じられるか
3. **戦略性**: スキル選択や装備選択に意味があるか
4. **リプレイ性**: 異なるビルドで再プレイしたくなるか
5. **バランス**: 難しすぎず、簡単すぎない適切な難易度か

以下の形式で評価を出力してください：

## 総合評価
[S/A/B/C/Dの5段階評価と理由]

## 良い点
- [箇条書きで3-5個]

## 改善点
- [箇条書きで3-5個]

## プレイヤー体験の予測
[100-200字程度でプレイヤーがどのような体験をするか]

## 具体的な改善提案
[実装可能な具体的な改善案を3つ]

---
以下が分析レポートです：
`;

// 評価実行関数
async function evaluateBattle() {
  console.log("🎮 ゲーム評価を開始します...");
  
  try {
    // 評価レポートを生成
    console.log("📊 分析レポートを生成中...");
    const reportOutput = execSync("npm run evaluate", { 
      encoding: "utf-8",
      maxBuffer: 1024 * 1024 * 10 // 10MB
    });
    
    // レポートをファイルに保存
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportPath = path.join("reports", `evaluation-${timestamp}.txt`);
    await fs.mkdir("reports", { recursive: true });
    await fs.writeFile(reportPath, reportOutput);
    console.log(`📄 レポートを保存しました: ${reportPath}`);
    
    // Claude に評価を依頼
    console.log("\n🤖 Claude による評価を開始...");
    const messages: SDKMessage[] = [];
    const controller = new AbortController();
    
    // タイムアウト設定（5分）
    const timeout = setTimeout(() => {
      controller.abort();
    }, 5 * 60 * 1000);
    
    try {
      for await (const message of query({
        prompt: EVALUATION_PROMPT + reportOutput,
        abortController: controller,
        options: {
          maxTurns: 1,
        },
      })) {
        messages.push(message);
        
        // テキストメッセージを表示
        if (message.type === "text") {
          console.log("\n" + message.text);
        }
      }
    } finally {
      clearTimeout(timeout);
    }
    
    // 評価結果を保存
    const evaluationPath = path.join("reports", `ai-evaluation-${timestamp}.md`);
    const evaluationContent = messages
      .filter(m => m.type === "text")
      .map(m => m.text)
      .join("\n");
    
    await fs.writeFile(evaluationPath, evaluationContent);
    console.log(`\n💾 AI評価を保存しました: ${evaluationPath}`);
    
    // 要約を表示
    console.log("\n📋 評価サマリー:");
    console.log("=".repeat(50));
    
    // 総合評価を抽出
    const gradeMatch = evaluationContent.match(/## 総合評価\s*\n\[([S|A|B|C|D])/);
    if (gradeMatch) {
      console.log(`総合評価: ${gradeMatch[1]}ランク`);
    }
    
    // 改善提案の数を数える
    const improvementCount = (evaluationContent.match(/## 具体的な改善提案/g) || []).length;
    console.log(`改善提案: ${improvementCount}個`);
    
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    
    if (error.message?.includes("ANTHROPIC_API_KEY")) {
      console.error("\n⚠️  ANTHROPIC_API_KEY 環境変数が設定されていません。");
      console.error("以下のコマンドで設定してください:");
      console.error("export ANTHROPIC_API_KEY='your-api-key-here'");
    }
    
    process.exit(1);
  }
}

// スタンドアロン評価関数（レポートファイルから読み込む）
async function evaluateFromFile(reportPath: string) {
  console.log(`📄 レポートファイルを読み込み中: ${reportPath}`);
  
  try {
    const reportContent = await fs.readFile(reportPath, "utf-8");
    
    console.log("\n🤖 Claude による評価を開始...");
    const messages: SDKMessage[] = [];
    const controller = new AbortController();
    
    for await (const message of query({
      prompt: EVALUATION_PROMPT + reportContent,
      abortController: controller,
      options: {
        maxTurns: 1,
      },
    })) {
      messages.push(message);
      
      if (message.type === "text") {
        console.log("\n" + message.text);
      }
    }
    
    // 評価結果を保存
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const evaluationPath = path.join("reports", `ai-evaluation-${timestamp}.md`);
    const evaluationContent = messages
      .filter(m => m.type === "text")
      .map(m => m.text)
      .join("\n");
    
    await fs.writeFile(evaluationPath, evaluationContent);
    console.log(`\n💾 AI評価を保存しました: ${evaluationPath}`);
    
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    process.exit(1);
  }
}

// メイン実行
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0] === "--file" && args[1]) {
    // ファイルから評価
    await evaluateFromFile(args[1]);
  } else {
    // 新規に評価を実行
    await evaluateBattle();
  }
}

// 環境変数チェック
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("❌ ANTHROPIC_API_KEY 環境変数が設定されていません。");
  console.error("\n以下のコマンドで設定してください:");
  console.error("export ANTHROPIC_API_KEY='your-api-key-here'");
  console.error("\nAPIキーは https://console.anthropic.com/ で取得できます。");
  process.exit(1);
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}