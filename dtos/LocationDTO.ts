export interface LocationDTO {
  latitude: number; // Vĩ độ
  longitude: number; // Kinh độ
  altitude: number; // Độ cao so với mực nước biển (nếu có)
  accuracy: number; // Độ chính xác của vĩ độ và kinh độ (mét)
  altitudeAccuracy: number; // Độ chính xác của độ cao (mét, nếu có)
  heading: number; // Hướng di chuyển của thiết bị (độ)
  speed: number;
}

export interface PusherLocationDTO {
  userId: string;
  latitude: number; // Vĩ độ
  longitude: number; // Kinh độ
  altitude: number; // Độ cao so với mực nước biển (nếu có)
  accuracy: number; // Độ chính xác của vĩ độ và kinh độ (mét)
  altitudeAccuracy: number; // Độ chính xác của độ cao (mét, nếu có)
  heading: number; // Hướng di chuyển của thiết bị (độ)
  speed: number;
}
