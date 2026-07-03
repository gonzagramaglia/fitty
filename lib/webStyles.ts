import { Platform } from 'react-native';

/**
 * Web-only style to remove focus outlines from TextInput components.
 * Use as: style={webInputStyle}
 */
export const webInputStyle = Platform.OS === 'web'
  ? ({ outlineStyle: 'none' } as Record<string, string>)
  : {};
