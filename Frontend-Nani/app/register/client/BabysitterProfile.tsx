// import {
//   Feather,
//   FontAwesome,
//   Ionicons,
//   MaterialIcons,
// } from "@expo/vector-icons";
// import React, { useMemo } from "react";
// import {
//   Alert,
//   Image,
//   SafeAreaView,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// type Review = {
//   id: number;
//   name: string;
//   rating: number;
//   date: string;
//   comment: string;
// };

// type AvailabilitySlot = {
//   label: string;
//   time: string;
//   available: boolean;
// };

// type ReservedDate = {
//   id: number;
//   day: string;
//   time: string;
//   status: string;
// };

// type Babysitter = {
//   id: number;
//   name: string;
//   photo: string;
//   rating: number;
//   reviews: number;
//   hourlyRate: number;
//   experience: string;
//   location: string;
//   about: string;
//   verified: boolean;
//   skills: string[];
//   certifications: string[];
//   availability: AvailabilitySlot[];
//   reservedDates: ReservedDate[];
//   reviewsList: Review[];
// };

// interface BabysitterProfileProps {
//   babysitterId: number;
//   onBack: () => void;
//   onBook: (id: number) => void;
// }

// export default function BabysitterProfile({
//   babysitterId,
//   onBack,
//   onBook,
// }: BabysitterProfileProps) {
//   /* =========================================================
//      PARTE IMPORTANTE 1:
//      AQUÍ ESTÁ LA DATA DE EJEMPLO.
//      LUEGO ESTO LO PUEDES TRAER DE UNA API.
//      ========================================================= */
//   const babysitters: Babysitter[] = [
//     {
//       id: 1,
//       name: "María González",
//       photo:
//         "https://images.unsplash.com/photo-1584446456661-1039ed1a39d7?w=800&h=800&fit=crop",
//       rating: 4.9,
//       reviews: 127,
//       hourlyRate: 15,
//       experience: "5 años",
//       location: "Centro, Ciudad",
//       about:
//         "Soy una niñera profesional con amplia experiencia en el cuidado de niños de todas las edades. Me encanta crear un ambiente seguro y divertido para los pequeños.",
//       verified: true,
//       skills: [
//         "Primeros auxilios",
//         "Educación infantil",
//         "Cocina saludable",
//         "Bilingüe",
//       ],
//       certifications: [
//         "Certificada en RCP",
//         "Curso de primeros auxilios",
//         "Pedagogía infantil",
//       ],
//       availability: [
//         {
//           label: "Lunes - Viernes",
//           time: "8:00 AM - 6:00 PM",
//           available: true,
//         },
//         { label: "Sábados", time: "9:00 AM - 2:00 PM", available: true },
//         { label: "Domingos", time: "No disponible", available: false },
//       ],
//       reservedDates: [
//         {
//           id: 1,
//           day: "Sábado, 15 Feb",
//           time: "2:00 PM - 6:00 PM",
//           status: "Reservado",
//         },
//         {
//           id: 2,
//           day: "Miércoles, 19 Feb",
//           time: "3:00 PM - 7:00 PM",
//           status: "Reservado",
//         },
//         {
//           id: 3,
//           day: "Viernes, 21 Feb",
//           time: "10:00 AM - 2:00 PM",
//           status: "Reservado",
//         },
//       ],
//       reviewsList: [
//         {
//           id: 1,
//           name: "Laura Pérez",
//           rating: 5,
//           date: "Hace 2 días",
//           comment:
//             "Excelente profesional, mis hijos la adoran. Muy responsable y puntual.",
//         },
//         {
//           id: 2,
//           name: "Carlos Mendoza",
//           rating: 5,
//           date: "Hace 1 semana",
//           comment: "María es increíble con los niños. Totalmente recomendada.",
//         },
//         {
//           id: 3,
//           name: "Ana Torres",
//           rating: 4,
//           date: "Hace 2 semanas",
//           comment:
//             "Muy buena experiencia, siempre mantiene informados a los padres.",
//         },
//       ],
//     },
//     {
//       id: 2,
//       name: "Ana Rodríguez",
//       photo:
//         "https://images.unsplash.com/photo-1565310561974-f2dc282230d9?w=800&h=800&fit=crop",
//       rating: 4.8,
//       reviews: 98,
//       hourlyRate: 18,
//       experience: "3 años",
//       location: "Norte, Ciudad",
//       about:
//         "Me especializo en el cuidado respetuoso y responsable de niños pequeños. Soy muy paciente y organizada, y me gusta mantener una comunicación constante con los padres.",
//       verified: true,
//       skills: [
//         "Estimulación temprana",
//         "Organización",
//         "Apoyo escolar",
//         "Manualidades",
//       ],
//       certifications: [
//         "Curso de cuidado infantil",
//         "Certificación en primeros auxilios",
//       ],
//       availability: [
//         {
//           label: "Lunes - Viernes",
//           time: "7:00 AM - 5:00 PM",
//           available: true,
//         },
//         { label: "Sábados", time: "8:00 AM - 1:00 PM", available: true },
//         { label: "Domingos", time: "No disponible", available: false },
//       ],
//       reservedDates: [
//         {
//           id: 1,
//           day: "Martes, 18 Feb",
//           time: "1:00 PM - 5:00 PM",
//           status: "Reservado",
//         },
//         {
//           id: 2,
//           day: "Jueves, 20 Feb",
//           time: "9:00 AM - 12:00 PM",
//           status: "Reservado",
//         },
//       ],
//       reviewsList: [
//         {
//           id: 1,
//           name: "Marcos López",
//           rating: 5,
//           date: "Hace 3 días",
//           comment: "Muy amable y puntual. Excelente trato con mi hija.",
//         },
//         {
//           id: 2,
//           name: "Daniela Cruz",
//           rating: 4,
//           date: "Hace 6 días",
//           comment: "Muy buena niñera, bastante responsable.",
//         },
//       ],
//     },
//     {
//       id: 3,
//       name: "Sofía Martínez",
//       photo:
//         "https://images.unsplash.com/photo-1668752741330-8adc5cef7485?w=800&h=800&fit=crop",
//       rating: 5.0,
//       reviews: 152,
//       hourlyRate: 20,
//       experience: "7 años",
//       location: "Sur, Ciudad",
//       about:
//         "Tengo amplia experiencia cuidando niños de distintas edades. Me enfoco en seguridad, actividades educativas y acompañamiento afectivo.",
//       verified: true,
//       skills: [
//         "Primeros auxilios",
//         "Apoyo educativo",
//         "Cocina infantil",
//         "Bilingüe",
//       ],
//       certifications: [
//         "RCP pediátrico",
//         "Curso avanzado de primeros auxilios",
//         "Diplomado en atención infantil",
//       ],
//       availability: [
//         {
//           label: "Lunes - Viernes",
//           time: "10:00 AM - 7:00 PM",
//           available: true,
//         },
//         { label: "Sábados", time: "Disponible", available: true },
//         { label: "Domingos", time: "Disponible con reserva", available: true },
//       ],
//       reservedDates: [
//         {
//           id: 1,
//           day: "Lunes, 17 Feb",
//           time: "4:00 PM - 8:00 PM",
//           status: "Reservado",
//         },
//       ],
//       reviewsList: [
//         {
//           id: 1,
//           name: "Paola Gómez",
//           rating: 5,
//           date: "Hace 1 día",
//           comment: "La mejor experiencia que hemos tenido. Muy recomendada.",
//         },
//         {
//           id: 2,
//           name: "José Valladares",
//           rating: 5,
//           date: "Hace 5 días",
//           comment: "Excelente profesionalismo y mucha paciencia.",
//         },
//       ],
//     },
//   ];

