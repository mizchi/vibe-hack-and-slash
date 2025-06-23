import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import type { 
  PlayerClass, 
  Session, 
  BattleEvent,
  PlayerId,
  SessionId,
  BaseItem,
  ItemId,
  Skill
} from '../core/types';
import { 
  createInitialPlayer, 
  createSession,
  processBattleTurn,
  spawnMonster
} from '../core/session';
import { loadGameData } from './data-loader';
import 'xterm/css/xterm.css';

type ViewType = "ClassSelection" | "Battle" | "GameOver";

// 直接xterm.jsを使用したゲーム実装
const DirectGame: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  
  // ゲームステート
  const [currentView, setCurrentView] = useState<ViewType>("ClassSelection");
  const [selectedClass, setSelectedClass] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [battleLog, setBattleLog] = useState<BattleEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  
  // データのセットアップ
  const baseItems = useRef<Map<ItemId, BaseItem>>(new Map());
  const skills = useRef<Skill[]>([]);
  const [gameData, setGameData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ターミナルの初期化
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cols: 80,
      rows: 30,
      convertEol: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5'
      }
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    setTerminal(term);

    return () => {
      term.dispose();
    };
  }, []);

  // ゲームデータの読み込み
  useEffect(() => {
    loadGameData().then(data => {
      setGameData(data);
      
      // ベースアイテムの読み込み
      data.baseItemsData.items.forEach((item: any) => {
        baseItems.current.set(item.id as ItemId, item as BaseItem);
      });
      
      // スキルの読み込み
      skills.current = data.skillsData.skills as Skill[];
      
      setIsLoading(false);
    }).catch(error => {
      console.error('Failed to load game data:', error);
      setIsLoading(false);
    });
  }, []);

  // クラス選択
  const handleSelectClass = useCallback(() => {
    if (!gameData || isLoading) return;
    
    const classes: PlayerClass[] = ["Warrior", "Mage", "Rogue", "Paladin"];
    const playerClass = classes[selectedClass];
    
    // 初期スキルの設定
    const classSkillIds = (gameData.classSkillsData as any)[playerClass] || [];
    const classSkills = skills.current.filter(skill => 
      classSkillIds.includes(skill.id)
    );
    
    // プレイヤー作成
    const player = createInitialPlayer(
      "player1" as PlayerId,
      playerClass,
      classSkills
    );
    
    // 初期装備の設定
    const starterItems = (gameData.starterEquipmentData as any)[playerClass];
    if (starterItems) {
      Object.entries(starterItems).forEach(([slot, itemId]) => {
        const baseItem = baseItems.current.get(itemId as ItemId);
        if (baseItem) {
          player.equipment.set(slot as any, {
            id: `${itemId}_starter` as ItemId,
            baseItem,
            rarity: "Common",
            level: 1 as any,
          });
        }
      });
    }
    
    // セッション作成
    const newSession = createSession(
      "session1" as SessionId,
      player
    );
    
    // 初期モンスターの生成
    const monster = spawnMonster(
      gameData.monsterTemplatesData.monsters,
      player.level
    );
    newSession.currentMonster = monster;
    
    setSession(newSession);
    setCurrentView("Battle");
  }, [selectedClass, gameData, isLoading]);

  // キー入力の処理
  useEffect(() => {
    if (!terminal) return;

    const handler = terminal.onData((data) => {
      if (currentView === "ClassSelection") {
        if (data === '\x1b[A') { // 上矢印
          setSelectedClass(prev => prev > 0 ? prev - 1 : 3);
        } else if (data === '\x1b[B') { // 下矢印
          setSelectedClass(prev => prev < 3 ? prev + 1 : 0);
        } else if (data === '\r' || data === '\n') { // Enter
          handleSelectClass();
        }
      } else if (currentView === "Battle") {
        if (data === 'p' || data === 'P') {
          setIsPaused(prev => !prev);
        } else if (data === 'q' || data === 'Q') {
          setCurrentView("GameOver");
        }
      }
    });

    return () => {
      handler.dispose();
    };
  }, [terminal, currentView, selectedClass, gameData, isLoading, handleSelectClass]);

  // バトルループ
  useEffect(() => {
    if (!session || isPaused || currentView !== "Battle" || !gameData) return;
    
    const battleTimer = setInterval(async () => {
      const result = await processBattleTurn(
        session,
        baseItems.current,
        gameData.monsterTemplatesData.monsters,
        skills.current,
        turnCount
      );
      
      if (result.ok) {
        const { events, updatedSession } = result.value;
        setSession(updatedSession);
        setBattleLog(prev => [...prev, ...events]);
        setTurnCount(prev => prev + 1);
        
        // ゲームオーバーチェック
        if (updatedSession.player.currentHealth === 0) {
          setCurrentView("GameOver");
        }
      }
    }, 500);
    
    return () => clearInterval(battleTimer);
  }, [session, isPaused, currentView, turnCount, gameData]);

  // 画面の描画
  useEffect(() => {
    if (!terminal) return;

    // requestAnimationFrameを使用して描画を最適化
    const rafId = requestAnimationFrame(() => {
      try {
        terminal.clear();
        terminal.write('\x1b[H'); // カーソルをホームポジションに移動
      } catch (error) {
        console.error('Terminal rendering error:', error);
        return;
      }

    if (isLoading) {
      terminal.writeln('\x1b[33mLoading game data...\x1b[0m');
      return;
    }

    switch (currentView) {
      case "ClassSelection":
        drawClassSelection();
        break;
      case "Battle":
        drawBattle();
        break;
      case "GameOver":
        drawGameOver();
        break;
    }

    function drawClassSelection() {
      const classes: PlayerClass[] = ["Warrior", "Mage", "Rogue", "Paladin"];
      const descriptions = {
        Warrior: "高い体力と防御力を持つ戦士",
        Mage: "強力な魔法と高いマナを持つ魔法使い",
        Rogue: "高いクリティカル率と攻撃速度を持つ盗賊",
        Paladin: "攻撃と防御のバランスが取れた聖騎士",
      };

      const title = 'Hack & Slash - クラス選択';
      const titleLength = Array.from(title).length;
      const boxWidth = 60;
      const paddingLength = Math.max(0, boxWidth - titleLength - 4); // 4 is for "║  " and "  ║"
      
      terminal.writeln('╔' + '═'.repeat(boxWidth) + '╗');
      terminal.writeln('║  \x1b[33m' + title + '\x1b[0m' + ' '.repeat(paddingLength) + '  ║');
      terminal.writeln('╚' + '═'.repeat(boxWidth) + '╝');
      terminal.writeln('');

      classes.forEach((cls, index) => {
        const isSelected = index === selectedClass;
        if (isSelected) {
          terminal.write('\x1b[32m> ');
        } else {
          terminal.write('  ');
        }
        terminal.writeln(`${cls}: ${descriptions[cls]}\x1b[0m`);
      });

      terminal.writeln('');
      terminal.writeln('\x1b[90m↑↓: 選択 | Enter: 決定\x1b[0m');
    }

    function drawBattle() {
      if (!session) return;

      // ヘッダー
      if (isPaused) {
        terminal.writeln('\x1b[33m[一時停止中]\x1b[0m');
      }

      // 文字の視覚的な幅を計算（全角文字は2、半角文字は1）
      function getVisualWidth(str: string): number {
        let width = 0;
        for (const char of str) {
          // 全角文字かどうかを判定（簡易版）
          const code = char.charCodeAt(0);
          if ((code >= 0x3000 && code <= 0x9FFF) || // CJK文字
              (code >= 0xFF00 && code <= 0xFFEF)) {  // 全角記号
            width += 2;
          } else {
            width += 1;
          }
        }
        return width;
      }

      // プレイヤー情報
      const playerLabel = '味方';
      const playerLabelWidth = getVisualWidth(playerLabel);
      const innerWidth = 36;  // ボックス内部の幅
      const totalWidth = innerWidth + 2;  // 左右の罫線分を追加
      const remainingDashes = Math.max(0, totalWidth - playerLabelWidth - 5); // 5 for "┌─ " and " ┐"
      
      // ボックス内の行をパディング
      function padLine(content: string): string {
        // ANSIエスケープシーケンスを除いた実際の文字数を計算
        const cleanContent = content.replace(/\x1b\[[0-9;]*m/g, '');
        const contentWidth = getVisualWidth(cleanContent);
        const padding = Math.max(0, innerWidth - contentWidth);
        return content + ' '.repeat(padding);
      }

      // トップラインの実際の長さを計算
      const topLine = '┌─ ' + playerLabel + ' ' + '─'.repeat(remainingDashes) + '┐';
      const topLineWidth = getVisualWidth(topLine);
      
      terminal.writeln('┌─ \x1b[32m' + playerLabel + '\x1b[0m ' + '─'.repeat(remainingDashes) + '┐');
      terminal.writeln('│ ' + padLine(`${session.player.class} Lv.${session.player.level}`) + ' │');
      
      // HPバー
      const playerHP = session.player.currentHealth;
      const playerMaxHP = session.player.baseStats.maxHealth;
      const playerHPBar = makeHPBar(playerHP, playerMaxHP, 20, '\x1b[32m');
      terminal.writeln('│ ' + padLine(`HP: ${playerHPBar} ${playerHP}/${playerMaxHP}`) + ' │');
      
      // リソース
      const pool = session.player.resourcePool;
      let resourceContent = '';
      if (pool.White > 0) resourceContent += `\x1b[37m○${pool.White}\x1b[0m `;
      if (pool.Red > 0) resourceContent += `\x1b[31m●${pool.Red}\x1b[0m `;
      if (pool.Blue > 0) resourceContent += `\x1b[34m●${pool.Blue}\x1b[0m `;
      if (pool.Green > 0) resourceContent += `\x1b[32m●${pool.Green}\x1b[0m `;
      if (pool.Black > 0) resourceContent += `\x1b[35m●${pool.Black}\x1b[0m`;
      terminal.writeln('│ ' + padLine(resourceContent.trim()) + ' │');
      // ボトムラインを上端と同じ長さにする
      terminal.writeln('└' + '─'.repeat(topLineWidth - 2) + '┘');

      terminal.writeln('');

      // 敵情報
      const enemyLabel = `敵 (Wave ${session.wave})`;
      const enemyLabelWidth = getVisualWidth(enemyLabel);
      const enemyRemainingDashes = Math.max(0, totalWidth - enemyLabelWidth - 5);
      
      // 敵のトップラインの実際の長さを計算
      const enemyTopLine = '┌─ ' + enemyLabel + ' ' + '─'.repeat(enemyRemainingDashes) + '┐';
      const enemyTopLineWidth = getVisualWidth(enemyTopLine);
      
      terminal.writeln('┌─ \x1b[31m' + enemyLabel + '\x1b[0m ' + '─'.repeat(enemyRemainingDashes) + '┐');
      if (session.currentMonster) {
        const monster = session.currentMonster;
        terminal.writeln('│ ' + padLine(`${monster.name} Lv.${monster.level}`) + ' │');
        
        const monsterHP = monster.currentHealth;
        const monsterMaxHP = monster.stats.maxHealth;
        const monsterHPBar = makeHPBar(monsterHP, monsterMaxHP, 20, monsterHP > 0 ? '\x1b[31m' : '\x1b[90m');
        terminal.writeln('│ ' + padLine(`HP: ${monsterHPBar} ${monsterHP}/${monsterMaxHP}`) + ' │');
      } else {
        terminal.writeln('│ ' + padLine('敵がいません') + ' │');
      }
      terminal.writeln('└' + '─'.repeat(enemyTopLineWidth - 2) + '┘');

      terminal.writeln('');

      // 戦闘ログ（最新5件）
      terminal.writeln('【戦闘ログ】');
      const recentLogs = battleLog.slice(-5);
      recentLogs.forEach(event => {
        let text = '';
        let color = '';
        
        switch (event.type) {
          case 'PlayerAttack':
            text = `[攻撃] ${event.damage}ダメージを与えた`;
            color = '\x1b[36m';
            break;
          case 'MonsterAttack':
            text = `[被弾] ${event.damage}ダメージを受けた`;
            color = '\x1b[31m';
            break;
          case 'MonsterDefeated':
            text = `[撃破] ${event.monsterName}を倒した！`;
            color = '\x1b[33m';
            break;
          case 'ItemDropped':
            text = `[入手] ${event.item.baseItem.name}を入手！`;
            color = '\x1b[32m';
            break;
        }
        
        if (text) {
          terminal.writeln(color + text + '\x1b[0m');
        }
      });

      terminal.writeln('');
      terminal.writeln('\x1b[90mP: 一時停止 | Q: 終了\x1b[0m');
    }

    function drawGameOver() {
      const gameOverText = 'GAME OVER';
      const textLength = Array.from(gameOverText).length;
      const boxWidth = 40;
      const paddingLength = Math.max(0, boxWidth - textLength - 4);
      
      terminal.writeln('╔' + '═'.repeat(boxWidth) + '╗');
      terminal.writeln('║  \x1b[31m' + gameOverText + '\x1b[0m' + ' '.repeat(paddingLength) + '  ║');
      terminal.writeln('╚' + '═'.repeat(boxWidth) + '╝');
      terminal.writeln('');
      terminal.writeln(`撃破数: ${session?.defeatedCount || 0}体`);
      terminal.writeln('');
      terminal.writeln('\x1b[90mブラウザをリロードして再スタート\x1b[0m');
    }

    function makeHPBar(current: number, max: number, width: number, color: string): string {
      const ratio = Math.max(0, Math.min(1, current / max)); // 0-1の範囲にクランプ
      const filled = Math.max(0, Math.floor(ratio * width));
      const empty = Math.max(0, width - filled);
      return color + '█'.repeat(filled) + '\x1b[90m' + '░'.repeat(empty) + '\x1b[0m';
    }
    });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [terminal, isLoading, currentView, selectedClass, session, isPaused, battleLog]);

  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: '#1e1e1e' }}>
      <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

// アプリケーションのマウント
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(<DirectGame />);
}