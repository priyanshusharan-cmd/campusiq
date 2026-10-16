import { Dimensions as BrowserDimensions, useWindowDimensions as useBrowserDimensions } from 'react-native';

import { APP_WIDTH } from './webLayout';
export const Dimensions = {
  get(name: 'window' | 'screen') {
    const size = BrowserDimensions.get(name);
    return { ...size, width: Math.min(size.width, APP_WIDTH) };
  },
};
export function useWindowDimensions() {
  const size = useBrowserDimensions();
  return { ...size, width: Math.min(size.width, APP_WIDTH) };
}
