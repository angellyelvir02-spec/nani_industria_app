import React, { useState } from "react";
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useRouter } from "expo-router";

import {
    ArrowLeft,
    Image as ImageIcon,
    Paperclip,
    Phone,
    Send,
    Smile,
} from "lucide-react-native";

interface Message {
  id: number;
  text: string;
  sender: "user" | "babysitter";
  time: string;
}

export default function ChatScreen() {
  const router = useRouter();

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "¡Hola! ¿En qué puedo ayudarte?",
      sender: "babysitter",
      time: "10:30",
    },
    {
      id: 2,
      text: "Hola María, necesito contratar tus servicios para el sábado",
      sender: "user",
      time: "10:31",
    },
    {
      id: 3,
      text: "¡Perfecto! Tengo disponibilidad el sábado. ¿Qué horario necesitas?",
      sender: "babysitter",
      time: "10:32",
    },
    {
      id: 4,
      text: "Sería de 14:00 a 18:00, para cuidar a mis dos hijos",
      sender: "user",
      time: "10:33",
    },
    {
      id: 5,
      text: "Excelente, confirmado. ¿Cuáles son las edades de los niños?",
      sender: "babysitter",
      time: "10:34",
    },
  ]);

  const babysitter = {
    name: "María González",
    photo: "https://images.unsplash.com/photo-1584446456661-1039ed1a39d7?w=200",
    status: "En línea",
  };

  const handleSend = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: message,
        sender: "user",
        time: new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages([...messages, newMessage]);
      setMessage("");
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";

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

          <Text style={[styles.time, { textAlign: isUser ? "right" : "left" }]}>
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* HEADER */}

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="white" size={20} />
          </TouchableOpacity>

          <View style={styles.profileRow}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: babysitter.photo }} style={styles.avatar} />
              <View style={styles.onlineDot} />
            </View>

            <View>
              <Text style={styles.name}>{babysitter.name}</Text>
              <Text style={styles.status}>{babysitter.status}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.circleButton}>
            <Phone color="white" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* MESSAGES */}

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messagesContainer}
      />

      {/* INPUT AREA */}

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
