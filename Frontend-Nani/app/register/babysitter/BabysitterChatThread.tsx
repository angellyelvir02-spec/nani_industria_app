import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Phone,
} from "lucide-react-native";
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
      name: String(params.clientName ?? "Cliente"),
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}>
            <ArrowLeft color="white" size={20} />
          </TouchableOpacity>

          <View style={styles.profileRow}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: counterpart.photo || "https://via.placeholder.com/150",
                }}
                style={styles.avatar}
              />
              <View style={styles.onlineDot} />
            </View>

            <View>
              <Text style={styles.name}>{counterpart.name}</Text>
              <Text style={styles.status}>{counterpart.status}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.circleButton}>
            <Phone color="white" size={20} />
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
          contentContainerStyle={styles.messagesContainer}
          renderItem={({ item }) => {
            const isUser = item.sender === "me";

            return (
              <View
                style={[
                  styles.messageRow,
                  { justifyContent: isUser ? "flex-end" : "flex-start" },
                ]}
              >
                <View style={{ maxWidth: "75%" }}>
                  <View
                    style={[
                      styles.messageBubble,
                      isUser ? styles.userBubble : styles.babysitterBubble,
                    ]}
                  >
                    <Text style={isUser ? styles.userText : styles.babysitterText}>
                      {item.text}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.time,
                      { textAlign: isUser ? "right" : "left" },
                    ]}
                  >
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.iconButton}>
          <Paperclip color="#777" size={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton}>
          <ImageIcon color="#777" size={20} />
        </TouchableOpacity>

        <View style={styles.inputBox}>
          <TextInput
            placeholder="Escribe un mensaje..."
            value={message}
            onChangeText={setMessage}
            style={styles.input}
          />

          <TouchableOpacity>
            <Smile color="#999" size={20} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSend}
          style={[
            styles.sendButton,
            { backgroundColor: message.trim() ? "#FF768A" : "#EEE" },
          ]}
        >
          <Send size={20} color={message.trim() ? "white" : "#999"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "#886BC1",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 10,
    gap: 10,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 10,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "white",
  },
  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  status: {
    color: "white",
    opacity: 0.8,
    fontSize: 12,
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesContainer: {
    padding: 20,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: "#FF768A",
    borderBottomRightRadius: 6,
  },
  babysitterBubble: {
    backgroundColor: "#F6D9F1",
    borderBottomLeftRadius: 6,
  },
  userText: {
    color: "white",
  },
  babysitterText: {
    color: "#2E2E2E",
  },
  time: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "white",
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: "#F1F1F1",
    alignItems: "center",
    justifyContent: "center",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    backgroundColor: "#F1F1F1",
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
});
