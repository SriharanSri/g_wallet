import React from "react";
import { FunctionComponent } from "react";
import { StyleSheet, TextInput as RNTextInput } from "react-native";

type Props = {
  placeholder?: string;
  value?: any;
  onChangeText?: (value: string) => void;
  keyboardtype?: any;
  styles?: any;
};

export const TextInput: FunctionComponent<Props> = ({
  placeholder,
  value,
  onChangeText,
  keyboardtype,
  styles,
}) => {
  return (
    <RNTextInput
      placeholder={placeholder}
      placeholderTextColor={"grey"}
      style={[componentStyles.textInput, styles]}
      keyboardType={keyboardtype}
      value={value}
      onChangeText={onChangeText}
    />
  );
};

const componentStyles = StyleSheet.create({
  textInput: {
    color: "white",
    backgroundColor: "#d4d6db33",
  },
});
