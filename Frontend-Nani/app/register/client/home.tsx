// import React, { useMemo, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   TextInput,
//   TouchableOpacity,
//   Image,
//   FlatList,
//   StatusBar,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import {
//   Feather,
//   Ionicons,
//   MaterialIcons,
//   FontAwesome,
// } from "@expo/vector-icons";

// type Babysitter = {
//   id: number;
//   name: string;
//   photo: string;
//   rating: number;
//   hourlyRate: number;
//   experience: string;
//   location: string;
//   isOnline: boolean;
//   isAvailable: boolean;
//   certified: boolean;
//   distanceKm: number;
// };

// type FilterType = "Disponibles" | "Cerca de ti" | "Mejor valoradas" | "Certificadas";

// interface BabysitterCardProps {
//   item: Babysitter;
//   onViewProfile: (id: number) => void;
// }

// const BabysitterCard = ({ item, onViewProfile }: BabysitterCardProps) => {
//   return (
//     <View style={styles.card}>
//       <View style={styles.cardTop}>
//         <View style={styles.imageWrapper}>
//           <Image source={{ uri: item.photo }} style={styles.avatar} />
//           {item.isOnline && <View style={styles.onlineDot} />}
//         </View>

//         <View style={styles.cardInfo}>
//           <Text style={styles.name}>{item.name}</Text>

//           <View style={styles.row}>
//             <FontAwesome name="star" size={14} color="#FF768A" />
//             <Text style={styles.ratingText}>{item.rating}</Text>
//             <Text style={styles.experienceText}>• {item.experience}</Text>
//           </View>

//           <View style={styles.row}>
//             <Ionicons name="location-outline" size={13} color="#8D8D8D" />
//             <Text style={styles.locationText}>{item.location}</Text>
//           </View>

//           <View style={styles.row}>
//             <Ionicons name="time-outline" size={13} color="#886BC1" />
//             <Text style={styles.priceText}>${item.hourlyRate}/hora</Text>
//           </View>
//         </View>
//       </View>

//       <TouchableOpacity
//         style={styles.profileButton}
//         onPress={() => onViewProfile(item.id)}
//         activeOpacity={0.8}
//       >
//         <Text style={styles.profileButtonText}>Ver perfil</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// interface HomeScreenProps {
//   onViewProfile: (id: number) => void;
//   onNavigate: (screen: string) => void;
// }

// export default function HomeScreen({
//   onViewProfile,
//   onNavigate,
// }: HomeScreenProps) {
//   const [searchText, setSearchText] = useState("");
//   const [selectedFilter, setSelectedFilter] = useState<FilterType>("Disponibles");

//   // Esto luego lo puedes traer desde una API
//   const [babysitters] = useState<Babysitter[]>([
//     {
//       id: 1,
//       name: "María González",
//       photo:
//         "https://images.unsplash.com/photo-1584446456661-1039ed1a39d7?w=200&h=200&fit=crop",
//       rating: 4.9,
//       hourlyRate: 15,
//       experience: "5 años exp.",
//       location: "Centro, Ciudad",
//       isOnline: true,
//       isAvailable: true,
//       certified: true,
//       distanceKm: 2,
//     },
//     {
//       id: 2,
//       name: "Ana Rodríguez",
//       photo:
//         "https://images.unsplash.com/photo-1565310561974-f2dc282230d9?w=200&h=200&fit=crop",
//       rating: 4.8,
//       hourlyRate: 18,
//       experience: "3 años exp.",
//       location: "Norte, Ciudad",
//       isOnline: true,
//       isAvailable: true,
//       certified: false,
//       distanceKm: 4,
//     },
//     {
//       id: 3,
//       name: "Sofía Martínez",
//       photo:
//         "https://images.unsplash.com/photo-1668752741330-8adc5cef7485?w=200&h=200&fit=crop",
//       rating: 5.0,
//       hourlyRate: 20,
//       experience: "7 años exp.",
//       location: "Sur, Ciudad",
//       isOnline: false,
//       isAvailable: true,
//       certified: true,
//       distanceKm: 6,
//     },
//     {
//       id: 4,
//       name: "Laura Pérez",
//       photo:
//         "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
//       rating: 4.7,
//       hourlyRate: 14,
//       experience: "2 años exp.",
//       location: "Este, Ciudad",
//       isOnline: true,
//       isAvailable: false,
//       certified: true,
//       distanceKm: 1.5,
//     },
//   ]);

