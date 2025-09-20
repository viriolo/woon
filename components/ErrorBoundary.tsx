import React from "react";

interface ErrorBoundaryState {
    hasError: boolean;
    message?: string;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, message: error.message };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Unexpected UI error", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, message: undefined });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="h-screen w-screen flex flex-col items-center justify-center bg-neutral-50 px-6 text-center">
                    <h1 className="text-3xl font-display text-special-primary mb-2">Something went wrong</h1>
                    <p className="text-neutral-600 mb-6">{this.state.message || "An unexpected error occurred. Please refresh to continue celebrating."}</p>
                    <button onClick={this.handleReset} className="px-6 py-3 rounded-full bg-special-primary text-white font-semibold hover:opacity-90">
                        Reload Woon
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
