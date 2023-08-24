import { title } from "process"
import { Platform } from "react-native"
import { Toast } from "react-native-toast-message/lib/src/Toast"


interface ToastProps {
    type?: 'error' | 'success',
    content?: string,
    position?: 'bottom' | 'top',
    title: string,
}
export const useAlert = () => {
    return {
        toast: ({ type = "success", content, title, position = "bottom" }: ToastProps) => Toast.show({ type, text1: title, position, text2: content, bottomOffset: position === "bottom" ? Platform.OS === "ios" ? 120 : undefined : undefined })
    }
}