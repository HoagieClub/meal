// components/CustomIcon.tsx
import React from 'react';

interface CustomIconProps {
  src: string;
  alt?: string;
  size?: number;
  style?: React.CSSProperties;
}

const CustomIcon: React.FC<CustomIconProps> = ({ src, alt = '', size = 20, style }) => (
  <img
    src={src}
    alt={alt}
    style={{
      width: size,
      height: size,
      flexShrink: 0,
      ...style,
    }}
  />
);

export default CustomIcon;
