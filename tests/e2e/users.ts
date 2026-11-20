/** Usuarios de prueba de la base temporal de Playwright (no existen fuera de la prueba). */
export const E2E_USERS = {
  tecnico: { username: 'e2e.tecnico', role: 'TECNICO_OM', displayName: 'Víctor León', password: 'e2e-ui-tecnico-1' },
  jefe: { username: 'e2e.jefe', role: 'JEFE_OM', displayName: 'Jefe Prueba', password: 'e2e-ui-jefe-123' },
} as const;
