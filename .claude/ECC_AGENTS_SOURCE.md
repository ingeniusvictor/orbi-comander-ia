Agentes copiados de https://github.com/affaan-m/ECC (MIT), carpeta agents/, commit 3f14a103a8694e51c1df9a806217a6d0b5f7a6f7, el 2026-11-19.
Seleccion para ORBI Piloto 17A: diseno (architect, planner, code-explorer), revision (code-reviewer, typescript-reviewer, react-reviewer, database-reviewer, security-reviewer, silent-failure-hunter), pruebas (tdd-guide, e2e-runner) y mantenimiento (refactor-cleaner, build-error-resolver).

## Ampliación UX/UI (2026-11-20) — para llevar el piloto a nivel premium

Origen: https://github.com/affaan-m/ECC (MIT), commit 4adeee6732a12d1540f49a4d50a38ce8c97f9a53, salvo `frontend-design`.

Agentes (`.claude/agents/`):
- `a11y-architect` — accesibilidad WCAG 2.2 (contraste, foco, lectores de pantalla, tamaño de toque).
- `performance-optimizer` — rendimiento: tamaño del bundle, renders, carga en teléfonos.
- `code-simplifier` — ordena y simplifica componentes sin cambiar comportamiento.

Skills (`.claude/skills/`):
- Diseño visual: `frontend-design-direction`, `design-system` (tokens de color, tipografía, espaciado y auditoría visual), `make-interfaces-feel-better` (detalles de pulido: espaciados, bordes, sombras, estados).
- Movimiento: `motion-foundations`, `motion-patterns`, `motion-advanced` (la app ya usa motion/react).
- Accesibilidad: `accessibility`, `frontend-a11y`.
- Calidad de interacción: `click-path-audit` (recorre cada botón y su cambio de estado), `browser-qa` (verificación visual y de consola).
- React/Vite: `react-patterns`, `react-performance`, `vite-patterns`.
- Coherencia: `inherit-legacy-style` (evita que los cambios se desvíen del estilo del proyecto).
- Presentación: `ui-demo` (videos de demostración con Playwright para gerencia).
- `frontend-design` — skill oficial de Anthropic (https://github.com/anthropics/skills, Apache-2.0, commit e4bb5d960d87126ff3b3a8af1a104b7db67560ba), recomendado por `frontend-design-direction`.

No instalados: `gan-planner`, `gan-generator`, `gan-evaluator` (requieren un servidor MCP de Playwright no configurado y un ciclo de rediseño autónomo); skills `taste*` (edición de video musical), `dashboard-builder` (Grafana), `i18n-sync` (el proyecto no usa archivos de traducción).

Prioridad: las reglas de `AGENTS.md` (tipografías Inter / Space Grotesk / JetBrains Mono, estética suiza ORBI, sin "tech-larping") prevalecen sobre las sugerencias genéricas de estos skills.
