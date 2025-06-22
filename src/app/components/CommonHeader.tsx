import React from "react";
import { Box, Text } from "ink";
import type { Session } from "../../core/types.ts";
import { formatGold } from "../../core/item-value.ts";

type Props = {
  session: Session;
  currentView: "battle" | "equipment";
  gameSpeed?: 0 | 1 | 3 | 5;
};

export const CommonHeader: React.FC<Props> = ({ session, currentView, gameSpeed = 1 }) => {
  return (
    <Box borderStyle="double" padding={1} marginBottom={1}>
      <Box flexDirection="column" width="100%">
        {/* タイトル行 */}
        <Box justifyContent="space-between">
          <Box>
            <Text bold color="cyan">Hack & Slash</Text>
            <Text> - </Text>
            <Text>{session.player.class} Lv.{session.player.level}</Text>
          </Box>
          <Box>
            <Text color="yellow">[Gold: {formatGold(session.player.gold)}]</Text>
            {gameSpeed !== undefined && (
              <>
                <Text> </Text>
                <Text color={gameSpeed === 0 ? "red" : gameSpeed > 1 ? "green" : "white"}>
                  [Speed: x{gameSpeed}]
                </Text>
              </>
            )}
          </Box>
        </Box>
        
        {/* ナビゲーション */}
        <Box marginTop={1}>
          <Text dimColor>Tab: </Text>
          <Text color={currentView === "battle" ? "cyan" : "gray"} bold={currentView === "battle"}>
            [戦闘詳細]
          </Text>
          <Text dimColor> | </Text>
          <Text color={currentView === "equipment" ? "cyan" : "gray"} bold={currentView === "equipment"}>
            [装備管理]
          </Text>
        </Box>
      </Box>
    </Box>
  );
};