//   /* =========================================================
//      PARTE IMPORTANTE 2:
//      AQUÍ SE BUSCA LA NIÑERA POR SU ID.
//      ESTO ES LO QUE HACE EL PERFIL DINÁMICO.
//      ========================================================= */
//   const babysitter = useMemo(() => {
//     return babysitters.find((item) => item.id === babysitterId);
//   }, [babysitterId]);

//   if (!babysitter) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <StatusBar barStyle="dark-content" />
//         <View style={styles.notFoundContainer}>
//           <Text style={styles.notFoundTitle}>Niñera no encontrada</Text>
//           <Text style={styles.notFoundText}>
//             No se encontró información para el perfil solicitado.
//           </Text>

//           <TouchableOpacity style={styles.backButtonAlone} onPress={onBack}>
//             <Text style={styles.backButtonAloneText}>Volver</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const handleShare = () => {
//     Alert.alert("Compartir", `Compartir perfil de ${babysitter.name}`);
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="light-content" />

//       <View style={styles.container}>
//         <ScrollView
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.scrollContent}
//         >
//           {/* Header Image */}
//           <View style={styles.imageHeader}>
//             <Image
//               source={{ uri: babysitter.photo }}
//               style={styles.headerImage}
//             />

//             <View style={styles.imageOverlay} />

//             <TouchableOpacity style={styles.topLeftButton} onPress={onBack}>
//               <Ionicons name="arrow-back" size={22} color="#2E2E2E" />
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.topRightButton}
//               onPress={handleShare}
//             >
//               <Feather name="share-2" size={20} color="#2E2E2E" />
//             </TouchableOpacity>
//           </View>

//           {/* Profile Info */}
//           <View style={styles.profileWrapper}>
//             <View style={styles.profileCard}>
//               <View style={styles.profileTopRow}>
//                 <View style={{ flex: 1, paddingRight: 12 }}>
//                   <Text style={styles.profileName}>{babysitter.name}</Text>

//                   <View style={styles.infoRow}>
//                     <FontAwesome name="star" size={14} color="#FF768A" />
//                     <Text style={styles.ratingValue}>{babysitter.rating}</Text>
//                     <Text style={styles.reviewsText}>
//                       ({babysitter.reviews} reseñas)
//                     </Text>
//                   </View>

//                   <View style={styles.infoRow}>
//                     <Ionicons
//                       name="location-outline"
//                       size={15}
//                       color="#8A8A8A"
//                     />
//                     <Text style={styles.locationValue}>
//                       {babysitter.location}
//                     </Text>
//                   </View>
//                 </View>

//                 <View style={styles.priceBox}>
//                   <Text style={styles.priceValue}>
//                     ${babysitter.hourlyRate}
//                   </Text>
//                   <Text style={styles.priceLabel}>por hora</Text>
//                 </View>
//               </View>

