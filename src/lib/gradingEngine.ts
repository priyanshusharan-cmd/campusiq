// Campusiq — Grading Logic Engine
import type { AssessmentComponent, GradeScheme, GradeBoundary } from '../types/grading';
import type { Subject } from '../types/subject';

export function getGradeBoundary(scheme: GradeScheme, score: number): GradeBoundary {
  // Sort descending
  const sorted = [...scheme.boundaries].sort((a, b) => b.minMarks - a.minMarks);
  for (const b of sorted) {
    if (score >= b.minMarks) {
      return b;
    }
  }
  return sorted[sorted.length - 1]; // Fallback to lowest grade
}

export function calculateComponentScore(component: AssessmentComponent, useMaxPossible: boolean = false, overrideEarned?: number): number {
  if (component.type === 'standalone') {
    if (overrideEarned !== undefined) {
      return (overrideEarned / component.maxMarks) * component.weight;
    }
    if (component.earnedMarks !== undefined) {
      return (component.earnedMarks / component.maxMarks) * component.weight;
    }
    // If we use max possible for ungraded components
    if (useMaxPossible) {
      return component.weight;
    }
    return 0; // Earned 0 so far
  }

  if (component.type === 'grouped' && component.children) {
    let scores = component.children.map(child => ({
      score: calculateComponentScore(child, useMaxPossible),
      weight: child.weight,
    }));

    if (component.selectionRule === 'best_1') {
      scores = scores.sort((a, b) => b.score - a.score).slice(0, 1);
    } else if (component.selectionRule === 'best_2') {
      scores = scores.sort((a, b) => b.score - a.score).slice(0, 2);
    } else if (component.selectionRule === 'best_3') {
      scores = scores.sort((a, b) => b.score - a.score).slice(0, 3);
    }

    const totalGroupScore = scores.reduce((sum, item) => sum + item.score, 0);
    const totalGroupWeight = scores.reduce((sum, item) => sum + item.weight, 0);

    if (totalGroupWeight === 0) return 0;
    
    // Scale group score by the group's total weight
    return (totalGroupScore / totalGroupWeight) * component.weight;
  }

  return 0;
}

export function calculateTotalSubjectScore(components: AssessmentComponent[], useMaxPossible: boolean = false): number {
  return components.reduce((sum, comp) => sum + calculateComponentScore(comp, useMaxPossible), 0);
}

// -----------------------------------------
// NEW: Simulation & Bounds Calculation
// -----------------------------------------

/**
 * Calculates the total score for a component during simulation.
 * - If the component has `earnedMarks` (completed), uses that.
 * - If not, checks `simulatedMarks` map. If found, uses that.
 * - Otherwise defaults to what's requested by `mode` ('floor' = 0, 'ceiling' = maxMarks).
 */
export function calculateSimulatedComponentScore(
  component: AssessmentComponent, 
  simulatedMarks: Record<string, number>,
  mode: 'floor' | 'simulated' | 'ceiling'
): number {
  if (component.type === 'standalone') {
    if (component.earnedMarks !== undefined) {
      return (component.earnedMarks / component.maxMarks) * component.weight; // Completed
    }
    
    // Pending
    if (mode === 'ceiling') {
      return component.weight; // Assume 100% marks
    }
    
    if (mode === 'simulated') {
      const simVal = simulatedMarks[component.id] !== undefined ? simulatedMarks[component.id] : component.maxMarks;
      return (simVal / component.maxMarks) * component.weight;
    }
    
    // Floor mode (assume 0 for pending)
    return 0;
  }

  if (component.type === 'grouped' && component.children) {
    let scores = component.children.map(child => ({
      score: calculateSimulatedComponentScore(child, simulatedMarks, mode),
      weight: child.weight,
    }));

    if (component.selectionRule === 'best_1') {
      scores = scores.sort((a, b) => b.score - a.score).slice(0, 1);
    } else if (component.selectionRule === 'best_2') {
      scores = scores.sort((a, b) => b.score - a.score).slice(0, 2);
    } else if (component.selectionRule === 'best_3') {
      scores = scores.sort((a, b) => b.score - a.score).slice(0, 3);
    }

    const totalGroupScore = scores.reduce((sum, item) => sum + item.score, 0);
    const totalGroupWeight = scores.reduce((sum, item) => sum + item.weight, 0);

    if (totalGroupWeight === 0) return 0;
    return (totalGroupScore / totalGroupWeight) * component.weight;
  }

  return 0;
}

