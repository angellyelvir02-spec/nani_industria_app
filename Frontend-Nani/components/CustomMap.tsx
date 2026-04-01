import MapView, { Marker } from 'react-native-maps';
export default function CustomMap({ region }: any) {
  return (
    <MapView style={{ flex: 1, height: 300 }} initialRegion={region}>
      <Marker coordinate={region} />
    </MapView>
  );
}