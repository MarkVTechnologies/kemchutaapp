// ─────────────────────────────────────────────────────────────────────────────
// DotPattern — subtle SVG dot grid for premium texture in gradient zones
// ─────────────────────────────────────────────────────────────────────────────
import React from "react";
import Svg, { Circle } from "react-native-svg";

interface Props {
  width?: number;
  height?: number;
  color?: string;
  opacity?: number;
  gap?: number;
  radius?: number;
}

export function DotPattern({
  width = 340,
  height = 220,
  color = "#FFFFFF",
  opacity = 0.1,
  gap = 24,
  radius = 1.6,
}: Props) {
  const cols = Math.ceil(width / gap);
  const rows = Math.ceil(height / gap);
  const dots: React.ReactNode[] = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      dots.push(
        <Circle
          key={`${x}-${y}`}
          cx={x * gap + gap / 2}
          cy={y * gap + gap / 2}
          r={radius}
          fill={color}
        />,
      );
    }
  }

  return (
    <Svg width={width} height={height} opacity={opacity}>
      {dots}
    </Svg>
  );
}
