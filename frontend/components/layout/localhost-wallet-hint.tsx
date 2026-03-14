"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "haggiaz-localhost-wallet-hint-dismissed";

const LOCALHOST_MESSAGE = "Using Rainbow? To avoid extension errors on localhost:";
const LOCALHOST_DESCRIPTION =
  'Chrome → Extensions → Rainbow → Details → Site access → set to "On specific sites" and remove localhost (or choose "On click"). Use Valora, MetaMask, or WalletConnect in the app instead.';

/**
 * Shows a one-time toast on localhost with wallet/Rainbow hint.
 * No fixed banner — uses shadcn Sonner so it doesn’t clash with the navbar.
 */
export function LocalhostWalletHint() {
  const hasShown = useRef(false);

  useEffect(() => {
    if (hasShown.current) return;
    const isLocalhost =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");
    const wasDismissed =
      typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY);

    if (!isLocalhost || wasDismissed) return;

    hasShown.current = true;
    toast.warning(LOCALHOST_MESSAGE, {
      description: LOCALHOST_DESCRIPTION,
      duration: 10000,
      action: {
        label: "Dismiss",
        onClick: () => {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, "1");
          }
        },
      },
    });
  }, []);

  return null;
}
