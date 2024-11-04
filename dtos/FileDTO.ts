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