//   const filteredBabysitters = useMemo(() => {
//     let result = [...babysitters];

//     if (searchText.trim()) {
//       const text = searchText.toLowerCase();
//       result = result.filter(
//         (item) =>
//           item.name.toLowerCase().includes(text) ||
//           item.location.toLowerCase().includes(text) ||
//           item.experience.toLowerCase().includes(text)
//       );
//     }

//     switch (selectedFilter) {
//       case "Disponibles":
//         result = result.filter((item) => item.isAvailable);
//         break;
//       case "Cerca de ti":
//         result = result.sort((a, b) => a.distanceKm - b.distanceKm);
//         break;
//       case "Mejor valoradas":
//         result = result.sort((a, b) => b.rating - a.rating);
//         break;
//       case "Certificadas":
//         result = result.filter((item) => item.certified);
//         break;
//       default:
//         break;
//     }

//     return result;
//   }, [babysitters, searchText, selectedFilter]);

//   const renderHeader = () => (
//     <LinearGradient
//       colors={["#886BC1", "#FF768A"]}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 0 }}
//       style={styles.header}
//     >
//       <Text style={styles.greeting}>Hola, Jairo 👋</Text>

//       <View style={styles.searchContainer}>
//         <Feather name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
//         <TextInput
//           placeholder="Buscar niñera..."
//           placeholderTextColor="#A0A0A0"
//           style={styles.searchInput}
//           value={searchText}
//           onChangeText={setSearchText}
//         />
//       </View>

//       <View style={styles.filtersRow}>
//         <TouchableOpacity
//           style={[
//             styles.filterChip,
//             selectedFilter === "Disponibles" && styles.filterChipActive,
//           ]}
//           onPress={() => setSelectedFilter("Disponibles")}
//         >
//           <Text style={styles.filterText}>Disponibles</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[
//             styles.filterChip,
//             selectedFilter === "Cerca de ti" && styles.filterChipActive,
//           ]}
//           onPress={() => setSelectedFilter("Cerca de ti")}
//         >
//           <Text style={styles.filterText}>Cerca de ti</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.filterIconButton}
//           onPress={() => setSelectedFilter("Mejor valoradas")}
//         >
//           <MaterialIcons name="tune" size={18} color="#FFFFFF" />
//         </TouchableOpacity>
//       </View>
//     </LinearGradient>
//   );

//   const renderFooter = () => <View style={{ height: 100 }} />;

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="light-content" />

//       <View style={styles.container}>
//         <FlatList
//           data={filteredBabysitters}
//           keyExtractor={(item) => item.id.toString()}
//           renderItem={({ item }) => (
//             <BabysitterCard item={item} onViewProfile={onViewProfile} />
//           )}
//           ListHeaderComponent={
//             <View>
//               {renderHeader()}

//               <View style={styles.content}>
//                 <Text style={styles.sectionTitle}>Niñeras disponibles</Text>
//               </View>
//             </View>
//           }
//           ListFooterComponent={renderFooter}
//           contentContainerStyle={styles.listContent}
//           showsVerticalScrollIndicator={false}
//         />

