export type VisibilitySetting = 'public' | 'private' | 'unlisted';

export interface AudioUploadItem {
  id: string;
  title: string;
  description: string;
  visibility: VisibilitySetting;
  audioUrl: string;
  audioBlob?: Blob;
  mimeType: string;
  fileName: string;
  fileSize: number; // bytes
  duration: number; // seconds
  createdAt: number;
  waveformPeaks: number[];
  tags: string[];
  transcript?: string;
}

export interface AudioUploadFormData {
  file: File | null;
  title: string;
  description: string;
  visibility: VisibilitySetting;
  tags: string[];
}
