import React from 'react';
// Browser history handles back navigation without intercepting touch scrolling.
export function SwipeBackWrapper({ children }: { children: React.ReactNode }) { return <>{children}</>; }