//               <View style={styles.badgesRow}>
//                 {babysitter.verified && (
//                   <View style={styles.badge}>
//                     <MaterialIcons
//                       name="verified-user"
//                       size={16}
//                       color="#886BC1"
//                     />
//                     <Text style={styles.badgeText}>Verificada</Text>
//                   </View>
//                 )}

//                 <View style={styles.badge}>
//                   <Ionicons name="ribbon-outline" size={16} color="#886BC1" />
//                   <Text style={styles.badgeText}>
//                     {babysitter.experience} exp.
//                   </Text>
//                 </View>
//               </View>
//             </View>
//           </View>

//           {/* About */}
//           <View style={styles.sectionContainer}>
//             <View style={styles.sectionCard}>
//               <Text style={styles.sectionTitle}>Sobre mí</Text>
//               <Text style={styles.aboutText}>{babysitter.about}</Text>
//             </View>
//           </View>

//           {/* Skills */}
//           <View style={styles.sectionContainer}>
//             <View style={styles.sectionCard}>
//               <Text style={styles.sectionTitle}>Habilidades</Text>

//               <View style={styles.tagsContainer}>
//                 {babysitter.skills.map((skill) => (
//                   <View key={skill} style={styles.tag}>
//                     <Text style={styles.tagText}>{skill}</Text>
//                   </View>
//                 ))}
//               </View>
//             </View>
//           </View>

//           {/* Certifications */}
//           <View style={styles.sectionContainer}>
//             <View style={styles.sectionCard}>
//               <Text style={styles.sectionTitle}>Certificaciones</Text>

//               {babysitter.certifications.map((cert) => (
//                 <View key={cert} style={styles.certRow}>
//                   <Ionicons name="checkmark-circle" size={20} color="#FF768A" />
//                   <Text style={styles.certText}>{cert}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>

//           {/* Availability */}
//           <View style={styles.sectionContainer}>
//             <View style={styles.sectionCard}>
//               <Text style={styles.sectionTitle}>Disponibilidad</Text>

//               <Text style={styles.subSectionTitle}>Horarios disponibles</Text>

//               {babysitter.availability.map((item, index) => (
//                 <View
//                   key={`${item.label}-${index}`}
//                   style={[
//                     styles.availabilityRow,
//                     index !== babysitter.availability.length - 1 &&
//                       styles.rowBorder,
//                   ]}
//                 >
//                   <Text style={styles.availabilityLabel}>{item.label}</Text>
//                   <Text
//                     style={[
//                       styles.availabilityTime,
//                       !item.available && styles.unavailableText,
//                     ]}
//                   >
//                     {item.time}
//                   </Text>
//                 </View>
//               ))}

//               <Text style={[styles.subSectionTitle, { marginTop: 20 }]}>
//                 Próximas reservas
//               </Text>

//               {babysitter.reservedDates.map((item) => (
//                 <View key={item.id} style={styles.reservedCard}>
//                   <View>
//                     <Text style={styles.reservedDay}>{item.day}</Text>
//                     <Text style={styles.reservedTime}>{item.time}</Text>
//                   </View>

//                   <View style={styles.reservedBadge}>
//                     <Text style={styles.reservedBadgeText}>{item.status}</Text>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           </View>

//           {/* Reviews */}
//           <View style={styles.sectionContainer}>
//             <View style={styles.sectionCard}>
//               <Text style={styles.sectionTitle}>Reseñas</Text>

//               {babysitter.reviewsList.map((review, index) => (
//                 <View
//                   key={review.id}
//                   style={[
//                     styles.reviewItem,
//                     index !== babysitter.reviewsList.length - 1 &&
//                       styles.reviewBorder,
//                   ]}
//                 >
//                   <View style={styles.reviewTop}>
//                     <Text style={styles.reviewName}>{review.name}</Text>

//                     <View style={styles.reviewStars}>
//                       {Array.from({ length: review.rating }).map((_, i) => (
//                         <FontAwesome
//                           key={i}
//                           name="star"
//                           size={12}
//                           color="#FF768A"
//                         />
//                       ))}
//                     </View>
//                   </View>

//                   <Text style={styles.reviewComment}>{review.comment}</Text>
//                   <Text style={styles.reviewDate}>{review.date}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>

//           <View style={{ height: 110 }} />
//         </ScrollView>

