import React from 'react';
import type { ImageDropZoneProps } from './ImageDropZone';
type Props = Pick<ImageDropZoneProps, 'children' | 'disabled' | 'onImage' | 'onError'>;
// Browser clipboard events are handled by ImageDropZone.
export default function ChatPasteWrapper({ children }: Props) {
  return <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>{children}</div>;
}
