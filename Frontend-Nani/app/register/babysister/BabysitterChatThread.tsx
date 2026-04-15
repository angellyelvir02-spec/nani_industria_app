import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Image as ImageIcon,
  MoreVertical,
  Paperclip,
  Phone,
  Send,
  Smile,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ENDPOINTS } from "../../../constants/apiConfig";

type Message = {
  id: string;
  text: string;
  sender: "me" | "other";
  createdAt: string;
};

export default function BabysitterChatThread() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const listRef = useRef<FlatList<Message>>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const otherUserId = String(params.otherUserId ?? "");

  const counterpart = useMemo(
    () => ({
      name: String(params.clientName ?? "Chat"),
      photo: String(params.clientPhoto ?? ""),
      status: "Reserva confirmada",
    }),
    [params.clientName, params.clientPhoto],
  );

  const fetchConversation = useCallback(async () => {
    if (!otherUserId) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(ENDPOINTS.get_chat_with_user(otherUserId), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo cargar el chat");
      }

      setMessages(data.messages || []);
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo cargar el chat.");
    } finally {
      setLoading(false);
    }
  }, [otherUserId]);

  useFocusEffect(
    useCallback(() => {
      fetchConversation();
      const interval = setInterval(fetchConversation, 5000);
      return () => clearInterval(interval);
    }, [fetchConversation]),
  );

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("es-HN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleSend = async () => {
    const cleanMessage = message.trim();
    if (!cleanMessage || !otherUserId) return;

    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(ENDPOINTS.send_chat_message(otherUserId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mensaje: cleanMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudo enviar el mensaje");
      }

      setMessages((prev) => [...prev, data.message]);
      setMessage("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo enviar el mensaje.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerIconButton}
            activeOpacity={0.8}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri: counterpart.photo || "https://via.placeholder.com/150",
                }}
                style={styles.avatar}
              />
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.headerTextBlock}>
              <Text style={styles.headerName}>{counterpart.name}</Text>
              <Text style={styles.headerStatus}>{counterpart.status}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.8}>
              <Phone size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.8}>
              <MoreVertical size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#886BC1" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isUser = item.sender === "me";

              return (
                <View
                  style={[
                    styles.messageRow,
                    isUser ? styles.messageRowRight : styles.messageRowLeft,
                  ]}
                >
                  <View
                    style={[
                      styles.messageWrapper,
                      isUser && styles.messageWrapperUser,
                    ]}
                  >
                    <View
                      style={[
                        styles.messageBubble,
                        isUser ? styles.userBubble : styles.clientBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isUser && styles.userMessageText,
                        ]}
                      >
                        {item.text}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.messageTime,
                        isUser && styles.messageTimeRight,
                      ]}
                    >
                      {formatTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={styles.messagesContent}
            style={styles.messagesList}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.secondaryActionButton}>
            <Paperclip size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryActionButton}>
            <ImageIcon size={18} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Escribe un mensaje..."
              placeholderTextColor="#9CA3AF"
              style={styles.input}
              multiline
              maxLength={500}
            />

            <TouchableOpacity style={styles.smileButton} activeOpacity={0.8}>
              <Smile size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={!message.trim()}
            style={[
              styles.sendButton,
              !message.trim() && styles.sendButtonDisabled,
            ]}
            activeOpacity={0.85}
          >
            <Send size={18} color={message.trim() ? "#FFFFFF" : "#9CA3AF"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#886BC1",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    backgroundColor: "#886BC1",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 10,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#E5E7EB",
  },
  onlineDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4ADE80",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerTextBlock: {
    flex: 1,
  },
  headerName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  headerStatus: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 10,
  },
  messageRow: {
    marginBottom: 14,
    flexDirection: "row",
  },
  messageRowLeft: {
    justifyContent: "flex-start",
  },
  messageRowRight: {
    justifyContent: "flex-end",
  },
  messageWrapper: {
    maxWidth: "78%",
  },
  messageWrapperUser: {
    alignItems: "flex-end",
  },
  messageBubble: {
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  clientBubble: {
    backgroundColor: "#F6D9F1",
    borderBottomLeftRadius: 8,
  },
  userBubble: {
    backgroundColor: "#FF768A",
    borderBottomRightRadius: 8,
  },
  messageText: {
    fontSize: 14,
    color: "#2E2E2E",
    lineHeight: 20,
  },
  userMessageText: {
    color: "#FFFFFF",
  },
  messageTime: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
    marginLeft: 8,
  },
  messageTimeRight: {
    marginRight: 8,
    marginLeft: 0,
    textAlign: "right",
  },
  inputArea: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  secondaryActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  inputWrapper: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#2E2E2E",
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 6,
  },
  smileButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FF768A",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#F3F4F6",
  },
});
