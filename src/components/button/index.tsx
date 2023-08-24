import React from "react";
import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SvgUri } from "react-native-svg";
import { textVariants } from "../Text";

export const buttonVariants = {
  one: ["#3a2660", "#935838", "#cb7525"],
  two: ["#d47822", "#e08028", "#d63e43"],
  three: ["#df8128", "#d63e43", "#cc2751"],
  four: ["#ce2b4f", "#5d14a6"],
  cancel: ["#8E7378", "#8E7378", "#8E7378"],
  red: ["#d63e43", "#ce2b4f"],
  danger: ["#a80e0f", "#c40d0e", "#e10f0f"],
  transparent: ["#00000000", "#00000000", "#00000000"],
};

type Props = {
  title: string;
  onPress?: () => void;
  variant:
    | "one"
    | "two"
    | "three"
    | "four"
    | "cancel"
    | "red"
    | "danger"
    | "transparent";
  icon?: string;
  expanded?: boolean;
  disabled?: boolean;
  styles?: StyleProp<ViewStyle>;
};
export const Button: React.FunctionComponent<Props> = ({
  onPress,
  title,
  variant,
  expanded,
  icon,
  disabled,
  styles,
}) => {
  return (
    <TouchableHighlight
      style={[{ ...componentStyle.button, flex: expanded ? 1 : 0 }, styles]}
      disabled={disabled}
      underlayColor={"#ffffff0"}
      onPress={onPress ? onPress : () => {}}
    >
      <LinearGradient
        start={{ x: 0, y: 0 }}
        style={{
          width: "100%",
          justifyContent: "center",
          flexDirection: "row",
          borderRadius: 35,
        }}
        end={{ x: 1, y: 0 }}
        colors={buttonVariants[variant]}
      >
        <View style={componentStyle.buttonContent}>
          {icon && <SvgUri uri={icon} />}
          <Text style={componentStyle.buttonTitle}>{title}</Text>
        </View>
      </LinearGradient>
    </TouchableHighlight>
  );
};

const componentStyle = StyleSheet.create({
  button: {
    // flex: 1,
    borderRadius: 50,
    textTransform: "lowercase",
    marginHorizontal: 5,
    // height: "120%",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonTitle: {
    color: "white",
    fontSize: 14,
    paddingVertical: 15,
    marginHorizontal: 10,
    textAlign: "center",
    fontFamily: textVariants["medium"],
  },
});
