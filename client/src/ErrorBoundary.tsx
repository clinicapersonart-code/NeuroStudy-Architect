import React from "react";

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: any }
> {
  state = { error: null };

  static getDerivedStateFromError(error: any) {
    return { error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("APP CRASH:", error, info);
  }

  render() {
    if (this.state.error) {
      const msg = this.state.error?.message ?? String(this.state.error);
      return (
        <div style={{ padding: 16, fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
          <h2>Erro na aplicação</h2>
          <div>{msg}</div>
          {this.state.error?.stack ? <pre>{this.state.error.stack}</pre> : null}
        </div>
      );
    }
    return this.props.children;
  }
}
