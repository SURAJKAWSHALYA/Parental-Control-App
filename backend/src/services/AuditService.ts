import crypto from 'crypto';
import { AuditLog } from '../models/AuditLog';

export class AuditService {
  /**
   * Logs a security or configuration action.
   */
  static async logAction(
    familyId: string,
    actorId: string,
    actorRole: 'OWNER' | 'CO_PARENT' | 'SYSTEM',
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: any,
    ipAddress?: string
  ) {
    try {
      // Create an IP hash instead of storing raw IP to respect privacy requirements
      const ipHash = ipAddress 
        ? crypto.createHash('sha256').update(ipAddress).digest('hex').substring(0, 16)
        : undefined;

      await AuditLog.create({
        familyId,
        actorId,
        actorRole,
        action,
        resourceType,
        resourceId,
        metadata,
        ipHash,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // We don't throw here to avoid failing the main business transaction, 
      // but in strict mode we might want to.
    }
  }
}
