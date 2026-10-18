import React, { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { useWindowDimensions } from '@/platform/dimensions';

const BUTTON_SIZE = 60;
const BOTTOM = 90;

// Same circular sparkle button, size, color, placement, and drag-to-edge
// interaction as the mobile app. Browser demo access does not require billing.
export default function FloatingAIButton() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const [position, setPosition] = useState({ x: 20, y: Math.max(10, height - BUTTON_SIZE - BOTTOM) });
  const drag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const suppressClick = useRef(false);
  const maxX = Math.max(10, width - BUTTON_SIZE - 10);
  const maxY = Math.max(10, height - BUTTON_SIZE - BOTTOM);
  useEffect(() => {
    setPosition(p => ({ x: Math.min(p.x, maxX), y: Math.min(p.y, maxY) }));
  }, [maxX, maxY]);
  const open = () => router.push('/campus-ai');
  return <button type="button" aria-label="Open CampusIQ assistant"
    style={{ position: 'absolute', top: 0, left: 0, width: BUTTON_SIZE, height: BUTTON_SIZE, border: 0, borderRadius: '50%', backgroundColor: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: dragging ? 'grabbing' : 'pointer', touchAction: 'none', zIndex: 9999, boxShadow: '0 4px 10px #0005', transform: `translate(${position.x}px, ${position.y}px) scale(${dragging ? 0.9 : 1})`, transition: dragging ? 'none' : 'transform 180ms ease-out' }}
    onPointerDown={e => {
      suppressClick.current = false;
      drag.current = { x: e.clientX, y: e.clientY, startX: position.x, startY: position.y };
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
    }}
    onPointerMove={e => {
      const start = drag.current;
      if (!start) return;
      setPosition({ x: Math.max(10, Math.min(maxX, start.startX + e.clientX - start.x)), y: Math.max(10, Math.min(maxY, start.startY + e.clientY - start.y)) });
    }}
    onPointerUp={e => {
      const start = drag.current;
      drag.current = null;
      setDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (!start) return;
      suppressClick.current = Math.abs(e.clientX - start.x) >= 5 || Math.abs(e.clientY - start.y) >= 5;
      if (suppressClick.current) setPosition(p => ({ ...p, x: p.x < (width - BUTTON_SIZE) / 2 ? 10 : maxX }));
    }}
    onPointerCancel={() => { drag.current = null; setDragging(false); }}
    onClick={e => { if (e.detail === 0 || !suppressClick.current) open(); suppressClick.current = false; }}
  ><Ionicons name="sparkles" size={28} color={colors.white} /></button>;
}