//         {/* Bottom Button */}
//         <View style={styles.bottomAction}>
//           <TouchableOpacity
//             style={styles.bookButton}
//             onPress={() => onBook(babysitter.id)}
//             activeOpacity={0.85}
//           >
//             <Text style={styles.bookButtonText}>Contratar ahora</Text>
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
//   scrollContent: {
//     paddingBottom: 0,
//   },
//   imageHeader: {
//     height: 260,
//     position: "relative",
//   },
//   headerImage: {
//     width: "100%",
//     height: "100%",
//   },
//   imageOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(0,0,0,0.28)",
//   },
//   topLeftButton: {
//     position: "absolute",
//     top: 20,
//     left: 16,
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//     backgroundColor: "rgba(255,255,255,0.92)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   topRightButton: {
//     position: "absolute",
//     top: 20,
//     right: 16,
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//     backgroundColor: "rgba(255,255,255,0.92)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   profileWrapper: {
//     marginTop: -28,
//     paddingHorizontal: 16,
//   },
//   profileCard: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 24,
//     padding: 18,
//     shadowColor: "#000",
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   profileTopRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 14,
//   },
//   profileName: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: "#2E2E2E",
//     marginBottom: 8,
//   },
//   infoRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 6,
//   },
//   ratingValue: {
//     marginLeft: 6,
//     color: "#2E2E2E",
//     fontSize: 15,
//     fontWeight: "600",
//   },
//   reviewsText: {
//     marginLeft: 6,
//     color: "#9A9A9A",
//     fontSize: 13,
//   },
//   locationValue: {
//     marginLeft: 6,
//     color: "#8A8A8A",
//     fontSize: 14,
//   },
//   priceBox: {
//     alignItems: "flex-end",
//     justifyContent: "center",
//   },
//   priceValue: {
//     color: "#886BC1",
//     fontSize: 28,
//     fontWeight: "700",
//   },
//   priceLabel: {
//     color: "#8A8A8A",
//     fontSize: 13,
//   },
//   badgesRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 10,
//   },
//   badge: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F6D9F1",
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 999,
//   },
//   badgeText: {
//     marginLeft: 8,
//     color: "#2E2E2E",
//     fontSize: 13,
//     fontWeight: "500",
//   },
//   sectionContainer: {
//     paddingHorizontal: 16,
//     marginTop: 16,
//   },
//   sectionCard: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 20,
//     padding: 18,
//   },
//   sectionTitle: {
//     fontSize: 19,
//     fontWeight: "700",
//     color: "#2E2E2E",
//     marginBottom: 14,
//   },
//   aboutText: {
//     color: "#666666",
//     fontSize: 14,
//     lineHeight: 22,
//   },
//   tagsContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 10,
//   },
//   tag: {
//     backgroundColor: "#F6D9F1",
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 999,
//   },
//   tagText: {
//     color: "#2E2E2E",
//     fontSize: 13,
//   },
//   certRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 14,
//   },
//   certText: {
//     marginLeft: 10,
//     color: "#555555",
//     fontSize: 14,
//     flex: 1,
//   },
//   subSectionTitle: {
//     fontSize: 13,
//     color: "#8A8A8A",
//     marginBottom: 12,
//   },
//   availabilityRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 10,
//   },
//   rowBorder: {
//     borderBottomWidth: 1,
//     borderBottomColor: "#EFEFEF",
//   },
//   availabilityLabel: {
//     color: "#666666",
//     fontSize: 14,
//   },
//   availabilityTime: {
//     color: "#886BC1",
//     fontSize: 14,
//     fontWeight: "500",
//   },
//   unavailableText: {
//     color: "#B0B0B0",
//   },
//   reservedCard: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     backgroundColor: "#FFF1F3",
//     borderWidth: 1,
//     borderColor: "#FFDADF",
//     borderRadius: 14,
//     padding: 14,
//     marginBottom: 12,
//   },
//   reservedDay: {
//     color: "#2E2E2E",
//     fontSize: 14,
//     marginBottom: 4,
//   },
//   reservedTime: {
//     color: "#D95B70",
//     fontSize: 13,
//   },
//   reservedBadge: {
//     backgroundColor: "#FFDADF",
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 999,
//   },
//   reservedBadgeText: {
//     color: "#D95B70",
//     fontSize: 11,
//     fontWeight: "600",
//   },
//   reviewItem: {
//     paddingVertical: 12,
//   },
//   reviewBorder: {
//     borderBottomWidth: 1,
//     borderBottomColor: "#F1F1F1",
//   },
//   reviewTop: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 8,
//     alignItems: "center",
//   },
//   reviewName: {
//     color: "#2E2E2E",
//     fontSize: 15,
//     fontWeight: "600",
//   },
//   reviewStars: {
//     flexDirection: "row",
//     gap: 3,
//   },
//   reviewComment: {
//     color: "#666666",
//     fontSize: 13,
//     lineHeight: 20,
//     marginBottom: 6,
//   },
//   reviewDate: {
//     color: "#B0B0B0",
//     fontSize: 12,
//   },
//   bottomAction: {
//     position: "absolute",
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: "#FFFFFF",
//     borderTopWidth: 1,
//     borderTopColor: "#F0F0F0",
//     paddingHorizontal: 16,
//     paddingTop: 12,
//     paddingBottom: 18,
//   },
//   bookButton: {
//     backgroundColor: "#FF768A",
//     borderRadius: 18,
//     paddingVertical: 16,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   bookButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   notFoundContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 24,
//   },
//   notFoundTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: "#2E2E2E",
//     marginBottom: 10,
//   },
//   notFoundText: {
//     fontSize: 14,
//     color: "#7A7A7A",
//     textAlign: "center",
//     marginBottom: 20,
//   },
//   backButtonAlone: {
//     backgroundColor: "#886BC1",
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 14,
//   },
//   backButtonAloneText: {
//     color: "#FFFFFF",
//     fontWeight: "600",
//   },
// });

// import {
//   Feather,
//   FontAwesome,
//   Ionicons,
//   MaterialIcons,
// } from "@expo/vector-icons";
// import React, { useMemo } from "react";
// import {
//   Alert,
//   Image,
//   SafeAreaView,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import {
//   AvailabilitySlot,
//   babysittersData,
//   ReservedDate,
//   Review,
// } from "../../data/babysitters";

// interface BabysitterProfileProps {
//   babysitterId: number;
//   onBack: () => void;
//   onBook: (id: number) => void;
// }