//         {/* Bottom Navigation */}
//         <View style={styles.bottomNav}>
//           <TouchableOpacity style={styles.navItem}>
//             <Ionicons name="home-outline" size={22} color="#886BC1" />
//             <Text style={[styles.navText, { color: "#886BC1" }]}>Inicio</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.navItem}
//             onPress={() => onNavigate("bookings")}
//           >
//             <Ionicons name="time-outline" size={22} color="#B0B0B0" />
//             <Text style={styles.navText}>Reservas</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.navItem}
//             onPress={() => onNavigate("chat")}
//           >
//             <View style={styles.chatIconWrapper}>
//               <Ionicons name="chatbubble-ellipses-outline" size={22} color="#B0B0B0" />
//               <View style={styles.notificationDot} />
//             </View>
//             <Text style={styles.navText}>Chat</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.navItem}
//             onPress={() => onNavigate("profile")}
//           >
//             <Ionicons name="person-outline" size={22} color="#B0B0B0" />
//             <Text style={styles.navText}>Perfil</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#FAFAFA",
//   },
//   container: {
//     flex: 1,
//     backgroundColor: "#FAFAFA",
//   },
//   listContent: {
//     paddingBottom: 0,
//   },
//   header: {
//     paddingTop: 18,
//     paddingHorizontal: 16,
//     paddingBottom: 18,
//     borderBottomLeftRadius: 28,
//     borderBottomRightRadius: 28,
//   },
//   greeting: {
//     color: "#FFFFFF",
//     fontSize: 22,
//     fontWeight: "700",
//     marginBottom: 16,
//   },
//   searchContainer: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 16,
//     height: 52,
//     justifyContent: "center",
//     marginBottom: 14,
//     position: "relative",
//     paddingLeft: 42,
//     paddingRight: 14,
//   },
//   searchIcon: {
//     position: "absolute",
//     left: 14,
//     top: 16,
//     zIndex: 1,
//   },
//   searchInput: {
//     fontSize: 15,
//     color: "#2E2E2E",
//   },
//   filtersRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   filterChip: {
//     backgroundColor: "rgba(255,255,255,0.18)",
//     paddingHorizontal: 16,
//     paddingVertical: 9,
//     borderRadius: 999,
//   },
//   filterChipActive: {
//     backgroundColor: "rgba(255,255,255,0.28)",
//   },
//   filterText: {
//     color: "#FFFFFF",
//     fontSize: 13,
//     fontWeight: "500",
//   },
//   filterIconButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 999,
//     backgroundColor: "rgba(255,255,255,0.18)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   content: {
//     paddingHorizontal: 16,
//     paddingTop: 18,
//     paddingBottom: 8,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#2E2E2E",
//   },
//   card: {
//     backgroundColor: "#FFFFFF",
//     marginHorizontal: 16,
//     marginBottom: 14,
//     borderRadius: 20,
//     padding: 14,
//     borderWidth: 1,
//     borderColor: "#EEEEEE",
//   },
//   cardTop: {
//     flexDirection: "row",
//     gap: 12,
//   },
//   imageWrapper: {
//     position: "relative",
//   },
//   avatar: {
//     width: 72,
//     height: 72,
//     borderRadius: 36,
//   },
//   onlineDot: {
//     position: "absolute",
//     bottom: 0,
//     right: 0,
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: "#22C55E",
//     borderWidth: 2,
//     borderColor: "#FFFFFF",
//   },
//   cardInfo: {
//     flex: 1,
//     justifyContent: "center",
//   },
//   name: {
//     color: "#2E2E2E",
//     fontSize: 17,
//     fontWeight: "700",
//     marginBottom: 6,
//   },
//   row: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 5,
//   },
//   ratingText: {
//     marginLeft: 4,
//     color: "#2E2E2E",
//     fontSize: 14,
//     fontWeight: "600",
//   },
//   experienceText: {
//     marginLeft: 6,
//     color: "#9A9A9A",
//     fontSize: 13,
//   },
//   locationText: {
//     marginLeft: 4,
//     color: "#8D8D8D",
//     fontSize: 13,
//   },
//   priceText: {
//     marginLeft: 4,
//     color: "#886BC1",
//     fontSize: 13,
//     fontWeight: "700",
//   },
//   profileButton: {
//     marginTop: 14,
//     backgroundColor: "#FF768A",
//     borderRadius: 16,
//     paddingVertical: 13,
//     alignItems: "center",
//   },
//   profileButtonText: {
//     color: "#FFFFFF",
//     fontSize: 15,
//     fontWeight: "700",
//   },
//   bottomNav: {
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//     right: 0,
//     backgroundColor: "#FFFFFF",
//     borderTopWidth: 1,
//     borderTopColor: "#F0F0F0",
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     paddingTop: 12,
//     paddingBottom: 18,
//     flexDirection: "row",
//     justifyContent: "space-around",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 8,
//   },
//   navItem: {
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   navText: {
//     marginTop: 4,
//     fontSize: 12,
//     color: "#B0B0B0",
//   },
//   chatIconWrapper: {
//     position: "relative",
//   },
//   notificationDot: {
//     position: "absolute",
//     top: 0,
//     right: -1,
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "#FF768A",
//   },
// });
/*

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Feather,
  Ionicons,
  MaterialIcons,
  FontAwesome,
} from "@expo/vector-icons";
import { ENDPOINTS } from "../../../constants/apiConfig";
import { useRouter, useFocusEffect } from "expo-router";

// --- TIPOS ---
type Babysitter = {
  id: number;
  name: string;
  photo: string;
  rating: number;
  hourlyRate: number;
  experience: string;
  location: string;
  isOnline: boolean;
  isAvailable: boolean;
  certified: boolean;
  distanceKm: number;
};

type FilterType =
  | "Disponibles"
  | "Cerca de ti"
  | "Mejor valoradas"
  | "Certificadas";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

const BabysitterCard = ({
  item,
  onViewProfile,
}: {
  item: Babysitter;
  onViewProfile: (id: number) => void;
}) => (
  <View style={styles.card}>
    <View style={styles.cardTop}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.photo }} style={styles.avatar} />
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.row}>
          <FontAwesome name="star" size={14} color="#FF768A" />
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.experienceText}>• {item.experience}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={13} color="#8D8D8D" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={13} color="#886BC1" />
          <Text style={styles.priceText}>L {item.hourlyRate}/hora</Text>
        </View>
      </View>
    </View>
    <TouchableOpacity
      style={styles.profileButton}
      onPress={() => onViewProfile(item.id)}
      activeOpacity={0.8}
    >
      <Text style={styles.profileButtonText}>Ver perfil</Text>
    </TouchableOpacity>
  </View>
);

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] =
    useState<FilterType>("Disponibles");
  const [babysitters, setBabysitters] = useState<Babysitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Usuario");
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchLoggedUser();
      fetchBabysitters();
    }, []),
  );

  // 1. Obtener datos del usuario logueado con DEPURACIÓN
  const fetchLoggedUser = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;

      const response = await fetch(ENDPOINTS.me, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok) {
        // Buscamos el nombre en todas las rutas posibles del objeto
        const nombreReal = data?.persona?.nombre || data?.nombre || "Usuario";
        setUserName(nombreReal);
      }
    } catch (error) {
      console.error("Error fetchLoggedUser:", error);
    }
  };

  // 2. Obtener lista de niñeras
  const fetchBabysitters = async () => {
    try {
      setLoading(true);
      const response = await fetch(ENDPOINTS.get_nineras);
      const data = await response.json();

      if (!response.ok) throw new Error("Error en el servidor");

      const mappedData = data.map((item: any) => ({
        id: item.id,
        name: item.persona
          ? `${item.persona.nombre} ${item.persona.apellido}`
          : "Niñera",
        photo: item.persona?.foto_url || "https://via.placeholder.com/150",
        rating: 5.0,
        hourlyRate: item.tarifa || 0,
        experience: item.experiencia || "Sin experiencia",
        location:
          item.persona?.direccion?.direccion_completa ||
          "Ubicación no disponible",
        isOnline: true,
        isAvailable: true,
        certified: item.verificada || false,
        distanceKm: 0,
      }));

      setBabysitters(mappedData);
    } catch (error) {
      console.error("Error fetchBabysitters:", error);
    } finally {
      setLoading(false);
    }
  };

  // 3. Navegación con notificación de perfil incompleto corregida
  const handlePressProfile = async (id: number) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(ENDPOINTS.me, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const userData = await response.json();

      // Validación estricta de fotos de identidad
      const frontal = userData?.persona?.DNI_frontal_url;
      const reverso = userData?.persona?.DNI_reverso_url;

      if (!frontal || frontal.length < 5 || !reverso || reverso.length < 5) {
        Alert.alert(
          "Perfil Incompleto",
          "Debes completar tu perfil para continuar y poder ver los detalles de la niñera.",
          [
            {
              text: "Completar perfil",
              onPress: () =>
                router.push("/register/client/ClientRegistrationForm2"),
            },
            { text: "Más tarde", style: "cancel" },
          ],
        );
        return;
      }

      const nani = babysitters.find((b) => b.id === id);
      if (nani) {
        router.push({
          pathname: "/register/client/BabysitterProfile",
          params: {
            babysitterId: nani.id,
            name: nani.name,
            photo: nani.photo,
            hourlyRate: nani.hourlyRate,
          },
        });
      }
    } catch (error) {
      Alert.alert("Error", "No pudimos validar tu acceso con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const filteredBabysitters = useMemo(() => {
    let result = [...babysitters];
    if (searchText.trim()) {
      const text = searchText.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(text) ||
          item.location.toLowerCase().includes(text),
      );
    }
    return result;
  }, [babysitters, searchText]);

  const renderHeader = () => (
    <LinearGradient
      colors={["#886BC1", "#FF768A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <Text style={styles.greeting}>Hola, {userName} 👋</Text>
      <View style={styles.searchContainer}>
        <Feather
          name="search"
          size={20}
          color="#A0A0A0"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Buscar niñera o ciudad..."
          placeholderTextColor="#A0A0A0"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      <View style={styles.filtersRow}>
        {(["Disponibles", "Cerca de ti"] as FilterType[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={styles.filterText}>{filter}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.filterIconButton}>
          <MaterialIcons name="tune" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {loading && babysitters.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#886BC1" />
            <Text style={styles.loaderText}>Cargando Nani...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBabysitters}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <BabysitterCard item={item} onViewProfile={handlePressProfile} />
            )}
            ListHeaderComponent={
              <View>
                {renderHeader()}
                <View style={styles.content}>
                  <Text style={styles.sectionTitle}>Niñeras en tu zona</Text>
                </View>
              </View>
            }
            ListFooterComponent={<View style={{ height: 100 }} />}
            contentContainerStyle={styles.listContent}
            onRefresh={fetchBabysitters}
            refreshing={loading}
          />
        )}

        {/* Nav Inferior *//*}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={22} color="#886BC1" />
            <Text style={[styles.navText, { color: "#886BC1" }]}>Inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => onNavigate("bookings")}
          >
            <Ionicons name="time-outline" size={22} color="#B0B0B0" />
            <Text style={styles.navText}>Reservas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => onNavigate("chat")}
          >
            <View style={styles.chatIconWrapper}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={22}
                color="#B0B0B0"
              />
              <View style={styles.notificationDot} />
            </View>
            <Text style={styles.navText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => onNavigate("profile")}
          >
            <Ionicons name="person-outline" size={22} color="#B0B0B0" />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  container: { flex: 1 },
  listContent: { paddingBottom: 0 },
  header: {
    paddingTop: 22,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  greeting: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    height: 52,
    justifyContent: "center",
    marginBottom: 14,
    paddingLeft: 42,
    paddingRight: 14,
  },
  searchIcon: { position: "absolute", left: 14, top: 16, zIndex: 1 },
  searchInput: { fontSize: 15, color: "#2E2E2E" },
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterChip: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  filterChipActive: { backgroundColor: "rgba(255,255,255,0.28)" },
  filterText: { color: "#FFFFFF", fontSize: 13, fontWeight: "500" },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#2E2E2E" },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    padding: 14,
    elevation: 2,
  },
  cardTop: { flexDirection: "row", gap: 12 },
  imageWrapper: { position: "relative" },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  cardInfo: { flex: 1, justifyContent: "center" },
  name: { color: "#2E2E2E", fontSize: 17, fontWeight: "700", marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  ratingText: {
    marginLeft: 4,
    color: "#2E2E2E",
    fontSize: 14,
    fontWeight: "600",
  },
  experienceText: { marginLeft: 6, color: "#9A9A9A", fontSize: 13 },
  locationText: { marginLeft: 4, color: "#8D8D8D", fontSize: 13 },
  priceText: {
    marginLeft: 4,
    color: "#886BC1",
    fontSize: 13,
    fontWeight: "700",
  },
  profileButton: {
    marginTop: 14,
    backgroundColor: "#FF768A",
    borderRadius: 16,
    paddingVertical: 13,
    alignItems: "center",
  },
  profileButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 18,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    elevation: 10,
  },
  navItem: { alignItems: "center", justifyContent: "center" },
  navText: { marginTop: 4, fontSize: 12, color: "#B0B0B0" },
  chatIconWrapper: { position: "relative" },
  notificationDot: {
    position: "absolute",
    top: 0,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF768A",
  },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#886BC1",
    fontWeight: "600",
  },
});
*/
import { Feather, FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

// --- COMPONENTES INTERNOS ---

const BabysitterCard = ({ item, onViewProfile }: { item: any; onViewProfile: (id: number) => void }) => (
  <View style={styles.card}>
    <View style={styles.cardTop}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.photo }} style={styles.avatar} />
        {item.isOnline && <View style={styles.onlineDot} />}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.row}>
          <FontAwesome name="star" size={14} color="#FF768A" />
          <Text style={styles.ratingText}>{item.rating}</Text>
          <Text style={styles.experienceText}>• {item.experience}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={13} color="#8D8D8D" />
          <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={13} color="#886BC1" />
          <Text style={styles.priceText}>L {item.hourlyRate}/hora</Text>
        </View>
      </View>
    </View>
    <TouchableOpacity
      style={styles.profileButton}
      onPress={() => onViewProfile(item.id)}
      activeOpacity={0.8}
    >
      <Text style={styles.profileButtonText}>Ver perfil</Text>
    </TouchableOpacity>
  </View>
);

