import React from "react";
import { useCameraDevices, Camera } from "react-native-vision-camera";
import { useScanBarcodes, BarcodeFormat } from "vision-camera-code-scanner";
import { RNHoleView } from "react-native-hole-view";
import {
  BackHandler,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../Button";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/AntDesign";
import { useAlert } from "../../hooks/useAlert";

const Scanner = ({ route }) => {
  const { toast } = useAlert();
  const devices = useCameraDevices();
  const device = devices.back;
  const navigation: any = useNavigation();
  const [frameProcessor, barcodes] = useScanBarcodes([
    BarcodeFormat.ALL_FORMATS, // You can only specify a particular format
  ]);

  const [barcode, setBarcode] = React.useState("");
  const [hasPermission, setHasPermission] = React.useState(false);
  const [isScanned, setIsScanned] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === "authorized");
    })();
  }, []);

  React.useEffect(() => {
    toggleActiveState();
    return () => {
      barcodes;
    };
  }, [barcodes]);

  const toggleActiveState = async () => {
    if (barcodes && barcodes.length > 0 && isScanned === false) {
      setIsScanned(true);
      // setBarcode('');
      barcodes.forEach(async (scannedBarcode: any) => {
        if (scannedBarcode.rawValue !== "") {
          console.log("scannedBarcode.rawValue", scannedBarcode.rawValue);
          setBarcode(scannedBarcode.rawValue);
          if (route.params.onData) {
            console.log(route.params, "route");
            route.params.onData(scannedBarcode.rawValue);
            if (navigation.canGoBack() && !route.dontNavigate) {
              navigation.goBack();
            }
            return;
          }
          // Alert.alert(barcode);
          toast({
            position: "bottom",
            type: "success",
            title: `${scannedBarcode?.rawValue}`,
          });
        }
      });
    }
  };
  const handleProceed = () => {
    console.log("in nav", barcode);
    navigation.navigate("Transfer", {
      QrData: barcode,
      name: "",
    });
  };
  return (
    device != null &&
    hasPermission && (
      <>
        <View style={{ flex: 1 }}>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={!isScanned}
            frameProcessor={frameProcessor}
            frameProcessorFps={5}
            audio={false}
          />

          <RNHoleView
            holes={[
              { x: 55, y: 180, width: 300, height: 300, borderRadius: 60 },
            ]}
            style={styles.rnholeView}
          />
          <View
            style={{
              flex: 1.5,
              alignItems: "flex-end",
              justifyContent: "center",
              padding: 10,
              flexDirection: "row",
            }}
          >
            <Text style={styles.closeText}>Scan your address here</Text>
            <TouchableOpacity
              style={{ marginHorizontal: 20 }}
              onPress={() => {
                if (!route.dontNavigate) {
                  navigation.goBack();
                } else {
                  route.goBack();
                }
              }}
            >
              <Icon name="closecircle" size={25} color="grey" />
            </TouchableOpacity>
          </View>
          {!isScanned && (
            <View
              style={{
                // flex: 5,
                alignItems: "center",
                justifyContent: "center",
                padding: 10,
              }}
            >
              <Text style={styles.helperText}>
                Please align the QR within the scanner
              </Text>
            </View>
          )}

          <View
            style={{
              flex: 6,
              // alignItems: "flex-end",
              justifyContent: "flex-end",
              padding: 10,
            }}
          >
            {isScanned && <Text style={styles.scannedText}>{barcode}</Text>}
          </View>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              // width: "70%",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingHorizontal: 70,
              marginBottom: "30%",
              // paddingVertical: 20,
            }}
          >
            {/* <Button
              variant="one"
              title="Back"
              onPress={() => {
                navigation.goBack();
              }}
            /> */}
            <Button
              variant="two"
              title="Proceed"
              disabled={!isScanned}
              styles={{ opacity: isScanned ? 1 : 0.4 }}
              onPress={() => {
                handleProceed();
              }}
            />
          </View>
        </View>
      </>
    )
  );
};
export default Scanner;
// Styles:
const styles = StyleSheet.create({
  rnholeView: {
    flex: 1,
    position: "absolute",
    height: Dimensions.get("window").height,
    width: Dimensions.get("window").width,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  barcodeTextURL: {
    fontSize: 20,
    color: "white",
    fontWeight: "bold",
    marginBottom: 30,
  },
  scannedText: {
    fontWeight: "bold",
    fontSize: 17,
    color: "#FFF",
    textShadowColor: "black",
    textShadowRadius: 1,
    textShadowOffset: {
      width: 2,
      height: 2,
    },
  },
  closeText: {
    fontWeight: "bold",
    fontSize: 20,
    color: "#FFF",
    textShadowColor: "black",
    textShadowRadius: 1,
    textShadowOffset: {
      width: 2,
      height: 2,
    },
  },
  helperText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#B6D0E2",
    // textShadowColor: "#fff",
    // textShadowRadius: 1,
    // textShadowOffset: {
    //   width: 2,
    //   height: 2,
    // },
  },
});