// export default function BabysitterProfile({
//   babysitterId,
//   onBack,
//   onBook,
// }: BabysitterProfileProps) {
//   const babysitter = useMemo(() => {
//     return babysittersData.find((item) => item.id === babysitterId);
//   }, [babysitterId]);

//   if (!babysitter) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <StatusBar barStyle="dark-content" />
//         <View style={styles.notFoundContainer}>
//           <Text style={styles.notFoundTitle}>Niñera no encontrada</Text>
//           <Text style={styles.notFoundText}>
//             No se encontró información para el perfil solicitado.
//           </Text>

//           <TouchableOpacity style={styles.backButtonAlone} onPress={onBack}>
//             <Text style={styles.backButtonAloneText}>Volver</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   const handleShare = () => {
//     Alert.alert("Compartir", `Compartir perfil de ${babysitter.name}`);
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar barStyle="light-content" />

//       <View style={styles.container}>
//         <ScrollView
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={styles.scrollContent}
//         >
//           <View style={styles.imageHeader}>
//             <Image
//               source={{ uri: babysitter.photo }}
//               style={styles.headerImage}
//             />

//             <View style={styles.imageOverlay} />

//             <TouchableOpacity style={styles.topLeftButton} onPress={onBack}>
//               <Ionicons name="arrow-back" size={22} color="#2E2E2E" />
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.topRightButton}
//               onPress={handleShare}
//             >
//               <Feather name="share-2" size={20} color="#2E2E2E" />
//             </TouchableOpacity>
//           </View>

//           <View style={styles.profileWrapper}>
//             <View style={styles.profileCard}>
//               <View style={styles.profileTopRow}>
//                 <View style={{ flex: 1, paddingRight: 12 }}>
//                   <Text style={styles.profileName}>{babysitter.name}</Text>

//                   <View style={styles.infoRow}>
//                     <FontAwesome name="star" size={14} color="#FF768A" />
//                     <Text style={styles.ratingValue}>{babysitter.rating}</Text>
//                     <Text style={styles.reviewsText}>
//                       ({babysitter.reviews} reseñas)
//                     </Text>
//                   </View>

//                   <View style={styles.infoRow}>
//                     <Ionicons
//                       name="location-outline"
//                       size={15}
//                       color="#8A8A8A"
//                     />
//                     <Text style={styles.locationValue}>
//                       {babysitter.location}
//                     </Text>
//                   </View>
//                 </View>

//                 <View style={styles.priceBox}>
//                   <Text style={styles.priceValue}>
//                     ${babysitter.hourlyRate}
//                   </Text>
//                   <Text style={styles.priceLabel}>por hora</Text>
//                 </View>
//               </View>

//               <View style={styles.badgesRow}>
//                 {babysitter.verified && (
//                   <View style={styles.badge}>
//                     <MaterialIcons
//                       name="verified-user"
//                       size={16}
//                       color="#886BC1"
//                     />
//                     <Text style={styles.badgeText}>Verificada</Text>
//                   </View>
//                 )}

//                 <View style={styles.badge}>
//                   <Ionicons name="ribbon-outline" size={16} color="#886BC1" />
//                   <Text style={styles.badgeText}>
//                     {babysitter.experience} exp.
//                   </Text>
//                 </View>
//               </View>
//             </View>
//           </View>

//           <View style={styles.sectionContainer}>
//             <View style={styles.sectionCard}>
//               <Text style={styles.sectionTitle}>Sobre mí</Text>
//               <Text style={styles.aboutText}>{babysitter.about}</Text>
//             </View>
//           </View>

//           <View style={styles.sectionContainer}>
//             <View style={styles.sectionCard}>
//               <Text style={styles.sectionTitle}>Habilidades</Text>

//               <View style={styles.tagsContainer}>
//                 {babysitter.skills.map((skill: string) => (
//                   <View key={skill} style={styles.tag}>
//                     <Text style={styles.tagText}>{skill}</Text>
//                   </View>
//                 ))}
//               </View>
//             </View>
//           </View>

//           <View style={styles.sectionContainer}>
//             <View style={styles.sectionCard}>
//               <Text style={styles.sectionTitle}>Certificaciones</Text>

//               {babysitter.certifications.map((cert: string) => (
//                 <View key={cert} style={styles.certRow}>
//                   <Ionicons name="checkmark-circle" size={20} color="#FF768A" />
//                   <Text style={styles.certText}>{cert}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>

//           <View style={styles.sectionContainer}>
//             <View style={styles.sectionCard}>
//               <Text style={styles.sectionTitle}>Disponibilidad</Text>

//               <Text style={styles.subSectionTitle}>Horarios disponibles</Text>

//               {babysitter.availability.map(
//                 (item: AvailabilitySlot, index: number) => (
//                   <View
//                     key={`${item.label}-${index}`}
//                     style={[
//                       styles.availabilityRow,
//                       index !== babysitter.availability.length - 1 &&
//                         styles.rowBorder,
//                     ]}
//                   >
//                     <Text style={styles.availabilityLabel}>{item.label}</Text>
//                     <Text
//                       style={[
//                         styles.availabilityTime,
//                         !item.available && styles.unavailableText,
//                       ]}
//                     >
//                       {item.time}
//                     </Text>
//                   </View>
//                 ),
//               )}

