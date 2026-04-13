import { Feather, Ionicons } from "@expo/vector-icons"; // Cambié a Ionicons para no instalar más librerías
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// --- TIPOS ---
type ChatPreview = {
  id: string;
  name: string;
  photo: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
};

export default function ChatList() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");

  const [chats] = useState<ChatPreview[]>([
    {
      id: "1",
      name: "Maria Rodriguez",
      photo: "https://randomuser.me/api/portraits/women/44.jpg",
      lastMessage: "¡Perfecto! Estaré allí a las 3:00 PM.",
      time: "10:05 AM",
      unreadCount: 2,
      isOnline: true,
    },
    {
      id: "2",
      name: "Ana Martínez",
      photo: "https://randomuser.me/api/portraits/women/65.jpg",
      lastMessage: "Hola, ¿podrías confirmarme la dirección?",
      time: "Ayer",
      unreadCount: 0,
      isOnline: false,
    },
  ]);

  const renderChatItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() =>
        router.push({
          pathname: "/register/client/chat",
          params: { name: item.name, photo: item.photo },
        })
      }
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.photo }} style={styles.avatar} />
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>

      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.time}>{item.time}</Text>
        </View>
        
        <View style={styles.chatFooter}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={["#886BC1", "#FF768A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        {/* FILA SUPERIOR: Botón Regresar + Título */}
        <View style={styles.topBar}>
            <TouchableOpacity
                onPress={() => router.replace("/register/client/home")} // AJUSTA ESTA RUTA A TU INICIO
                style={styles.headerIconButton}
                activeOpacity={0.8}
            >
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mensajes</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Feather name="search" size={18} color="#A0A0A0" style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar conversación..."
            placeholderTextColor="#A0A0A0"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </LinearGradient>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingTop: 15,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.20)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 45,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: "#2E2E2E" },
  
  listContent: { paddingVertical: 10 },
  chatCard: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: "center",
  },
  avatarContainer: { position: "relative" },
  avatar: { width: 55, height: 55, borderRadius: 27.5 },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  chatInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "center",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: { fontSize: 16, fontWeight: "700", color: "#2E2E2E" },
  time: { fontSize: 12, color: "#9A9A9A" },
  chatFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: { fontSize: 14, color: "#707070", flex: 1, marginRight: 10 },
  unreadBadge: {
    backgroundColor: "#FF768A",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 90,
  },
});