/**
 * Telemetry type definitions.
 * Used for JSDoc and editor support - no runtime.
 */

export type TelemetrySeverity = 'info' | 'warning' | 'error' | 'critical';

export type TelemetryStatus = 'success' | 'error' | 'warning' | 'pending' | 'unknown';

export type TelemetryDomain =
  | 'api'
  | 'user_activity'
  | 'audit'
  | 'auth'
  | 'community'
  | 'feed'
  | 'messaging'
  | 'network'
  | 'entity'
  | 'job'
  | 'webhook'
  | 'error'
  | 'search'
  | 'moderation'
  | 'compliance';

export interface TelemetryTimeRange {
  from: string;
  to: string;
  preset?: '1h' | '24h' | '7d' | '30d' | 'custom';
}

export interface TelemetryQueryFilters {
  from?: string;
  to?: string;
  domain?: TelemetryDomain;
  status?: TelemetryStatus;
  severity?: TelemetrySeverity;
  entityType?: string;
  entityId?: string;
  actorId?: number;
  limit?: number;
  offset?: number;
}

export interface TelemetryEvent {
  id: string;
  timestamp: string;
  domain: TelemetryDomain;
  type: string;
  actorId?: string;
  actorType?: string;
  entityId?: string;
  entityType?: string;
  status?: TelemetryStatus;
  severity?: TelemetrySeverity;
  summary?: string;
  metadata?: Record<string, unknown>;
}

export interface ApiTelemetrySummary {
  endpoint: string;
  method: string;
  requestCount: number;
  successRate: number;
  errorRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  lastSeen: string;
}

export interface ApiRequestEvent extends TelemetryEvent {
  endpoint?: string;
  method?: string;
  statusCode?: number;
  latencyMs?: number;
  requestId?: string;
  traceId?: string;
}

export interface UserActivityEvent extends TelemetryEvent {
  action: string;
  module?: string;
}

export interface AuditEvent extends TelemetryEvent {
  action: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export interface SecurityEvent extends TelemetryEvent {
  eventType: string;
  success?: boolean;
}

export interface CommunityTelemetryEvent extends TelemetryEvent {}
export interface FeedTelemetryEvent extends TelemetryEvent {}
export interface MessagingTelemetryEvent extends TelemetryEvent {}
export interface NetworkTelemetryEvent extends TelemetryEvent {}

export interface EntityChangeEvent extends TelemetryEvent {
  entityType: string;
  changes?: Array<{ field: string; before?: unknown; after?: unknown }>;
}

export interface JobRunEvent extends TelemetryEvent {
  jobType: string;
  status: string;
  durationMs?: number;
}

export interface WebhookEvent extends TelemetryEvent {
  url: string;
  statusCode?: number;
}

export interface ErrorEvent extends TelemetryEvent {
  message: string;
  stack?: string;
}

export interface SearchTelemetryEvent extends TelemetryEvent {
  query: string;
  resultCount?: number;
}

export interface ModerationEvent extends TelemetryEvent {
  action: string;
}

export interface ComplianceEvent extends TelemetryEvent {
  exportType?: string;
}
