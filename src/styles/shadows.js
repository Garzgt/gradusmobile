import { Platform } from 'react-native';

const shadow = (elevation = 4, color = '#1a3c5e') => {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: 0.1,
      shadowRadius: elevation,
    };
  }
  return { elevation };
};

const shadows = {
  none: {},
  xs: shadow(2),
  sm: shadow(4),
  md: shadow(6),
  lg: shadow(10),
  xl: shadow(16),
};

export default shadows;
