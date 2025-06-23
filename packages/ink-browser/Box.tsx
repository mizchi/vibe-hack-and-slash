import React from 'react';

interface BoxProps {
  children?: React.ReactNode;
  flexDirection?: 'row' | 'column';
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | string;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  width?: number | string;
  height?: number | string;
  minWidth?: number;
  minHeight?: number;
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  borderStyle?: 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic';
  borderColor?: string;
  overflow?: 'visible' | 'hidden';
}

export const Box: React.FC<BoxProps> = ({ children, borderStyle, flexDirection = 'row', marginTop, marginBottom, padding, ...props }) => {
  // スタイルを適用
  const style: React.CSSProperties = {};
  
  if (marginTop) {
    // marginTopの数だけ改行を追加
    const topMargin = '\n'.repeat(marginTop);
    return (
      <>
        <span dangerouslySetInnerHTML={{ __html: topMargin }} />
        <Box {...props} borderStyle={borderStyle} flexDirection={flexDirection} padding={padding}>
          {children}
        </Box>
      </>
    );
  }
  
  if (marginBottom) {
    // marginBottomの数だけ改行を追加
    const bottomMargin = '\n'.repeat(marginBottom);
    return (
      <>
        <Box {...props} borderStyle={borderStyle} flexDirection={flexDirection} padding={padding}>
          {children}
        </Box>
        <span dangerouslySetInnerHTML={{ __html: bottomMargin }} />
      </>
    );
  }
  
  // ボーダーの描画
  if (borderStyle && children) {
    return (
      <div className="ink-box-bordered" data-border-style={borderStyle}>
        {padding ? (
          <div className="ink-box-padding" data-padding={padding}>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    );
  }
  
  // flexDirectionに応じてクラス名を設定
  const className = flexDirection === 'column' ? 'ink-box-column' : 'ink-box-row';
  
  return (
    <div className={className}>
      {children}
    </div>
  );
};