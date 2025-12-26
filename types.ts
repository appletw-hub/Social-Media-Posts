
export enum PlatformType {
  IG_SQUARE = '1:1',
  IG_STORY = '9:16',
  FB_POST = '4:3',
  X_POST = '16:9'
}

export enum Resolution {
  RES_1K = '1K',
  RES_2K = '2K',
  RES_4K = '4K'
}

export interface GeneratedPost {
  id: string;
  originalUrl: string;
  processedUrl: string;
  prompt: string;
  caption: string;
}

export interface AppState {
  apiKeySelected: boolean;
  isGenerating: boolean;
  statusMessage: string;
  posts: GeneratedPost[];
  settings: {
    platform: PlatformType;
    resolution: Resolution;
    style: string;
    count: number;
    watermark: string;
    watermarkOpacity: number;
    showWatermark: boolean;
  };
}
