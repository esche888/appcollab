import { createAdminClient } from '../supabase/admin'
import type { AuditActionType } from '@/types/database'

export type ResourceType = 'project' | 'user' | 'auth' | 'settings'

export interface AuditLogEntry {
  userId?: string  // Optional because some actions (signup) happen before user is fully created
  actionType: AuditActionType
  resourceType?: ResourceType
  resourceId?: string
  metadata?: Record<string, any>
}

class AuditService {
  /**
   * Log an audit event using admin client to bypass RLS
   * This ensures logging works even when user context is unavailable
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const adminSupabase = createAdminClient()

      await adminSupabase.from('audit_logs').insert({
        user_id: entry.userId || null,
        action_type: entry.actionType,
        resource_type: entry.resourceType || null,
        resource_id: entry.resourceId || null,
        metadata: entry.metadata || {},
      })
    } catch (error) {
      // Log to console but don't throw - audit logging should never break app functionality
      console.error('Failed to create audit log:', error)
    }
  }

  /**
   * Helper for project actions
   */
  async logProjectAction(
    userId: string,
    actionType: Extract<AuditActionType, 'project_created' | 'project_updated' | 'project_deleted' | 'project_archived' | 'project_unarchived'>,
    projectId: string,
    metadata?: Record<string, any>
  ) {
    await this.log({
      userId,
      actionType,
      resourceType: 'project',
      resourceId: projectId,
      metadata,
    })
  }

  /**
   * Helper for user management actions
   */
  async logUserAction(
    adminUserId: string,
    actionType: Extract<AuditActionType, 'user_created' | 'user_role_changed' | 'user_deleted'>,
    targetUserId: string,
    metadata?: Record<string, any>
  ) {
    await this.log({
      userId: adminUserId,
      actionType,
      resourceType: 'user',
      resourceId: targetUserId,
      metadata,
    })
  }

  /**
   * Helper for auth actions
   */
  async logAuthAction(
    actionType: Extract<AuditActionType, 'user_login' | 'user_logout' | 'user_signup'>,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    await this.log({
      userId,
      actionType,
      resourceType: 'auth',
      metadata,
    })
  }

  /**
   * Helper for settings changes
   */
  async logSettingsAction(
    userId: string,
    actionType: Extract<AuditActionType, 'ai_settings_changed' | 'admin_settings_changed'>,
    metadata?: Record<string, any>
  ) {
    await this.log({
      userId,
      actionType,
      resourceType: 'settings',
      metadata,
    })
  }
}

// Singleton instance
export const auditService = new AuditService()
