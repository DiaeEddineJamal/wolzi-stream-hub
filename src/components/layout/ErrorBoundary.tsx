import { Component, type ReactNode } from 'react';

// Last line of defence: a render error on one page shows a way out instead of a blank site.
// Class component because React only offers error boundaries as classes.
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; path: string }> {
  state = { failed: false, path: window.location.pathname };

  static getDerivedStateFromError() {
    return { failed: true, path: window.location.pathname };
  }

  componentDidCatch(error: unknown) {
    console.error('Page crashed:', error);
  }

  componentDidUpdate() {
    // Navigating elsewhere (Back, a link) clears the error.
    if (this.state.failed && this.state.path !== window.location.pathname) this.setState({ failed: false, path: window.location.pathname });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main role="alert" className="grid min-h-screen place-items-center bg-background px-6 text-center text-foreground">
        <div>
          <p className="eyebrow">SOMETHING WENT WRONG</p>
          <h1 className="mt-3 text-3xl font-semibold">This page hit a problem.</h1>
          <p className="mt-3 text-sm text-muted-foreground">Your list and watch history are safe. Reload, or head back to discover.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black" onClick={() => window.location.reload()}>Reload</button>
            <a className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium" href="/">Back to discover</a>
          </div>
        </div>
      </main>
    );
  }
}
