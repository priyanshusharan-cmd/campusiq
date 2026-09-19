// Campora — Constants: Grade Scale (Indian 10-point)

export const GRADE_SCALE = {
  'O':  { point: 10, label: 'Outstanding',   color: '#10B981' },
  'A+': { point: 9,  label: 'Excellent',     color: '#059669' },
  'A':  { point: 8,  label: 'Very Good',     color: '#0EA5E9' },
  'B+': { point: 7,  label: 'Good',          color: '#7C5CFC' },
  'B':  { point: 6,  label: 'Above Average', color: '#F59E0B' },
  'C':  { point: 5,  label: 'Average',       color: '#F97316' },
  'P':  { point: 4,  label: 'Pass',          color: '#EF4444' },
  'F':  { point: 0,  label: 'Fail',          color: '#DC2626' },
} as const;

export const GRADE_LETTERS = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'] as const;
