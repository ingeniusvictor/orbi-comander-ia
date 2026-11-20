/**
 * MÓDULO 17A — Evita la pantalla en blanco: si un módulo falla al renderizar,
 * muestra el error y permite volver a intentar sin perder los datos guardados.
 */
import React from 'react';

import Button from './ui/Button';
interface Props {
  children: React.ReactNode;
  /** Nombre del módulo, para el mensaje. */
  modulo?: string;
  /** Cambia este valor (p. ej. la vista activa) para limpiar el error automáticamente. */
  resetKey?: unknown;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  // El proyecto no instala @types/react, así que se declaran los miembros heredados que se usan.
  declare props: Props;
  declare setState: (state: State) => void;
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ORBI] Error en ${this.props.modulo || 'la aplicación'}:`, error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    // 17A UX P2: los módulos se descargan al abrirlos. Sin señal, uno que nunca se abrió en este
    // equipo no está disponible: se explica en español y "Reintentar" recarga (la descarga fallida
    // queda memorizada por React, así que limpiar el error no bastaría).
    if (/dynamically imported module|Importing a module script failed|error loading dynamically/i.test(this.state.error.message)) {
      return (
        <div role="alert" className="m-6 p-6 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-100 space-y-3">
          <h2 className="text-sm font-bold">{this.props.modulo || 'Este módulo'} no está disponible sin señal.</h2>
          <p className="text-sm">Todavía no se había descargado en este equipo. Vuelve a intentarlo cuando tengas conexión; tus datos guardados no se borraron.</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      );
    }
    return (
      <div role="alert" className="m-6 p-6 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 space-y-3">
        <h2 className="text-sm font-bold">Ocurrió un error en {this.props.modulo || 'este módulo'}.</h2>
        <p className="text-xs font-mono break-words">{this.state.error.message}</p>
        <p className="text-xs">Tus datos guardados no se borraron. Puedes reintentar o cambiar de módulo.</p>
        <Button variant="danger" onClick={() => this.setState({ error: null })}>
          Reintentar
        </Button>
      </div>
    );
  }
}
