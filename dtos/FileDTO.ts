export interface CreateFileDTO{
    fileName: string;
    url: string;
    publicId: string;
    bytes: number;
    width: number;
    height: number;
    format: string;
    type: "Video"|"Image"|"Audio"|"Other";
}

export interface FileResponseDTO{
    _id:string;
    fileName: string;
    url: string;
    bytes: number;
    width: number;
    height: number;
    format: string;
    type: string;
}