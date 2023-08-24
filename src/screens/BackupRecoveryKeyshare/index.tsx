import React, { useContext } from "react";
import { Alert, Linking, Platform, View } from "react-native";
import { globalStyles } from "../../styles/global.style";
import { Text } from "../../components/Text";
import { AuthHeader } from "../../components/AuthHeader";
import { Spacer } from "../../components/Spacer";
import { downloadFile, updateToCloudStorage } from "../../lib/utils";
import SecureStorage from "react-native-encrypted-storage";
import { GOOGLE_SIGNIN, GOOGLE_SIGNIN_RECOVERY } from "@env";
import {
  writeFile,
  defaultICloudContainerPath,
  PathUtils,
  readFile,
} from "react-native-cloud-store";
import { useAlert } from "../../hooks/useAlert";
import { LoadingIndicatorContext } from "../../App";
import { Button } from "../../components/Button";

export const BackupRecoveryKeyshareScreen = ({ navigation, route }: any) => {
  const { recoveryKey } = route.params;
  const { toast } = useAlert();
  const { setLoading } = useContext(LoadingIndicatorContext);

  const backuphandler = async (type: "CLOUD" | "LOCAL" | "IOS") => {
    if (type === "LOCAL") {
      setLoading(true);
      await downloadFile("wallet_recovery_keyshare", recoveryKey, "txt");
      setLoading(false);
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
      return;
    }
    if (type === "CLOUD") {
      Linking.addEventListener("url", async (event) => {
        if (event.url) {
          const value = event?.url?.replace("guardianwallet:", "");
          const arr = value.split(",").map((x) => x.trim());
          let [_, __, ___, googleToken] = arr;
          console.log("GOOGLE TOKEN  ========> ", googleToken);
          console.log("CLOUD KEYSHARES ====> ", recoveryKey);

          await updateToCloudStorage(
            "wallet_recovery_keyshare.txt",
            recoveryKey,
            googleToken
          );
          navigation.reset({
            index: 0,
            routes: [{ name: "Home" }],
          });
        }
      });
      Linking.openURL(GOOGLE_SIGNIN_RECOVERY);
    }
  };

  const saveToIcloud = async () => {
    const filePathForWrite = PathUtils.join(
      defaultICloudContainerPath,
      "Documents/wallet_recovery_keyshare.txt"
    );
    try {
      await writeFile(filePathForWrite, recoveryKey, {
        override: true,
      });
      toast({
        position: "bottom",
        type: "success",
        title: `Keyshare uploaded to iCloud drive.`,
      });
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={globalStyles.screen}>
      <AuthHeader />
      <Spacer height={20} />
      <Text textAlign="center" fontSize={18}>
        Backup Recovery keyshare
      </Text>
      <Spacer height={20} />
      <Text textAlign="center" fontSize={16} variant="medium">
        Choose backup option from below
      </Text>
      <Spacer height={150} />
      {Platform.OS === "ios" ? (
        <Button
          onPress={() => saveToIcloud()}
          variant="one"
          title="Upload to iCloud"
          styles={{ paddingHorizontal: 30 }}
        />
      ) : (
        <Button
          onPress={() => backuphandler("CLOUD")}
          variant="one"
          title="Upload to Google Drive"
          styles={{ paddingHorizontal: 30 }}
        />
      )}

      <Spacer height={20} />
      <Button
        onPress={() => backuphandler("LOCAL")}
        variant="three"
        title="Download and Keep locally"
        styles={{ paddingHorizontal: 30 }}
      />
    </View>
  );
};