export function calculateSubjectBounds(components: AssessmentComponent[], simulatedMarks: Record<string, number>) {
  const floor = components.reduce((sum, comp) => sum + calculateSimulatedComponentScore(comp, simulatedMarks, 'floor'), 0);
  const simulated = components.reduce((sum, comp) => sum + calculateSimulatedComponentScore(comp, simulatedMarks, 'simulated'), 0);
  const ceiling = components.reduce((sum, comp) => sum + calculateSimulatedComponentScore(comp, simulatedMarks, 'ceiling'), 0);
  
  return { floor, simulated, ceiling };
}

export function calculateSGPAImpact(
  subjectCredits: number, 
  totalSemesterCredits: number, 
  predictedGradePoints: number,
  maxGradePoints: number = 10
) {
  if (totalSemesterCredits === 0) return { predictedContribution: 0, lostPoints: 0, maxContribution: 0 };
  
  const maxContribution = (subjectCredits * maxGradePoints) / totalSemesterCredits;
  const predictedContribution = (subjectCredits * predictedGradePoints) / totalSemesterCredits;
  const lostPoints = maxContribution - predictedContribution;
  
  return {
    predictedContribution,
    lostPoints,
    maxContribution,
  };
}

// Helper for Legacy Data
export function convertLegacyToComponents(
  cieMarks: (number | undefined)[] = [], 
  aatMarks?: number, 
  labMarks?: (number | undefined)[], 
  settings?: any,
  isLab: boolean = false
): AssessmentComponent[] {
  const components: AssessmentComponent[] = [];
  
  // Extract grading config (fallback to defaults if settings not provided)
  const cieCount = settings ? (isLab ? settings.labCieCount : settings.cieCount) : 3;
  const cieBestOf = settings ? (isLab ? settings.labCieBestOf : settings.cieBestOf) : 2;
  const cieMaxMarks = settings ? (isLab ? settings.labCieMaxMarks : settings.cieMaxMarks) : 20;
  const aatEnabled = settings ? (isLab ? settings.labAatEnabled : settings.aatEnabled) : true;
  const aatMaxMarks = settings ? (isLab ? settings.labAatMaxMarks : settings.aatMaxMarks) : 10;
  const seeMax = settings ? (isLab ? settings.labMaxExternalMarks : settings.maxExternalMarks) : 50;
  
  const finalCieMarks = Array(cieCount).fill(undefined).map((_, i) => cieMarks[i]);
  
  components.push({
    id: 'legacy-cie',
    name: `CIE (Best ${cieBestOf})`,
    type: 'grouped',
    maxMarks: cieMaxMarks * cieBestOf,
    weight: cieMaxMarks * cieBestOf,
    selectionRule: `best_${cieBestOf}` as any,
    children: finalCieMarks.map((mark, i) => ({
      id: `legacy-cie-${i}`,
      name: `CIE ${i + 1}`,
      type: 'standalone',
      maxMarks: cieMaxMarks,
      weight: cieMaxMarks, // Inside group, weight is proportional
      earnedMarks: mark,
    })),
  });

  if (aatEnabled) {
    components.push({
      id: 'legacy-aat',
      name: 'AAT / Assignment',
      type: 'standalone',
      maxMarks: aatMaxMarks,
      weight: aatMaxMarks,
      earnedMarks: aatMarks,
    });
  }

  if (isLab || (labMarks && labMarks.length > 0)) {
    const finalLabMarks = (labMarks && labMarks.length > 0) ? labMarks : [undefined];
    const labComponentMarks = settings ? settings.labComponentMarks : 25;
    components.push({
      id: 'legacy-lab',
      name: 'Lab Internal',
      type: 'standalone',
      maxMarks: labComponentMarks,
      weight: labComponentMarks,
      earnedMarks: finalLabMarks[0],
    });
  }

  // Add dummy uncompleted SEE
  components.push({
    id: 'legacy-see',
    name: 'Semester End Exam',
    type: 'standalone',
    maxMarks: seeMax,
    weight: seeMax,
  });

  return components;
}

