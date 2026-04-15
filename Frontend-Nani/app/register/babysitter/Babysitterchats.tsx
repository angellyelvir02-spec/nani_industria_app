import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { ENDPOINTS } from "../../../constants/apiConfig";

type ChatPreview = {
  otherUserId: string;
  name: string;
  photo: string | null;
  lastMessage: string;
  time: string;
  isOnline: boolean;
  status: string;
};

export default function BabysitterChats() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatPreview[]>([]);

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(ENDPOINTS.get_chat_conversations, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        setChats([]);
        return;
      }

      setChats(data || []);
    } catch (error) {
      console.log("Error cargando chats:", error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats]),
  );

  const filteredChats = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    if (!text) return chats;

    return chats.filter(
      (item) =>
        item.name.toLowerCase().includes(text) ||
        item.lastMessage.toLowerCase().includes(text),
    );
  }, [chats, searchText]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#886BC1", "#FF768A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.replace("/register/babysitter/BabysitterDashboard")}
            style={styles.headerIconButton}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mensajes</Text>
        </View>

        <View style={styles.searchContainer}>
          <Feather
            name="search"
            size={18}
            color="#A0A0A0"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Buscar conversación..."
            placeholderTextColor="#A0A0A0"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#886BC1" />
        </View>
      ) : filteredChats.length === 0 ? (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>No tienes chats disponibles</Text>
          <Text style={styles.emptyText}>
            Aquí solo aparecerán clientes con reserva confirmada o en curso.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.otherUserId}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatCard}
              onPress={() =>
                router.push({
                  pathname: "/register/babysitter/BabysitterChatThread",
                  params: {
                    otherUserId: item.otherUserId,
                    clientName: item.name,
                    clientPhoto: item.photo || "",
                  },
                })
              }
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri: item.photo || "https://via.placeholder.com/150",
                  }}
                  style={styles.avatar}
                />
                {item.isOnline && <View style={styles.onlineDot} />}
              </View>

              <View style={styles.chatInfo}>
                <View style={styles.chatHeader}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.time}>{item.time || item.status}</Text>
                </View>

                <View style={styles.chatFooter}>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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
    flexDirection: "row",
    alignItems: "center",
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
    gap: 10,
  },
  name: { fontSize: 16, fontWeight: "700", color: "#2E2E2E", flex: 1 },
  time: { fontSize: 12, color: "#9A9A9A" },
  chatFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMessage: { fontSize: 14, color: "#707070", flex: 1, marginRight: 10 },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 90,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E2E2E",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
