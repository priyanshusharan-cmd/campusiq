import React from 'react';
import { Drawer as NativeDrawer } from 'react-native-drawer-layout';
import { useWindowDimensions } from './dimensions';

export function Drawer({ open, renderDrawerContent, drawerStyle, style, ...props }: React.ComponentProps<typeof NativeDrawer>) {
  const { width } = useWindowDimensions();
  return <NativeDrawer
    {...props}
    open={open}
    style={[{ overflow: 'hidden' }, style]}
    drawerStyle={[{ width: Math.max(0, Math.min(360, width - 56)) }, drawerStyle]}
    renderDrawerContent={() => open ? renderDrawerContent() : null}
  />;
}
