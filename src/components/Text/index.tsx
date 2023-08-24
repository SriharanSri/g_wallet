import React, { FunctionComponent, ReactNode } from "react";
import { StyleProp, StyleSheet, Text as RNText, TextStyle } from "react-native";

type Props = {
  children: ReactNode;
  fontSize?: number;
  fontWeight?: any;
  textAlign?: "left" | "right" | "center";
  variant?: "light" | "medium" | "regular" | "bold";
  ellipsizeMode?: "clip" | "head" | "middle" | "tail"
  opacity?: number;
  numberOfLine?: number;
  letterSpacing?: any;
  color?: string;
  style?: StyleProp<TextStyle>;
  onPress?: any;
};
export const textVariants = {
  light: "HelveticaNeueLTPro-LtEx",
  medium: "HelveticaNeueLTPro-MdEx",
  regular: "HelveticaNeueLTPro-Ex",
  bold: "HelveticaNeueLTPro-MdEx",
};
export const Text: FunctionComponent<Props> = ({
  children,
  fontSize = 14,
  fontWeight,
  textAlign = "left",
  variant = "medium",
  opacity = 1,
  style,
  letterSpacing,
  numberOfLine,
  color = "#fff",
  ellipsizeMode,
  onPress,
}) => {
  return (
    <RNText
      numberOfLines={numberOfLine}
      onPress={onPress}
      ellipsizeMode={"clip"}
      style={[
        {
          ...componentStyles.text,
          fontSize,
          fontWeight,
          textAlign,
          opacity,
          letterSpacing,
          color,
          fontFamily: textVariants[variant],
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
};

const componentStyles = StyleSheet.create({
  text: {
    color: "white",
    fontFamily: "HelveticaNeueLTPro-Ex",
  },
});
