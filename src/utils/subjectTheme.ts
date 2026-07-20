import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface SubjectTheme {
  icon: IoniconName;
  color: string;
  bgColor: string;
}

export function getSubjectTheme(name: string = '', code: string = '', isDark: boolean = false, customColor?: string): SubjectTheme {
  const lowerName = name.toLowerCase();
  const lowerCode = code.toLowerCase();

  let themeId = 'default';

  if (lowerName.includes('english') || lowerName.includes('litera') || lowerCode.includes('eng')) themeId = 'language';
  else if (lowerName.includes('math') || lowerName.includes('algebra') || lowerName.includes('calculus') || lowerName.includes('discrete') || lowerCode.includes('mat')) themeId = 'math';
  else if (lowerName.includes('physic') || lowerName.includes('mechanics') || lowerName.includes('thermodynamics') || lowerCode.includes('phy')) themeId = 'physics';
  else if (lowerName.includes('chem') || lowerName.includes('organic') || lowerCode.includes('che')) themeId = 'chemistry';
  else if (lowerName.includes('bio') || lowerName.includes('medic') || lowerName.includes('anatomy') || lowerName.includes('genetics') || lowerName.includes('health') || lowerCode.includes('med')) themeId = 'biology';
  else if (lowerName.includes('lab') || lowerName.includes('practical') || lowerCode.includes('lab')) themeId = 'lab';
  else if (lowerName.includes('program') || lowerName.includes('code') || lowerName.includes('python') || lowerName.includes('java') || lowerName.includes('c++') || lowerCode.includes('cse') || lowerCode.includes('ada')) themeId = 'programming';
  else if (lowerName.includes('softw') || lowerName.includes('agile') || lowerCode.includes('se')) themeId = 'software';
  else if (lowerName.includes('web') || lowerName.includes('app') || lowerName.includes('mobile') || lowerName.includes('frontend') || lowerName.includes('backend') || lowerCode.includes('mad')) themeId = 'mobile';
  else if (lowerName.includes('data') || lowerName.includes('dbms') || lowerName.includes('sql') || lowerCode.includes('db') || lowerCode.includes('ds')) themeId = 'database';
  else if (lowerName.includes('network') || lowerName.includes('operat') || lowerName.includes('cloud') || lowerName.includes('distrib') || lowerCode.includes('os')) themeId = 'os';
  else if (lowerName.includes('secur') || lowerName.includes('crypt') || lowerName.includes('hack') || lowerName.includes('forensic') || lowerCode.includes('sec') || lowerCode.includes('crp')) themeId = 'security';
  else if (lowerName.includes('finan') || lowerName.includes('econ') || lowerName.includes('account') || lowerName.includes('market') || lowerName.includes('busines') || lowerName.includes('manage') || lowerCode.includes('mgt')) themeId = 'finance';
  else if (lowerName.includes('design') || lowerName.includes('art') || lowerName.includes('draw') || lowerName.includes('ui/ux') || lowerName.includes('architect') || lowerCode.includes('des')) themeId = 'design';
  else if (lowerName.includes('sport') || lowerName.includes('physical') || lowerName.includes('gym')) themeId = 'sports';
  else if (lowerName.includes('electron') || lowerName.includes('circuit') || lowerName.includes('signal') || lowerCode.includes('ece') || lowerCode.includes('eee')) themeId = 'electronics';
  else if (lowerName.includes('environ') || lowerName.includes('ecolog') || lowerName.includes('sustain')) themeId = 'environment';
  else if (lowerName.includes('histor') || lowerName.includes('geograph') || lowerName.includes('politi') || lowerName.includes('sociol') || lowerName.includes('psychol') || lowerName.includes('philos') || lowerName.includes('law') || lowerName.includes('ethic')) themeId = 'humanities';
  else if (lowerName.includes('ai') || lowerName.includes('artificial') || lowerName.includes('machine') || lowerName.includes('deep') || lowerName.includes('neural') || lowerName.includes('intelligen')) themeId = 'ai';
  else if (lowerName.includes('nptel') || lowerName.includes('mooc') || lowerName.includes('seminar') || lowerName.includes('project')) themeId = 'general';

  // Define palettes for Light and Dark modes
  // Format: [icon, lightColor, lightBg, darkColor, darkBg]
  const palettes: Record<string, [IoniconName, string, string, string, string]> = {
    language: ['language', '#1A73E8', '#E8F0FE', '#8AB4F8', '#8AB4F826'],
    math: ['calculator', '#681DA8', '#F3E8FF', '#D7AEFB', '#D7AEFB26'],
    physics: ['planet', '#C5221F', '#FCE8E6', '#F28B82', '#F28B8226'],
    chemistry: ['flask', '#00796B', '#E0F2F1', '#80CBC4', '#80CBC426'],
    biology: ['leaf', '#137333', '#E6F4EA', '#81C995', '#81C99526'],
    lab: ['beaker', '#006064', '#E0F7FA', '#24B6F7', '#24B6F726'],
    programming: ['code-slash', '#1A73E8', '#E8F0FE', '#8AB4F8', '#8AB4F826'],
    software: ['settings', '#137333', '#E6F4EA', '#81C995', '#81C99526'],
    mobile: ['phone-portrait', '#006064', '#E0F7FA', '#24B6F7', '#24B6F726'],
    database: ['server', '#B06000', '#FEF7E0', '#FDD663', '#FDD66326'],
    os: ['hardware-chip', '#B06000', '#FEF7E0', '#FDD663', '#FDD66326'],
    security: ['shield-checkmark', '#00796B', '#E0F2F1', '#80CBC4', '#80CBC426'],
    finance: ['trending-up', '#C5221F', '#FCE8E6', '#F28B82', '#F28B8226'],
    design: ['color-palette', '#681DA8', '#F3E8FF', '#D7AEFB', '#D7AEFB26'],
    sports: ['bicycle', '#137333', '#E6F4EA', '#81C995', '#81C99526'],
    general: ['school', '#3C4043', '#F1F3F4', '#DADCE0', '#DADCE026'],
    electronics: ['extension-puzzle', '#C5221F', '#FCE8E6', '#F28B82', '#F28B8226'],
    environment: ['earth', '#137333', '#E6F4EA', '#81C995', '#81C99526'],
    humanities: ['library', '#B06000', '#FEF7E0', '#FDD663', '#FDD66326'],
    ai: ['hardware-chip', '#681DA8', '#F3E8FF', '#D7AEFB', '#D7AEFB26'],
    default: ['book', '#3C4043', '#F1F3F4', '#DADCE0', '#DADCE026'],
  };

  const palette = palettes[themeId] || palettes.default;

  const baseColor = customColor || (isDark ? palette[3] : palette[1]);
  // Use custom color if provided, and generate a 15% opacity version for the background.
  const bgColor = customColor ? `${customColor}26` : (isDark ? palette[4] : palette[2]);

  return {
    icon: palette[0],
    color: baseColor,
    bgColor: bgColor,
  };
}
