"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/Button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl font-medium text-gold-light">出错了</h2>
            <p className="text-sm text-xuanpaper/70">
              抱歉，应用遇到了预期外的问题。
            </p>
          </div>
          
          <div className="bg-xuangray border border-gold-line/20 rounded-lg p-4 max-w-lg w-full text-left overflow-x-auto">
             <code className="text-xs text-red-400 font-mono">
               {this.state.error?.message}
             </code>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              刷新页面
            </Button>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
            >
              返回首页
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
