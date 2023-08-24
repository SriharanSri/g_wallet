import { FunctionComponent } from "react";
import { View } from "react-native";

type Props = {
    height?: number,
    width?: number,
}

export const Spacer:FunctionComponent<Props> = ({height = 10, width = 10}) => <View style={{height, width}}/>