type AuditSeverity = "error" | "info" | "warn";

export type AuditEvent = {
  action: string;
  actorId?: string | null;
  entityId?: string | null;
  entityType?: string | null;
  metadata?: Record<string, unknown>;
  severity?: AuditSeverity;
};

export function recordAuditEvent(event: AuditEvent): void {
  const payload = {
    action: event.action,
    actorId: event.actorId ?? null,
    entityId: event.entityId ?? null,
    entityType: event.entityType ?? null,
    metadata: sanitizeMetadata(event.metadata ?? {}),
    severity: event.severity ?? "info",
    timestamp: new Date().toISOString(),
  };

  const logger =
    payload.severity === "error"
      ? console.error
      : payload.severity === "warn"
        ? console.warn
        : console.info;

  logger("[audit]", JSON.stringify(payload));
}

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const blockedKeys = new Set(["authorization", "password", "token", "supabase_service_role_key"]);

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      blockedKeys.has(key.toLowerCase()) ? "[redacted]" : value,
    ]),
  );
}
