"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import {
  Rocket,
  Key,
  Globe,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
} from "lucide-react";

const DEFAULT_PANEL_URL = "https://panel.devpilotx.com";

/**
 * Login page — glass card centered on screen.
 * User enters their Panel URL + Client API Key.
 * Validates against the panel before creating session.
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const [panelUrl, setPanelUrl] = useState(DEFAULT_PANEL_URL);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);

      // Client-side validation
      if (!panelUrl.trim()) {
        setError("Panel URL is required.");
        setIsLoading(false);
        return;
      }

      if (!apiKey.trim()) {
        setError("API key is required.");
        setIsLoading(false);
        return;
      }

      if (!apiKey.startsWith("ptlc_")) {
        setError(
          'API key should start with "ptlc_". Use a Client API key, not an Application key.',
        );
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            panelUrl: panelUrl.trim(),
            apiKey: apiKey.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Login failed.");
          return;
        }

        toast.success(`Welcome back, ${data.user?.username ?? "admin"}!`);
        router.push(redirectTo);
        router.refresh();
      } catch {
        setError("Network error. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    },
    [panelUrl, apiKey, redirectTo, router],
  );

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-accent-blue/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent-purple/5 blur-3xl" />
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-blue/10 border border-accent-blue/20 mb-4">
            <Rocket className="h-7 w-7 text-accent-blue" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            DevPilotX Panel
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Manage your Minecraft server with style
          </p>
        </div>

        {/* Card */}
        <div className="dpx-glass rounded-2xl border border-border-subtle p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Panel URL */}
            <div className="space-y-2">
              <label
                htmlFor="panelUrl"
                className="text-sm font-medium text-text-secondary"
              >
                Panel URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <input
                  id="panelUrl"
                  type="url"
                  value={panelUrl}
                  onChange={(e) => setPanelUrl(e.target.value)}
                  placeholder="https://panel.example.com"
                  className={cn(
                    "w-full rounded-lg border border-border-subtle bg-surface py-2.5 pl-10 pr-4",
                    "text-sm text-text-primary placeholder:text-text-tertiary",
                    "focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue/30",
                    "transition-colors",
                  )}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <label
                htmlFor="apiKey"
                className="text-sm font-medium text-text-secondary"
              >
                Client API Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="ptlc_xxxxxxxxxxxx"
                  className={cn(
                    "w-full rounded-lg border border-border-subtle bg-surface py-2.5 pl-10 pr-12",
                    "text-sm font-mono text-text-primary placeholder:text-text-tertiary",
                    "focus:border-accent-blue focus:outline-none focus:ring-1 focus:ring-accent-blue/30",
                    "transition-colors",
                  )}
                  disabled={isLoading}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
                  tabIndex={-1}
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-text-tertiary">
                Generate at:{" "}
                <a
                  href={`${panelUrl}/account/api`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue hover:underline"
                >
                  Panel → Account → API Credentials
                </a>
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg border border-accent-red/20 bg-accent-red/5 px-4 py-3">
                <p className="text-sm text-accent-red">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={isLoading}
              rightIcon={
                isLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )
              }
            >
              {isLoading ? "Validating..." : "Connect to Panel"}
            </Button>
          </form>

          {/* Security note */}
          <div className="mt-5 flex items-start gap-2 rounded-lg bg-surface px-3 py-2.5">
            <Shield className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-accent-green" />
            <p className="text-[11px] leading-relaxed text-text-tertiary">
              Your API key is encrypted and stored as an httpOnly cookie.
              It never leaves your browser unencrypted.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-text-tertiary">
          DevPilotX v1.0 — Custom Minecraft Panel
        </p>
      </div>
    </div>
  );
}