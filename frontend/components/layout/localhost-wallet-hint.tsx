"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const STORAGE_KEY = "haggiaz-localhost-wallet-hint-dismissed";

export function LocalhostWalletHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    const wasDismissed = typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY);
    setShow(!!isLocalhost && !wasDismissed);
  }, []);

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <Alert className="rounded-none border-x-0 border-t-0 border-b bg-muted/50 py-2">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6">
        <div>
          <AlertTitle className="text-xs font-medium sm:text-sm">
            Using Rainbow? To avoid extension errors on localhost:
          </AlertTitle>
          <AlertDescription className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Chrome → Extensions → Rainbow → Details → Site access → set to &quot;On specific
            sites&quot; and remove localhost (or choose &quot;On click&quot;). Use Valora,
            MetaMask, or WalletConnect in the app instead.
          </AlertDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
