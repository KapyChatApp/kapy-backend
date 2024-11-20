export interface CreatePointDTO {
  userId: string;
  point: number;
  message: string;
}

export interface EditPointDTO{
    point:number;
    message:string;
}

export interface PointResponseDTO{
    userId:string;
    point:number;
    message:string;
}