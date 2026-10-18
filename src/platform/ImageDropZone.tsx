import React from 'react';
import { View } from 'react-native';
import type { AIImage } from '@/features/ai/services/aiService';

export interface ImageDropZoneProps {
  children: React.ReactNode;
  disabled: boolean;
  onImage: (image: AIImage & { uri: string }) => void;
  onError: (message: string) => void;
}
export default function ImageDropZone({ children }: ImageDropZoneProps) {
  return <View style={{ flex: 1 }}>{children}</View>;
}
