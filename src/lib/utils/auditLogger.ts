/**
 * Audit Logger Utility
 * 
 * Extracted from SubmissionsTab to serve as a reusable, testable module.
 * Provides privacy-censoring (sanitization) and structured audit log writing
 * to the `admin_audit_logs` table in Supabase.
 * 
 * Required by PT Tairflask Indonesia Utama IT Audit compliance.
 * 
 * Privacy Rules:
 * - Phone numbers (phone, hp, telp, mobile) → [CENSORED]
 * - Addresses (alamat, address, jalan, kecamatan, kelurahan, kode_pos, postal) → [CENSORED]
 * - Recursively scans nested objects
 */

import { supabase } from '@/lib/supabase';

const SENSITIVE_KEYS = /phone|hp|telp|mobile|alamat|address|jalan|kecamatan|kelurahan|kode_pos|postal/i;

/**
 * Recursively scans a data object and replaces values of sensitive keys
 * with '[CENSORED]'. Handles nested objects but preserves arrays as-is.
 */
export function sanitizeAuditData(data: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.test(key)) {
      sanitized[key] = '[CENSORED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeAuditData(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export interface AuditLogEntry {
  adminEmail: string;
  actionType: string;
  tableAffected: string;
  recordId: string;
  oldData: Record<string, any> | null;
  newData: Record<string, any>;
}

/**
 * Writes a sanitized audit log entry to `admin_audit_logs`.
 * Captures browser hostname and user-agent for forensic traceability.
 * 
 * @returns The Supabase response (for error handling by caller if needed)
 */
export async function writeAuditLog(entry: AuditLogEntry) {
  const { adminEmail, actionType, tableAffected, recordId, oldData, newData } = entry;
  
  const result = await supabase.from('admin_audit_logs').insert([{
    admin_email: adminEmail,
    action_type: actionType,
    table_affected: tableAffected,
    record_id: recordId,
    old_data: oldData ? sanitizeAuditData(oldData) : null,
    new_data: sanitizeAuditData(newData),
    ip_address: typeof window !== 'undefined' ? window.location.hostname : 'server',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  }]);

  return result;
}
