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

import React, { useMemo, useState, useEffect } from "react";
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
  userName: string;
  onViewProfile: (id: number) => void;
  onNavigate: (screen: string) => void;
}

// --- COMPONENTE DE TARJETA ---
const BabysitterCard = ({ item, onViewProfile }: { item: Babysitter; onViewProfile: (id: number) => void }) => {
  return (
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
            <Text style={styles.locationText}>{item.location}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="time-outline" size={13} color="#886BC1" />
            <Text style={styles.priceText}>${item.hourlyRate}/hora</Text>
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
};

// --- COMPONENTE PRINCIPAL ---
export default function HomeScreen({
  userName,
  onViewProfile,
  onNavigate,
}: HomeScreenProps) {
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("Disponibles");
  const [babysitters, setBabysitters] = useState<Babysitter[]>([]);
  const [loading, setLoading] = useState(true);

  
  const fetchBabysitters = async () => {
  try {
    setLoading(true);
    const response = await fetch(ENDPOINTS.get_nineras);
    const data = await response.json();

    if (!response.ok) {
      // Si el backend falla, esto nos dirá por qué en la terminal
      console.log("Error del servidor:", data);
      throw new Error("Fallo en la respuesta del servidor");
    }

    const mappedData = data.map((item: any) => ({
      id: item.id,
      // Usamos encadenamiento opcional ?. para evitar que la app explote
      name: item.persona ? `${item.persona.nombre} ${item.persona.apellido}` : 'Niñera sin nombre',
      photo: item.persona?.foto_url || "https://via.placeholder.com/150",
      rating: 5.0, 
      hourlyRate: item.tarifa || 0,
      experience: item.experiencia || "Sin experiencia",
      location: item.persona?.ubicacion || "Ubicación no disponible",
      isOnline: true,
      isAvailable: true,
      certified: item.verificada || false,
      distanceKm: 0,
    }));

    setBabysitters(mappedData);
  } catch (error: any) {
    console.error("DETALLE ERROR FRONTEND:", error);
    Alert.alert("Error", "No se pudieron cargar las niñeras. Revisa la terminal.");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchBabysitters();
  }, []);

  const filteredBabysitters = useMemo(() => {
    let result = [...babysitters];

    if (searchText.trim()) {
      const text = searchText.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(text) ||
          item.location.toLowerCase().includes(text)
      );
    }

    switch (selectedFilter) {
      case "Disponibles":
        result = result.filter((item) => item.isAvailable);
        break;
      case "Certificadas":
        result = result.filter((item) => item.certified);
        break;
      case "Mejor valoradas":
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return result;
  }, [babysitters, searchText, selectedFilter]);

  const renderHeader = () => (
    <LinearGradient
      colors={["#886BC1", "#FF768A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <Text style={styles.greeting}>Hola, {userName || 'Usuario'} 👋</Text>

      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#A0A0A0" style={styles.searchIcon} />
        <TextInput
          placeholder="Buscar niñera..."
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
            style={[styles.filterChip, selectedFilter === filter && styles.filterChipActive]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={styles.filterText}>{filter}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity 
          style={styles.filterIconButton}
          onPress={() => setSelectedFilter("Mejor valoradas")}
        >
          <MaterialIcons name="tune" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#886BC1" />
            <Text style={styles.loaderText}>Cargando niñeras...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBabysitters}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <BabysitterCard item={item} onViewProfile={onViewProfile} />
            )}
            ListHeaderComponent={
              <View>
                {renderHeader()}
                <View style={styles.content}>
                  <Text style={styles.sectionTitle}>Niñeras disponibles</Text>
                </View>
              </View>
            }
            ListFooterComponent={<View style={{ height: 100 }} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onRefresh={fetchBabysitters}
            refreshing={loading}
          />
        )}

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={22} color="#886BC1" />
            <Text style={[styles.navText, { color: "#886BC1" }]}>Inicio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("bookings")}>
            <Ionicons name="time-outline" size={22} color="#B0B0B0" />
            <Text style={styles.navText}>Reservas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("chat")}>
            <View style={styles.chatIconWrapper}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#B0B0B0" />
              <View style={styles.notificationDot} />
            </View>
            <Text style={styles.navText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("profile")}>
            <Ionicons name="person-outline" size={22} color="#B0B0B0" />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  listContent: {
    paddingBottom: 0,
  },
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
    position: "relative",
    paddingLeft: 42,
    paddingRight: 14,
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    top: 16,
    zIndex: 1,
  },
  searchInput: {
    fontSize: 15,
    color: "#2E2E2E",
  },
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
  filterChipActive: {
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  filterText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2E2E2E",
  },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  cardTop: {
    flexDirection: "row",
    gap: 12,
  },
  imageWrapper: {
    position: "relative",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
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
  cardInfo: {
    flex: 1,
    justifyContent: "center",
  },
  name: {
    color: "#2E2E2E",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  ratingText: {
    marginLeft: 4,
    color: "#2E2E2E",
    fontSize: 14,
    fontWeight: "600",
  },
  experienceText: {
    marginLeft: 6,
    color: "#9A9A9A",
    fontSize: 13,
  },
  locationText: {
    marginLeft: 4,
    color: "#8D8D8D",
    fontSize: 13,
  },
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
  profileButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
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
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  navText: {
    marginTop: 4,
    fontSize: 12,
    color: "#B0B0B0",
  },
  chatIconWrapper: {
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 0,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF768A",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#886BC1',
    fontWeight: '600',
  },
});