"use client";

import { Button } from "@/components/ui/Button";
import { messages } from "@/messages/en";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = messages.common.errorTitle,
  message = messages.common.errorText,
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-card border border-tomato-dark/30 bg-surface p-8 text-center"
    >
      <h2 className="font-display text-2xl font-bold uppercase text-tomato-dark">{title}</h2>
      <p className="text-muted">{message}</p>
      {onRetry && <Button onClick={onRetry}>{messages.common.tryAgain}</Button>}
    </div>
  );
}