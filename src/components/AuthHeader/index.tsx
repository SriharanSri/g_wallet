import React from "react";
import { FunctionComponent } from "react";
import { StyleSheet, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { SvgUri, SvgXml } from "react-native-svg";
import { Text } from "../Text";
import Logo from "../../../assets/vector/logo.svg";

type Props = {
  onBackPress?: () => void;
  showBack?: boolean;
};

export const AuthHeader: FunctionComponent<Props> = ({
  onBackPress,
  showBack = false,
}) => {
  return (
    <View style={componentStyle.header}>
      {showBack && (
        <TouchableOpacity onPress={onBackPress ?? undefined}>
          <SvgUri
            width={20}
            height={20}
            uri="https://walletalpha.guardianlink.io/back.svg"
          />
        </TouchableOpacity>
      )}
      <View style={componentStyle.logo}>
        {/* <SvgUri
          width={200}
          height={50}
          uri="https://walletalpha.guardianlink.io/guardian_wallet.svg"
        /> */}
        <SvgXml xml={Logo} width={200} height={50} />
      </View>

      {showBack && (
        <SvgUri
          style={componentStyle.hide}
          width={20}
          height={20}
          uri="https://walletalpha.guardianlink.io/back.svg"
        />
      )}
    </View>
  );
};

const componentStyle = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    justifyContent: "space-between",
    marginHorizontal: 15,
  },
  hide: {
    opacity: 0,
  },
  body: {
    marginTop: 50,
  },
  logo: {
    alignItems: "center",
    flex: 1,
  },
});
