import { Platform, ViewStyle } from 'react-native';

const standardShadow: ViewStyle = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 10,
  borderWidth: 1,
  borderColor: "rgba(0, 0, 0, 0.1)",
  ...Platform.select({
    web: {
      boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
    },
  }),
};

export default standardShadow;
