import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/theme';
import type { ImageDropZoneProps } from './ImageDropZone';
import { readDroppedImage } from './imageDrop.web';

export default function ImageDropZone({ children, disabled, onImage, onError }: ImageDropZoneProps) {
  const theme = useTheme();
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);
  const active = useRef(true);
  const blocked = useRef(disabled);
  const request = useRef(0);
  useEffect(() => { blocked.current = disabled; }, [disabled]);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  useEffect(() => { if (disabled) { request.current++; depth.current = 0; setDragging(false); } }, [disabled]);
  const hasFiles = (event: React.DragEvent) => Array.from(event.dataTransfer.types).includes('Files');
  return <div data-campus-chat="true" style={{ display: 'flex', flex: 1, flexDirection: 'column', minHeight: 0, position: 'relative' }}
    onDragEnter={event => {
      if (!hasFiles(event)) return;
      event.preventDefault(); depth.current++;
      if (!disabled) setDragging(true);
    }}
    onDragOver={event => {
      if (!hasFiles(event)) return;
      event.preventDefault(); event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
    }}
    onDragLeave={event => {
      if (!hasFiles(event)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (!depth.current) setDragging(false);
    }}
    onDrop={event => {
      // Prevent the browser from opening the dropped file instead of attaching it.
      if (!hasFiles(event) && !event.dataTransfer.files.length) return;
      event.preventDefault(); event.stopPropagation(); depth.current = 0; setDragging(false);
      if (disabled) return;
      const id = ++request.current;
      void readDroppedImage(event.dataTransfer.files).then(image => {
        if (active.current && !blocked.current && request.current === id) onImage(image);
      }).catch(error => {
        if (active.current && !blocked.current && request.current === id) onError(error instanceof Error ? error.message : 'Could not attach image.');
      });
    }}>
    <style>{`
      [data-campus-chat] input[aria-label="Message CampusIQ"],
      [data-campus-chat] input[aria-label="Message CampusIQ"]:focus,
      [data-campus-chat] input[aria-label="Message CampusIQ"]:focus-visible {
        outline: none !important;
        box-shadow: none !important;
      }
    `}</style>
    {children}
    {dragging && <div role="status" style={{ position: 'absolute', inset: 12, zIndex: 40, pointerEvents: 'none', border: `2px dashed ${theme.colors.primary}`, borderRadius: 20, background: theme.colors.surface, opacity: 0.96, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, fontFamily: 'Inter_500Medium', color: theme.colors.textPrimary }}>
      <span style={{ fontSize: 17 }}>Drop an image here</span>
      <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>Attach it to your message</span>
    </div>}
  </div>;
}
