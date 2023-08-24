import { Dimensions, StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
    screen: {
        // flex: 1,
        color: '#fff',
        height: Dimensions.get('window').height,
        paddingBottom: 100,
        width: Dimensions.get('window').width,
        backgroundColor:'#1b0719',
    }
})