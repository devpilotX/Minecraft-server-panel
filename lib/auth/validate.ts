/**
 * Validate a Pterodactyl client API key by hitting the /api/client endpoint.
 * Returns user info on success, null on failure.
 */

export interface PteroUser {
  id: number;
  admin: boolean;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface ValidationResult {
  valid: boolean;
  user: PteroUser | null;
  error?: string;
}

/**
 * Validate API key against the Pterodactyl panel.
 * Makes a lightweight request to GET /api/client/account.
 */
export async function validateApiKey(
  panelUrl: string,
  apiKey: string,
): Promise<ValidationResult> {
  // Normalize panel URL
  const baseUrl = panelUrl.replace(/\/+$/, "");

  try {
    const response = await fetch(`${baseUrl}/api/client/account`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      // 10s timeout
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return {
          valid: false,
          user: null,
          error: "Invalid API key. Check your key and try again.",
        };
      }

      return {
        valid: false,
        user: null,
        error: `Panel returned status ${response.status}. Verify your panel URL.`,
      };
    }

    const data = await response.json();
    const attrs = data?.attributes;

    if (!attrs) {
      return {
        valid: false,
        user: null,
        error: "Unexpected response format from panel.",
      };
    }

    return {
      valid: true,
      user: {
        id: attrs.id,
        admin: attrs.admin ?? false,
        username: attrs.username,
        email: attrs.email,
        firstName: attrs.first_name ?? "",
        lastName: attrs.last_name ?? "",
      },
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        valid: false,
        user: null,
        error: "Connection timed out. Check your panel URL and network.",
      };
    }

    return {
      valid: false,
      user: null,
      error:
        error instanceof Error
          ? `Connection failed: ${error.message}`
          : "Failed to connect to the panel.",
    };
  }
}

/**
 * Quick check: can we reach the panel at all?
 */
export async function checkPanelReachable(
  panelUrl: string,
): Promise<boolean> {
  const baseUrl = panelUrl.replace(/\/+$/, "");

  try {
    const response = await fetch(`${baseUrl}/api/client`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5_000),
    });
    // Even a 401 means the panel is reachable
    return response.status < 500;
  } catch {
    return false;
  }
}