# MÓDULO 13A-0 — ORBI FLEET SOURCE INTAKE & QUARANTINE

## Quarantine Overview
- **Objective:** Reception, intake, and quarantine of source payloads for `Control de Flota & Logística` prior to verification and reconstruction.
- **Initial Status:** `SOURCE INTAKE / QUARANTINED / NOT INTEGRATED`
- **Protected Baseline:** `MÓDULO 12C-FREEZE — ORBI EXECUTIVE DEMO HUB FINAL RELEASE LOCK`
- **Strict Constraint:** No active code modified. No menu additions. No route registrations. No component imports into the operational shell.

## Expected Source Hashes & Specs
1. **`src/fleet-standalone/utils/fleet.ts`**
   - Lines: 291 useful lines
   - SHA-256: `c9ea7a7ffc2ac36fc5cf7f2aad1d1d39b14011adbf3e23dd11612e790e081369`

2. **`src/fleet-standalone/app/OrbiFleetStandaloneShell.tsx`**
   - Lines: 1,061 useful lines
   - SHA-256: `0684169d1001bdf58e4ab3bc8f29acc64c35043dccdda3312a65b339e9f2d32a`

## Quarantine Workflow
1. Receive raw text payloads in `/src/_migration/fleet-13a0/inbox/`
2. Wait for transfer complete command (`ORBI FLEET TRANSFER COMPLETE — VERIFY AND RECONSTRUCT`)
3. Reconstruct into `/src/_migration/fleet-13a0/reconstructed/`
4. Audit and log verification details in `/src/_migration/fleet-13a0/audit/`
