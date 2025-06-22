// スナップショット機能 - React Inkのレンダリング結果を文字列として取得

import { render } from "ink";
import type { ReactElement } from "react";
import { Writable } from "stream";
import fs from "fs/promises";
import path from "path";

// 仮想的な出力ストリーム
class VirtualOutputStream extends Writable {
  private output: string[] = [];

  _write(chunk: any, encoding: string, callback: () => void): void {
    this.output.push(chunk.toString());
    callback();
  }

  getOutput(): string {
    return this.output.join("");
  }

  clear(): void {
    this.output = [];
  }
}

// スナップショットを取得
export const captureSnapshot = async (
  element: ReactElement,
  duration: number = 100,
): Promise<string> => {
  const virtualStdout = new VirtualOutputStream();

  // React Inkをバーチャル出力にレンダリング
  const { unmount, waitUntilExit } = render(element, {
    stdout: virtualStdout as any, // WriteStreamとして扱う
    stdin: process.stdin,
    debug: false,
    exitOnCtrlC: false,
  });

  // 指定時間待機
  await new Promise((resolve) => setTimeout(resolve, duration));

  // アンマウント
  unmount();

  // 出力を取得
  const output = virtualStdout.getOutput();

  // ANSIエスケープコードを解析して最終的な画面状態を取得
  return parseAnsiOutput(output);
};

// ANSIエスケープコードを解析して最終的な画面状態を取得
const parseAnsiOutput = (output: string): string => {
  // 簡易的な実装：最後の画面クリア以降の内容を取得
  const lines = output.split("\n");
  const cleanLines: string[] = [];

  for (const line of lines) {
    // ANSIエスケープコードを除去（簡易版）
    const cleanLine = line
      .replace(/\x1b\[[0-9;]*m/g, "") // カラーコード
      .replace(/\x1b\[[0-9]*[A-Z]/g, "") // カーソル移動
      .replace(/\x1b\[2K/g, "") // 行クリア
      .replace(/\x1b\[.*?[@-~]/g, ""); // その他のエスケープコード

    if (cleanLine.trim()) {
      cleanLines.push(cleanLine);
    }
  }

  return cleanLines.join("\n");
};

// スナップショットをファイルに保存
export const saveSnapshot = async (
  snapshot: string,
  filename: string = "snapshot",
): Promise<string> => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(process.cwd(), "snapshots");
  const filepath = path.join(dir, `${filename}-${timestamp}.txt`);

  // ディレクトリを作成
  await fs.mkdir(dir, { recursive: true });

  // ファイルに保存
  await fs.writeFile(filepath, snapshot, "utf-8");

  return filepath;
};

// 最新のスナップショットを読み込み
export const loadLatestSnapshot = async (filename: string = "snapshot"): Promise<string | null> => {
  const dir = path.join(process.cwd(), "snapshots");

  try {
    const files = await fs.readdir(dir);
    const snapshotFiles = files
      .filter((f) => f.startsWith(filename) && f.endsWith(".txt"))
      .sort()
      .reverse();

    if (snapshotFiles.length === 0) {
      return null;
    }

    const latestFile = path.join(dir, snapshotFiles[0]);
    return await fs.readFile(latestFile, "utf-8");
  } catch (error) {
    return null;
  }
};