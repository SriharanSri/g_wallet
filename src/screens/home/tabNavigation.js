import React, { PureComponent } from "react";
import {
  View,
  Animated,
  TouchableOpacity,
  Dimensions,
  Text,
  StyleSheet,
} from "react-native";
import { textVariants } from "../../components/Text";

const COLORS = {
  backgroundColor: "#d4d6db33",
  shadowColor: "#E8E8E8",
  backgroundColorItem: "#ffdcdc47",
  colorText: "#fff",
};

const { width } = Dimensions.get("window");
export default class TabSelectorAnimation extends PureComponent {
  state = {
    active: 0,
    xTabOne: 0,
    xTabTwo: 0,
    translateX: new Animated.Value(0),
    translateXTabOne: new Animated.Value(0),
    translateXTabTwo: new Animated.Value(width),
    translateY: -1000,
  };

  handleSlide = (type, index) => {
    const { onChangeTab } = this.props;
    const { active, translateX, translateXTabOne, translateXTabTwo } =
      this.state;
    if (onChangeTab) onChangeTab(index);
    Animated.timing(translateX, {
      toValue: this.state[type] || 0,
      delay: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    if (active === 0) {
      Animated.parallel([
        Animated.spring(translateXTabOne, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }).start(),
        Animated.spring(translateXTabTwo, {
          toValue: width,
          duration: 100,
          useNativeDriver: false,
        }).start(),
      ]);
    } else {
      Animated.parallel([
        Animated.spring(translateXTabOne, {
          toValue: -width,
          useNativeDriver: false,
          duration: 100,
        }).start(),
        Animated.spring(translateXTabTwo, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }).start(),
      ]);
    }
  };

  render() {
    const {
      tabs = [],
      style,
      styleTitle,
      backgroundColor,
      styleTab,
    } = this.props;
    const { translateX } = this.state;
    return (
      <View
        style={[
          styles.container,
          style,
          {
            backgroundColor: backgroundColor || COLORS.backgroundColor,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.animatedView,
            {
              width: `${97 / tabs.length}%`,
              transform: [
                {
                  translateX,
                },
              ],
            },
          ]}
        />
        {tabs.map((item, index) => (
          <TouchableOpacity
            key={item.title}
            style={[styles.tab, styleTab]}
            onLayout={(event) =>
              this.setState({
                [`xTab${index}`]: event.nativeEvent.layout.x,
              })
            }
            onPress={() =>
              this.setState({ active: index }, () =>
                this.handleSlide(`xTab${index}`, index)
              )
            }
          >
            <Text style={[styles.textTitle, styleTitle]}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    height: 40,
  },
  tab: {
    flex: 1,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  textTitle: {
    fontFamily: textVariants["medium"],
    fontSize: 12,
    color: COLORS.colorText,
  },
  animatedView: {
    position: "absolute",
    height: 45,
    width: "100%",
    top: 0,
    height: 40.5,
    top: 2,
    left: 0,
    right: 0,
    marginHorizontal: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowColor: "#d4d6db33",
    shadowRadius: 3,
    shadowOpacity: 1,
    backgroundColor: COLORS.backgroundColorItem,
    borderRadius: 30,
  },
});

// module.exports = TabSelectorAnimation
// module.exports.default = TabSelectorAnimation
