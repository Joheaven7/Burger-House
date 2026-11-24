"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/features/cart/CartContext";
import { messages } from "@/messages/en";

interface AddToCartButtonProps {
  itemId: string;
  itemName: string;
  available: boolean;
  size?: "md" | "lg";
  className?: string;
}

export function AddToCartButton({ itemId, itemName, available, size = "md", className }: AddToCartButtonProps) {
  const { addItem, hydrated } = useCart();
  const [feedback, setFeedback] = useState<"idle" | "added" | "limit">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!available) {
    return (
      <Button variant="secondary" size={size} disabled className={className}>
        {messages.cart.soldOut}
        <span className="sr-only"> {itemName}</span>
      </Button>
    );
  }

  const handleClick = () => {
    const result = addItem(itemId, itemName);
    setFeedback(result === "added" ? "added" : "limit");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFeedback("idle"), 1500);
  };

  const label =
    feedback === "added" ? messages.cart.added : feedback === "limit" ? messages.cart.limitReached : messages.cart.addToCart;

  return (
    <Button size={size} onClick={handleClick} disabled={!hydrated} className={className}>
      {label}
      <span className="sr-only"> {itemName}</span>
    </Button>
  );
}