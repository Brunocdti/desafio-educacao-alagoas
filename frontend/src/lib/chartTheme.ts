/**
 * Paleta inspirada no projeto GRC-FRONT (Indigo/Blue/Emerald/Slate), validada
 * com node scripts/validate_palette.js. Nenhum dos 3 gráficos obrigatórios
 * precisa de mais de uma cor de identidade, então usamos só o azul em todos.
 */
export const CHART = {
  accent: '#3b82f6', // Blue-500
  primary: '#4f46e5', // Indigo-600 (botões/ações)
  grid: '#e2e8f0', // Slate-200
  axis: '#94a3b8', // Slate-400
  textMuted: '#64748b', // Slate-500
  textPrimary: '#0f172a', // Slate-900
  surface: '#ffffff',
  good: '#059669', // Emerald-600 (contraste de texto em fundo branco)
  critical: '#dc2626', // Red-600
} as const;