// Predefined Semester Templates (Abstracted generic models for Semester Wizard)
export const SEMESTER_TEMPLATES = [
  {
    id: 'template-eng-sem4',
    name: 'Engineering Semester (Type A)',
    totalCredits: 22,
    generateSubjects: (semesterId: string): Partial<Subject>[] => {
      const createTheoryA = (): AssessmentComponent[] => [
        {
          id: 'cie_group', name: 'CIE', type: 'grouped', maxMarks: 60, weight: 40, selectionRule: 'best_2',
          children: [
            { id: 'cie1', name: 'CIE 1', type: 'standalone', maxMarks: 50, weight: 20 },
            { id: 'cie2', name: 'CIE 2', type: 'standalone', maxMarks: 50, weight: 20 },
            { id: 'cie3', name: 'CIE 3', type: 'standalone', maxMarks: 50, weight: 20 },
          ]
        },
        { id: 'aat', name: 'AAT', type: 'standalone', maxMarks: 10, weight: 10 },
        { id: 'see', name: 'Final Exam', type: 'standalone', maxMarks: 100, weight: 50 },
      ];

      const createIntegrated = (): AssessmentComponent[] => [
        {
          id: 'cie_group', name: 'CIE', type: 'grouped', maxMarks: 30, weight: 20, selectionRule: 'best_2',
          children: [
            { id: 'cie1', name: 'CIE 1', type: 'standalone', maxMarks: 50, weight: 10 },
            { id: 'cie2', name: 'CIE 2', type: 'standalone', maxMarks: 50, weight: 10 },
            { id: 'cie3', name: 'CIE 3', type: 'standalone', maxMarks: 50, weight: 10 },
          ]
        },
        { id: 'aat', name: 'AAT', type: 'standalone', maxMarks: 5, weight: 5 },
        { id: 'lab', name: 'Lab Internal', type: 'standalone', maxMarks: 25, weight: 25 },
        { id: 'see', name: 'Final Exam', type: 'standalone', maxMarks: 100, weight: 50 },
      ];

      return [
        { name: 'Core Subject 1', code: 'CS1', credits: 4, type: 'theory', color: '#4F46E5', components: createIntegrated(), semesterId },
        { name: 'Core Subject 2', code: 'CS2', credits: 4, type: 'theory', color: '#10B981', components: createIntegrated(), semesterId },
        { name: 'Elective A', code: 'EA1', credits: 3, type: 'theory', color: '#F59E0B', components: createTheoryA(), semesterId },
        { name: 'Elective B', code: 'EB1', credits: 3, type: 'theory', color: '#EC4899', components: createTheoryA(), semesterId },
      ];
    }
  },
  {
    id: 'template-eng-sem1',
    name: 'Standard First Year (Type B)',
    totalCredits: 20,
    generateSubjects: (semesterId: string): Partial<Subject>[] => {
      const standardComps = (): AssessmentComponent[] => [
        { id: 'internal', name: 'Internal Marks', type: 'standalone', maxMarks: 50, weight: 50 },
        { id: 'see', name: 'External Exam', type: 'standalone', maxMarks: 100, weight: 50 },
      ];

      return [
        { name: 'Mathematics I', code: 'MATH1', credits: 4, type: 'theory', color: '#3B82F6', components: standardComps(), semesterId },
        { name: 'Physics I', code: 'PHY1', credits: 4, type: 'theory', color: '#EF4444', components: standardComps(), semesterId },
        { name: 'Computer Science Basics', code: 'CSB', credits: 4, type: 'theory', color: '#8B5CF6', components: standardComps(), semesterId },
      ];
    }
  }
];