//               <Text style={[styles.subSectionTitle, { marginTop: 20 }]}>
//                 Próximas reservas
//               </Text>

//               {babysitter.reservedDates.map((item: ReservedDate) => (
//                 <View key={item.id} style={styles.reservedCard}>
//                   <View>
//                     <Text style={styles.reservedDay}>{item.day}</Text>
//                     <Text style={styles.reservedTime}>{item.time}</Text>
//                   </View>

//                   <View style={styles.reservedBadge}>
//                     <Text style={styles.reservedBadgeText}>{item.status}</Text>
//                   </View>
//                 </View>
//               ))}
//             </View>
//           </View>

//           <View style={styles.sectionContainer}>
//             <View style={styles.sectionCard}>
//               <Text style={styles.sectionTitle}>Reseñas</Text>

//               {babysitter.reviewsList.map((review: Review, index: number) => (
//                 <View
//                   key={review.id}
//                   style={[
//                     styles.reviewItem,
//                     index !== babysitter.reviewsList.length - 1 &&
//                       styles.reviewBorder,
//                   ]}
//                 >
//                   <View style={styles.reviewTop}>
//                     <Text style={styles.reviewName}>{review.name}</Text>

//                     <View style={styles.reviewStars}>
//                       {Array.from({ length: review.rating }).map(
//                         (_: unknown, i: number) => (
//                           <FontAwesome
//                             key={i}
//                             name="star"
//                             size={12}
//                             color="#FF768A"
//                           />
//                         ),
//                       )}
//                     </View>
//                   </View>

//                   <Text style={styles.reviewComment}>{review.comment}</Text>
//                   <Text style={styles.reviewDate}>{review.date}</Text>
//                 </View>
//               ))}
//             </View>
//           </View>

//           <View style={{ height: 110 }} />
//         </ScrollView>

//         <View style={styles.bottomAction}>
//           <TouchableOpacity
//             style={styles.bookButton}
//             onPress={() => onBook(babysitter.id)}
//             activeOpacity={0.85}
//           >
//             <Text style={styles.bookButtonText}>Contratar ahora</Text>
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
//   scrollContent: {
//     paddingBottom: 0,
//   },
//   imageHeader: {
//     height: 260,
//     position: "relative",
//   },
//   headerImage: {
//     width: "100%",
//     height: "100%",
//   },
//   imageOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     backgroundColor: "rgba(0,0,0,0.28)",
//   },
//   topLeftButton: {
//     position: "absolute",
//     top: 20,
//     left: 16,
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//     backgroundColor: "rgba(255,255,255,0.92)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   topRightButton: {
//     position: "absolute",
//     top: 20,
//     right: 16,
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//     backgroundColor: "rgba(255,255,255,0.92)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   profileWrapper: {
//     marginTop: -28,
//     paddingHorizontal: 16,
//   },
//   profileCard: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 24,
//     padding: 18,
//     shadowColor: "#000",
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 5,
//   },
//   profileTopRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 14,
//   },
//   profileName: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: "#2E2E2E",
//     marginBottom: 8,
//   },
//   infoRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 6,
//   },
//   ratingValue: {
//     marginLeft: 6,
//     color: "#2E2E2E",
//     fontSize: 15,
//     fontWeight: "600",
//   },
//   reviewsText: {
//     marginLeft: 6,
//     color: "#9A9A9A",
//     fontSize: 13,
//   },
//   locationValue: {
//     marginLeft: 6,
//     color: "#8A8A8A",
//     fontSize: 14,
//   },
//   priceBox: {
//     alignItems: "flex-end",
//     justifyContent: "center",
//   },
//   priceValue: {
//     color: "#886BC1",
//     fontSize: 28,
//     fontWeight: "700",
//   },
//   priceLabel: {
//     color: "#8A8A8A",
//     fontSize: 13,
//   },
//   badgesRow: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 10,
//   },
//   badge: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: "#F6D9F1",
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 999,
//   },
//   badgeText: {
//     marginLeft: 8,
//     color: "#2E2E2E",
//     fontSize: 13,
//     fontWeight: "500",
//   },
//   sectionContainer: {
//     paddingHorizontal: 16,
//     marginTop: 16,
//   },
//   sectionCard: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 20,
//     padding: 18,
//   },
//   sectionTitle: {
//     fontSize: 19,
//     fontWeight: "700",
//     color: "#2E2E2E",
//     marginBottom: 14,
//   },
//   aboutText: {
//     color: "#666666",
//     fontSize: 14,
//     lineHeight: 22,
//   },
//   tagsContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 10,
//   },
//   tag: {
//     backgroundColor: "#F6D9F1",
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 999,
//   },
//   tagText: {
//     color: "#2E2E2E",
//     fontSize: 13,
//   },
//   certRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 14,
//   },
//   certText: {
//     marginLeft: 10,
//     color: "#555555",
//     fontSize: 14,
//     flex: 1,
//   },
//   subSectionTitle: {
//     fontSize: 13,
//     color: "#8A8A8A",
//     marginBottom: 12,
//   },
//   availabilityRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 10,
//   },
//   rowBorder: {
//     borderBottomWidth: 1,
//     borderBottomColor: "#EFEFEF",
//   },
//   availabilityLabel: {
//     color: "#666666",
//     fontSize: 14,
//   },
//   availabilityTime: {
//     color: "#886BC1",
//     fontSize: 14,
//     fontWeight: "500",
//   },
//   unavailableText: {
//     color: "#B0B0B0",
//   },
//   reservedCard: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     backgroundColor: "#FFF1F3",
//     borderWidth: 1,
//     borderColor: "#FFDADF",
//     borderRadius: 14,
//     padding: 14,
//     marginBottom: 12,
//   },
//   reservedDay: {
//     color: "#2E2E2E",
//     fontSize: 14,
//     marginBottom: 4,
//   },
//   reservedTime: {
//     color: "#D95B70",
//     fontSize: 13,
//   },
//   reservedBadge: {
//     backgroundColor: "#FFDADF",
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 999,
//   },
//   reservedBadgeText: {
//     color: "#D95B70",
//     fontSize: 11,
//     fontWeight: "600",
//   },
//   reviewItem: {
//     paddingVertical: 12,
//   },
//   reviewBorder: {
//     borderBottomWidth: 1,
//     borderBottomColor: "#F1F1F1",
//   },
//   reviewTop: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 8,
//     alignItems: "center",
//   },
//   reviewName: {
//     color: "#2E2E2E",
//     fontSize: 15,
//     fontWeight: "600",
//   },
//   reviewStars: {
//     flexDirection: "row",
//     gap: 3,
//   },
//   reviewComment: {
//     color: "#666666",
//     fontSize: 13,
//     lineHeight: 20,
//     marginBottom: 6,
//   },
//   reviewDate: {
//     color: "#B0B0B0",
//     fontSize: 12,
//   },
//   bottomAction: {
//     position: "absolute",
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: "#FFFFFF",
//     borderTopWidth: 1,
//     borderTopColor: "#F0F0F0",
//     paddingHorizontal: 16,
//     paddingTop: 12,
//     paddingBottom: 18,
//   },
//   bookButton: {
//     backgroundColor: "#FF768A",
//     borderRadius: 18,
//     paddingVertical: 16,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 4,
//   },
//   bookButtonText: {
//     color: "#FFFFFF",
//     fontSize: 16,
//     fontWeight: "700",
//   },
//   notFoundContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 24,
//   },
//   notFoundTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: "#2E2E2E",
//     marginBottom: 10,
//   },
//   notFoundText: {
//     fontSize: 14,
//     color: "#7A7A7A",
//     textAlign: "center",
//     marginBottom: 20,
//   },
//   backButtonAlone: {
//     backgroundColor: "#886BC1",
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 14,
//   },
//   backButtonAloneText: {
//     color: "#FFFFFF",
//     fontWeight: "600",
//   },
// });

