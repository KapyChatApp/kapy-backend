export interface LocationDTO{
    latitude:string;                 // Vĩ độ
    longitude:       string;     // Kinh độ
    altitude:               string;   // Độ cao so với mực nước biển (nếu có)
    accuracy: string;                 // Độ chính xác của vĩ độ và kinh độ (mét)
    altitudeAccuracy: string;        // Độ chính xác của độ cao (mét, nếu có)
    heading: string;                 // Hướng di chuyển của thiết bị (độ)
    speed: string;
}

export interface PusherLocationDTO{
    userId:string;
    latitude:string;                 // Vĩ độ
    longitude:       string;     // Kinh độ
    altitude:               string;   // Độ cao so với mực nước biển (nếu có)
    accuracy: string;                 // Độ chính xác của vĩ độ và kinh độ (mét)
    altitudeAccuracy: string;        // Độ chính xác của độ cao (mét, nếu có)
    heading: string;                 // Hướng di chuyển của thiết bị (độ)
    speed: string;
}