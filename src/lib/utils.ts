import moment from "moment";
import { Platform } from "react-native";
import RNFS from "react-native-fs";
import { useAlert } from "../hooks/useAlert";
import axios from "axios";
import {
  writeFile,
  defaultICloudContainerPath,
  PathUtils,
  readFile,
} from "react-native-cloud-store";

export const downloadFile = async (
  name: string,
  content: string,
  type: string
) => {
  const { toast } = useAlert();
  let fileName = `/${name + moment().format("YYYYMMDDHHmmss")}.${type}`;
  let iosPath = RNFS.DocumentDirectoryPath + fileName;
  let androidPath = RNFS.DownloadDirectoryPath + fileName;
  await RNFS.writeFile(
    Platform.OS === "ios" ? iosPath : androidPath,
    content,
    "utf8"
  )
    .then((success) => {
      console.log("FILE WRITTEN!");
      toast({
        position: "bottom",
        type: "success",
        title: `${name} file saved in ${
          Platform.OS === "ios" ? "documents" : "downloads"
        }`,
      });
    })
    .catch((err) => {
      console.log(err.message);
    });
};
export const updateToCloudStorage = async (
  name: string,
  content: string,
  token?: string
) => {
  const { toast } = useAlert();

  if (Platform.OS === "android") {
    try {
      console.log("uploadUrl");
      const response = await axios.post(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
        {
          name: name,
          parents: "/",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const uploadUrl = response.headers["location"];
      console.log(uploadUrl);

      const uploadResponse = await axios.put(uploadUrl, content, {
        headers: {
          Authorization:
            "Bearer ya29.a0AWY7Ckl0LngwOnM0atJ4yzG3ftwJVLBlhUzvPg2EIt7h4ysdl1ANZCjg--nJ5oo6opW9eQVKkJRceQMbeZlCmxmEtX87ixdwdCFrstEdP4ukWNMbtZwEmrZ_LaB1tyx4s1BtCXmzNn_j0-7VizW86MrJ6UsQVgaCgYKAToSARASFQG1tDrpIAulWrDccnibkxfUfafImA0165",
        },
      });
      console.log("uploaded response =======> ", uploadResponse);
      toast({
        position: "bottom",
        type: "success",
        title: `Recovery keyshare uploaded to the google drive.`,
      });
    } catch (error) {
      console.log(error);
    }
  }
  if (Platform.OS === "ios") {
    const filePathForWrite = PathUtils.join(
      "Documents/Guardian Wallet/wallet_recovery_keyshare.txt"
      // "Documents/Guardian Wallet/RecoveryKey.txt"
    );
    const fileContentForWrite = content;
    // "Test React Native module that can create scaled versions of local images. Sometime the Image which we select to upload has size of 7 MB or 8 MB or more than 10 MB it depends on the image quality. So it is better to reduce the size of image so that it will not effect on your app Performance. This library will help you to do the trick.";
    try {
      await writeFile(filePathForWrite, fileContentForWrite, {
        override: true,
      });
      console.log("wrote file");
      toast({
        position: "bottom",
        type: "success",
        title: `Recovery keyshare uploaded to the iCloud drive.`,
      });
    } catch (e) {
      console.error(e);
    }
  }
};

export const getRecoveryFromCloudStorage = async (token: string) => {
  const { toast } = useAlert();

  if (Platform.OS === "android") {
    try {
      console.log("uploadUrl");
      const response = await axios.get(
        "https://www.googleapis.com/drive/v3/files?q=name%3D%27wallet_recovery_keyshare.txt%27&fields=files(id)",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const recoveryBackups = response.data.files;
      if (recoveryBackups) {
        const recoveryResponse = await axios.get(
          `https://www.googleapis.com/drive/v3/files/${recoveryBackups[0].id}?alt=media`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const recoveryKey = recoveryResponse.data;
        console.log("RETRIVED RECOVERY KEY ========> ", recoveryKey);
        return recoveryKey;
      }
    } catch (error) {
      console.log(error);
    }
  }
  if (Platform.OS === "ios") {
    const filePathForWrite = PathUtils.join(
      defaultICloudContainerPath,
      "Documents/Guardian Wallet/RecoveryKey.txt"
    );
    const content = await readFile(filePathForWrite);
    console.log("content", content);
  }
};
