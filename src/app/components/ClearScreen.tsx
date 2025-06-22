import React, { useEffect } from "react";
import { Box, useStdout } from "ink";

type Props = {
  children: React.ReactNode;
};

// 画面をクリアするラッパーコンポーネント
export const ClearScreen: React.FC<Props> = ({ children }) => {
  const { stdout } = useStdout();

  useEffect(() => {
    // コンポーネントマウント時に画面をクリア
    if (stdout) {
      // カーソルを一番上に移動
      stdout.write('\x1b[H');
      // 画面をクリア
      stdout.write('\x1b[2J');
      // カーソルを一番上に移動（再度）
      stdout.write('\x1b[H');
    }
  }, [stdout]);

  return (
    <Box flexDirection="column" width="100%" height={40}>
      {children}
    </Box>
  );
};