export default function HomeScreen({ onNavigate }: { onNavigate: (s: string) => void }) {
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Disponibles");
  const [babysitters, setBabysitters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Usuario");
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchLoggedUser();
      fetchBabysitters();
    }, [])
  );

  const fetchLoggedUser = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      if (!token) return;
      const response = await fetch(ENDPOINTS.me, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        const nombreReal = data?.persona?.nombre || data?.nombre || "Usuario";
        setUserName(nombreReal);
      }
    } catch (error) {
      console.error("Error al obtener usuario:", error);
    }
  };

  const fetchBabysitters = async () => {
    try {
      setLoading(true);
      const response = await fetch(ENDPOINTS.get_nineras);
      const data = await response.json();
      if (!response.ok) throw new Error();

      const mappedData = data.map((item: any) => ({
        id: item.id,
        name: item.persona ? `${item.persona.nombre} ${item.persona.apellido}` : "Niñera",
        photo: item.persona?.foto_url || "https://via.placeholder.com/150",
        rating: 5.0,
        hourlyRate: item.tarifa || 0,
        experience: item.experiencia || "Sin experiencia",
        location: item.persona?.direccion?.direccion_completa || "Ubicación no disponible",
        isOnline: true,
        isAvailable: true,
        certified: item.verificada || false,
      }));
      setBabysitters(mappedData);
    } catch (error) {
      Alert.alert("Error de conexión", "No pudimos cargar las niñeras. Desliza hacia abajo para reintentar.");
    } finally {
      setLoading(false);
    }
  };

  // --- VALIDACIÓN DE PERFIL ANTES DE NAVEGAR ---
  const handlePressProfile = async (id: number) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("userToken");
      const response = await fetch(ENDPOINTS.me, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await response.json();

      const frontal = userData?.persona?.DNI_frontal_url;
      const reverso = userData?.persona?.DNI_reverso_url;

      // Validación estricta: Si no hay documentos, no entra al perfil
      if (!frontal || frontal.length < 10 || !reverso || reverso.length < 10) {
        Alert.alert(
          "Perfil Incompleto 🛡️",
          "Por seguridad, debes subir fotos legibles de tu DNI antes de contactar a una niñera.",
          [
            { text: "Completar ahora", onPress: () => router.push("/register/client/ClientRegistrationForm2") },
            { text: "Más tarde", style: "cancel" },
          ]
        );
        return;
      }

      const nani = babysitters.find((b) => b.id === id);
      if (nani) {
        router.push({
          pathname: "/register/client/BabysitterProfile",
          params: { babysitterId: nani.id, name: nani.name, photo: nani.photo, hourlyRate: nani.hourlyRate },
        });
      }
    } catch (error) {
      Alert.alert("Error", "No pudimos validar tu acceso. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const filteredBabysitters = useMemo(() => {
    return babysitters.filter((item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.location.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [babysitters, searchText]);

  const renderHeader = () => (
    <LinearGradient colors={["#886BC1", "#FF768A"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.header}>
      <Text style={styles.greeting}>¡Hola, {userName}! 👋</Text>
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
        <TextInput
          placeholder="Buscar por nombre o ciudad..."
          placeholderTextColor="#A0A0A0"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      <View style={styles.filtersRow}>
        {["Disponibles", "Cerca de ti"].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={styles.filterText}>{filter}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.filterIconButton}>
          <MaterialIcons name="tune" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {loading && babysitters.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#886BC1" />
            <Text style={styles.loaderText}>Buscando a tu Nani ideal...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBabysitters}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <BabysitterCard item={item} onViewProfile={handlePressProfile} />}
            ListHeaderComponent={
              <View>
                {renderHeader()}
                <View style={styles.content}>
                  <Text style={styles.sectionTitle}>
                    {searchText ? `Resultados para "${searchText}"` : "Niñeras en tu zona"}
                  </Text>
                </View>
              </View>
            }
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="search-outline" size={60} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No encontramos niñeras con esos criterios.</Text>
                </View>
              ) : null
            }
            ListFooterComponent={<View style={{ height: 100 }} />}
            onRefresh={fetchBabysitters}
            refreshing={loading}
          />
        )}

        {/* Navigation Bar */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color="#886BC1" />
            <Text style={[styles.navText, { color: "#886BC1" }]}>Inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("bookings")}>
            <Ionicons name="calendar-outline" size={24} color="#B0B0B0" />
            <Text style={styles.navText}>Reservas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("chat")}>
            <View>
              <Ionicons name="chatbubbles-outline" size={24} color="#B0B0B0" />
              <View style={styles.notificationDot} />
            </View>
            <Text style={styles.navText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("profile")}>
            <Ionicons name="person-outline" size={24} color="#B0B0B0" />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  greeting: { color: "#FFF", fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  searchContainer: { backgroundColor: "#FFF", borderRadius: 15, height: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginBottom: 15 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  filtersRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  filterChip: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  filterChipActive: { backgroundColor: "rgba(255,255,255,0.4)" },
  filterText: { color: "#FFF", fontWeight: "600" },
  filterIconButton: { backgroundColor: "rgba(255,255,255,0.2)", padding: 8, borderRadius: 10 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#374151" },
  card: { backgroundColor: "#FFF", marginHorizontal: 20, marginBottom: 15, borderRadius: 20, padding: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardTop: { flexDirection: "row", gap: 15 },
  avatar: { width: 70, height: 70, borderRadius: 35 },
  imageWrapper: { position: 'relative' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 15, height: 15, borderRadius: 7.5, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFF' },
  cardInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: "bold", color: "#1F2937" },
  row: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  ratingText: { marginLeft: 5, fontWeight: "600", color: "#374151" },
  experienceText: { marginLeft: 5, color: "#6B7280" },
  locationText: { marginLeft: 5, color: "#6B7280", flex: 1 },
  priceText: { marginLeft: 5, color: "#886BC1", fontWeight: "bold" },
  profileButton: { backgroundColor: "#FF768A", marginTop: 15, padding: 12, borderRadius: 15, alignItems: "center" },
  profileButtonText: { color: "#FFF", fontWeight: "bold" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { marginTop: 10, color: "#886BC1", fontWeight: "600" },
  emptyContainer: { flex: 1, alignItems: "center", marginTop: 50 },
  emptyText: { marginTop: 10, color: "#9CA3AF" },
  bottomNav: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 15, backgroundColor: "#FFF", borderTopLeftRadius: 25, borderTopRightRadius: 25, elevation: 20 },
  navItem: { alignItems: "center" },
  navText: { fontSize: 11, marginTop: 4, color: "#B0B0B0" },
  notificationDot: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF768A' }
});