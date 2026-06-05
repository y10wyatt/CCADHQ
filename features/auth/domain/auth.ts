export function normalizeAuthNextPath(value: string | null | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/";
}

interface AuthOriginInput {
  configuredOrigin?: string;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
  host?: string | null;
}

export function resolveAuthOrigin({
  configuredOrigin,
  forwardedHost,
  forwardedProto,
  host,
}: AuthOriginInput) {
  const explicitOrigin = normalizeOrigin(configuredOrigin);
  if (explicitOrigin) {
    return explicitOrigin;
  }

  const requestHost = firstHeaderValue(forwardedHost) ?? firstHeaderValue(host);
  if (!requestHost) {
    return "http://localhost:3000";
  }

  const requestedProtocol = firstHeaderValue(forwardedProto);
  const protocol =
    requestedProtocol === "http" || requestedProtocol === "https"
      ? requestedProtocol
      : isLocalHost(requestHost)
        ? "http"
        : "https";

  return (
    normalizeOrigin(`${protocol}://${requestHost}`) ?? "http://localhost:3000"
  );
}

function normalizeOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const candidate = value.includes("://") ? value : `https://${value}`;

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

function firstHeaderValue(value: string | null | undefined) {
  return value?.split(",")[0]?.trim() || null;
}

function isLocalHost(host: string) {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}
