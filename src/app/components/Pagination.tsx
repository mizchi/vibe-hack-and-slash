import React from "react";
import { Box, Text } from "ink";

type Props = {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
};

export const Pagination: React.FC<Props> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  startIndex,
  endIndex,
}) => {
  if (totalPages <= 1) return null;

  // ページインジケーターの生成
  const generatePageIndicators = () => {
    const indicators = [];
    const maxVisiblePages = 5;
    
    let start = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages);
    
    // 開始位置の調整
    if (end - start < maxVisiblePages) {
      start = Math.max(0, end - maxVisiblePages);
    }
    
    // 最初のページ
    if (start > 0) {
      indicators.push(
        <Text key="first" dimColor>1</Text>,
        <Text key="dots-start" dimColor>...</Text>
      );
    }
    
    // ページ番号
    for (let i = start; i < end; i++) {
      indicators.push(
        <Text
          key={i}
          color={i === currentPage ? "cyan" : undefined}
          bold={i === currentPage}
          dimColor={i !== currentPage}
        >
          {i + 1}
        </Text>
      );
    }
    
    // 最後のページ
    if (end < totalPages) {
      indicators.push(
        <Text key="dots-end" dimColor>...</Text>,
        <Text key="last" dimColor>{totalPages}</Text>
      );
    }
    
    return indicators;
  };

  return (
    <Box>
      <Text dimColor>[</Text>
      {generatePageIndicators().map((indicator, index) => (
        <React.Fragment key={`indicator-${index}`}>
          {index > 0 && <Text dimColor> </Text>}
          {indicator}
        </React.Fragment>
      ))}
      <Text dimColor>]</Text>
      <Text dimColor> ({startIndex + 1}-{Math.min(endIndex, totalItems)}/{totalItems})</Text>
    </Box>
  );
};