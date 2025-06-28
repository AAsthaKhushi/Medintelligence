// Utility functions for prescription data processing, formatting, etc.

export function formatConfidenceLevel(level: 'high' | 'medium' | 'low'): string {
  switch (level) {
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return '';
  }
} 