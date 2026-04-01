import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Phone,
  MoreVertical,
} from "lucide-react-native";

type Sender = "user" | "babysitter";

type Message = {
  id: number;
  text: string;
  sender: Sender;
  time: string;
};

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const listRef = useRef<FlatList<Message>>(null);

  const babysitter = useMemo(
    () => ({
      id: String(params.babysitterId ?? "1"),
      name: String(params.babysitterName ?? "María González"),
      photo: String(
        params.babysitterPhoto ??
          "https://images.unsplash.com/photo-1584446456661-1039ed1a39d7?w=200&h=200&fit=crop"
      ),
      status: String(params.babysitterStatus ?? "En línea"),
    }),
    [params]
  );

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `¡Hola! Soy ${babysitter.name}. ¿En qué puedo ayudarte?`,
      sender: "babysitter",
      time: "10:30",
    },
    {
      id: 2,
      text: `Hola ${babysitter.name}, quisiera hablar sobre la reserva.`,
      sender: "user",
      time: "10:31",
    },
  ]);

  const currentTime = () =>
    new Date().toLocaleTimeString("es-HN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleSend = () => {
    const cleanMessage = message.trim();
    if (!cleanMessage) return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: cleanMessage,
      sender: "user",
      time: currentTime(),
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setMessage("");

    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // Respuesta temporal visual
    setTimeout(() => {
      const autoReply: Message = {
        id: updatedMessages.length + 1,
        text: "Perfecto, recibí tu mensaje. Te respondo en breve.",
        sender: "babysitter",
        time: currentTime(),
      };

      setMessages((prev) => [...prev, autoReply]);

      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1200);
  };

  const handleCall = () => {
    Alert.alert("Llamada", `Aquí puedes conectar la llamada con ${babysitter.name}.`);
  };

  const handleAttachment = () => {
    Alert.alert("Adjuntar", "Aquí puedes abrir archivos o documentos.");
  };

  const handleImage = () => {
    Alert.alert("Imagen", "Aquí puedes abrir galería o cámara.");
  };

  const handleMore = () => {
    Alert.alert("Opciones", "Aquí puedes mostrar más acciones del chat.");
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";

    return (
      <View
        style={[
          styles.messageRow,
          isUser ? styles.messageRowRight : styles.messageRowLeft,
        ]}
      >
        <View style={[styles.messageWrapper, isUser && styles.messageWrapperUser]}>
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userBubble : styles.babysitterBubble,
            ]}
          >
            <Text style={[styles.messageText, isUser && styles.userMessageText]}>
              {item.text}
            </Text>
          </View>

          <Text style={[styles.messageTime, isUser && styles.messageTimeRight]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
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
              <Image source={{ uri: babysitter.photo }} style={styles.avatar} />
              <View style={styles.onlineDot} />
            </View>

            <View style={styles.headerTextBlock}>
              <Text style={styles.headerName}>{babysitter.name}</Text>
              <Text style={styles.headerStatus}>{babysitter.status}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleCall}
              style={styles.headerIconButton}
              activeOpacity={0.8}
            >
              <Phone size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleMore}
              style={styles.headerIconButton}
              activeOpacity={0.8}
            >
              <MoreVertical size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContent}
          style={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Input */}
        <View style={styles.inputArea}>
          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={handleAttachment}
            activeOpacity={0.8}
          >
            <Paperclip size={18} color="#6B7280" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={handleImage}
            activeOpacity={0.8}
          >
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
              onSubmitEditing={handleSend}
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
            <Send
              size={18}
              color={message.trim() ? "#FFFFFF" : "#9CA3AF"}
            />
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
  babysitterBubble: {
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