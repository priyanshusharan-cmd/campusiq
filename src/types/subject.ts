// Campora — Subject Types

import type { ID, SubjectType } from './common';

export interface Subject {
  id: ID;
  name: string;
  code: string;         // e.g., "CS301"
  shortName: string;    // e.g., "OS"
  faculty: string;
  room: string;
  color: string;        // Hex color
  type: SubjectType;
  credits: number;
  semesterId: ID;
  createdAt: Date;
}

// Auto-generate short name from subject name
export function generateShortName(name: string): string {
  const words = name.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }
  // Take first letter of each significant word
  const significant = words.filter(
    w => !['of', 'and', 'the', 'in', 'for', 'to', 'a', 'an', '&'].includes(w.toLowerCase())
  );
  if (significant.length === 0) return words.map(w => w[0]).join('').toUpperCase();
  return significant.map(w => w[0]).join('').toUpperCase().substring(0, 4);
}