import {
  Feather,
  FontAwesome,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { ENDPOINTS } from "../../../constants/apiConfig";

// --- TIPOS ---
type Review = {
  id: number;
  name: string;
  rating: number;
  date: string;
  comment: string;
};

type AvailabilitySlot = {
  label: string;
  time: string;
  available: boolean;
};

type ReservedDate = {
  id: number;
  day: string;
  time: string;
  status: string;
};

type Babysitter = {
  id: number;
  name: string;
  photo: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  experience: string;
  location: string;
  about: string;
  verified: boolean;
  skills: string[];
  certifications: string[];
  availability: AvailabilitySlot[];
  reservedDates: ReservedDate[];
  reviewsList: Review[];
};

export default function BabysitterProfile() {
  const router = useRouter();
  const { babysitterId } = useLocalSearchParams();

  const [babysitter, setBabysitter] = useState<Babysitter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBabysitterDetail = async () => {
      // Corrección: Si no hay ID, apagamos el cargando para mostrar el estado "No encontrada"
      if (!babysitterId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(
          ENDPOINTS.get_detalle_ninera(babysitterId as string),
        );
        const data = await response.json();

        if (response.ok) {
          setBabysitter({
            id: data.id,
            name: `${data.persona?.nombre || "Niñera"} ${data.persona?.apellido || ""}`,
            photo: data.persona?.foto_url || "https://via.placeholder.com/300",
            rating: 5.0,
            reviews: 0,
            hourlyRate: data.tarifa || 0,
            experience: data.experiencia || "Sin experiencia",
            location:
              data.persona?.direccion?.direccion_completa ||
              "Ubicación no disponible",
            about: data.presentacion || "Sin descripción disponible.",
            verified: data.verificada || false,
            skills: data.habilidades?.map((h: any) => h.nombre) || [],
            certifications:
              data.certificaciones?.map((c: any) => c.nombre) || [],
            availability:
              data.disponibilidad?.map((item: any) => ({
                label: item.dia_semana,
                time: `${item.hora_inicio} - ${item.hora_fin}`,
                available: true,
              })) || [],
            reservedDates: [],
            reviewsList: [],
          });
        }
      } catch (error) {
        Alert.alert("Error", "No se pudo conectar con el servidor.");
      } finally {
        setLoading(false);
      }
    };

    fetchBabysitterDetail();
  }, [babysitterId]); // Se ejecutará cada vez que cambie o llegue el ID

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#886BC1" />
        <Text style={styles.loadingText}>Cargando perfil de Nani...</Text>
      </SafeAreaView>
    );
  }

  if (!babysitter) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>Niñera no encontrada</Text>
          <TouchableOpacity
            style={styles.backButtonAlone}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonAloneText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBook = () => {
    router.push({
      pathname: "/register/client/BookingScreen",
      params: {
        babysitterId: babysitter.id,
        name: babysitter.name,
        photo: babysitter.photo,
        hourlyRate: babysitter.hourlyRate,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.imageHeader}>
            <Image
              source={{ uri: babysitter.photo }}
              style={styles.headerImage}
            />
            <View style={styles.imageOverlay} />
            <TouchableOpacity
              style={styles.topLeftButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#2E2E2E" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.topRightButton}
              onPress={() =>
                Alert.alert("Compartir", `Perfil de ${babysitter.name}`)
              }
            >
              <Feather name="share-2" size={20} color="#2E2E2E" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileWrapper}>
            <View style={styles.profileCard}>
              <View style={styles.profileTopRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.profileName}>{babysitter.name}</Text>
                  <View style={styles.infoRow}>
                    <FontAwesome name="star" size={14} color="#FF768A" />
                    <Text style={styles.ratingValue}>{babysitter.rating}</Text>
                    <Text style={styles.reviewsText}>
                      ({babysitter.reviews} reseñas)
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons
                      name="location-outline"
                      size={15}
                      color="#8A8A8A"
                    />
                    <Text style={styles.locationValue} numberOfLines={1}>
                      {babysitter.location}
                    </Text>
                  </View>
                </View>
                <View style={styles.priceBox}>
                  <Text style={styles.priceValue}>
                    L.{babysitter.hourlyRate}
                  </Text>
                  <Text style={styles.priceLabel}>por hora</Text>
                </View>
              </View>

              <View style={styles.badgesRow}>
                {babysitter.verified && (
                  <View style={styles.badge}>
                    <MaterialIcons
                      name="verified-user"
                      size={16}
                      color="#886BC1"
                    />
                    <Text style={styles.badgeText}>Verificada</Text>
                  </View>
                )}
                <View style={styles.badge}>
                  <Ionicons name="ribbon-outline" size={16} color="#886BC1" />
                  <Text style={styles.badgeText}>
                    {babysitter.experience} exp.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Sobre mí</Text>
              <Text style={styles.aboutText}>{babysitter.about}</Text>
            </View>
          </View>

          {babysitter.skills.length > 0 && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Habilidades</Text>
                <View style={styles.tagsContainer}>
                  {babysitter.skills.map((skill) => (
                    <View key={skill} style={styles.tag}>
                      <Text style={styles.tagText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Disponibilidad</Text>
              {babysitter.availability.length > 0 ? (
                babysitter.availability.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.availabilityRow,
                      index !== babysitter.availability.length - 1 &&
                        styles.rowBorder,
                    ]}
                  >
                    <Text style={styles.availabilityLabel}>{item.label}</Text>
                    <Text style={styles.availabilityTime}>{item.time}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  No hay disponibilidad configurada.
                </Text>
              )}
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Próximas Reservas</Text>
              <Text style={styles.emptyText}>
                No tienes reservas agendadas próximamente.
              </Text>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionTitle}>Reseñas</Text>
                <Text style={styles.viewAllText}>Ver todas</Text>
              </View>
              <Text style={styles.emptyText}>
                Esta niñera aún no tiene reseñas. ¡Sé el primero en contratarla!
              </Text>
            </View>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={handleBook}
            activeOpacity={0.85}
          >
            <Text style={styles.bookButtonText}>Solicitar reserva</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAFAFA" },
  centered: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#886BC1", fontWeight: "600" },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 0 },
  imageHeader: { height: 260, position: "relative" },
  headerImage: { width: "100%", height: "100%" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  topLeftButton: {
    position: "absolute",
    top: 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  topRightButton: {
    position: "absolute",
    top: 40,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  profileWrapper: { marginTop: -30, paddingHorizontal: 16 },
  profileCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  profileTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  profileName: { fontSize: 24, fontWeight: "700", color: "#2E2E2E" },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  ratingValue: { marginLeft: 5, fontWeight: "600" },
  reviewsText: { marginLeft: 5, color: "#9A9A9A", fontSize: 13 },
  locationValue: { marginLeft: 5, color: "#8A8A8A", flex: 1 },
  priceBox: { alignItems: "flex-end" },
  priceValue: { color: "#886BC1", fontSize: 26, fontWeight: "800" },
  priceLabel: { color: "#8A8A8A", fontSize: 12 },
  badgesRow: { flexDirection: "row", gap: 10, marginTop: 5 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6D9F1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "600",
    color: "#2E2E2E",
  },
  sectionContainer: { paddingHorizontal: 16, marginTop: 15 },
  sectionCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 18 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  aboutText: { color: "#666", lineHeight: 20 },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: "#F6D9F1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  tagText: { fontSize: 12, color: "#2E2E2E" },
  availabilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  availabilityLabel: { color: "#666" },
  availabilityTime: { color: "#886BC1", fontWeight: "600" },
  emptyText: { color: "#AAA", fontStyle: "italic", marginTop: 5 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAllText: { color: "#886BC1", fontWeight: "600", fontSize: 14 },
  bottomAction: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFF",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  bookButton: {
    backgroundColor: "#FF768A",
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: "center",
  },
  bookButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  notFoundTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  backButtonAlone: {
    backgroundColor: "#886BC1",
    padding: 15,
    borderRadius: 10,
  },
  backButtonAloneText: { color: "#FFF", fontWeight: "600" },
});
