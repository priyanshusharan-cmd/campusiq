import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import { readNativePastedImage } from './nativePastedImage';
import type { ImageDropZoneProps } from './ImageDropZone';

type Props = Pick<ImageDropZoneProps, 'children' | 'disabled' | 'onImage' | 'onError'>;
export default function ChatPasteWrapper({ children, disabled, onImage, onError }: Props) {
  const active = useRef(true);
  const blocked = useRef(disabled);
  const request = useRef(0);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => {
    blocked.current = disabled;
    if (disabled) request.current++;
  }, [disabled]);
  if (!requireOptionalNativeModule('ExpoPasteInput')) return <View style={{ flex: 1 }}>{children}</View>;
  const { TextInputWrapper } = require('expo-paste-input') as typeof import('expo-paste-input');
  return <TextInputWrapper style={{ flex: 1 }} onPaste={payload => {
    // The native input inserts text itself. Only media needs an attachment callback.
    if (payload.type !== 'images' || blocked.current) return;
    const id = ++request.current;
    void readNativePastedImage(payload.uris).then(image => {
      if (active.current && !blocked.current && id === request.current) onImage(image);
    }).catch(error => {
      if (active.current && !blocked.current && id === request.current) onError(error instanceof Error ? error.message : 'Could not paste image.');
    });
  }}>{children}</TextInputWrapper>;
}
