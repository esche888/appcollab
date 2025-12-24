import { resend, SENDER_EMAIL } from './client'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NotificationPreferences } from '@/types/database'
import FeatureSuggestionCreated from './templates/feature-suggestion-created'
import FeatureSuggestionCommentCreated from './templates/feature-suggestion-comment-created'
import FeedbackCreated from './templates/feedback-created'
import FeedbackCommentCreated from './templates/feedback-comment-created'

type NotificationContext = {
  projectId: string
  projectTitle: string
  triggeredByUserId: string
  triggeredByUsername: string
  triggeredByUserFullName?: string | null
  contentTitle?: string
  contentPreview: string
  resourceUrl: string
}

export class NotificationService {
  private supabase = createAdminClient()

  /**
   * Get project owners who should be notified
   * Excludes the user who triggered the action
   */
  private async getNotifiableOwners(
    projectId: string,
    triggeredByUserId: string,
    preferenceKey: keyof NotificationPreferences
  ) {
    console.log(`[NotificationService] Getting notifiable owners for project ${projectId}`)
    console.log(`[NotificationService] Triggered by user: ${triggeredByUserId}`)
    console.log(`[NotificationService] Checking preference: ${preferenceKey}`)

    // Fetch project to get owner_ids
    const { data: project, error: projectError } = await this.supabase
      .from('projects')
      .select('owner_ids, title')
      .eq('id', projectId)
      .is('deleted_at', null)
      .single()

    if (projectError || !project) {
      console.error('[NotificationService] Error fetching project:', projectError)
      return []
    }

    console.log(`[NotificationService] Project "${project.title}" has ${project.owner_ids.length} owner(s):`, project.owner_ids)

    // Filter out the user who triggered the action
    const ownerIds = project.owner_ids.filter((id: string) => id !== triggeredByUserId)

    if (ownerIds.length === 0) {
      console.log('[NotificationService] No owners to notify (triggering user is the only/all owner(s))')
      return []
    }

    console.log(`[NotificationService] After filtering triggering user, ${ownerIds.length} owner(s) remain:`, ownerIds)

    // Fetch owner profiles with notification preferences
    const { data: owners, error: ownersError } = await this.supabase
      .from('profiles')
      .select('id, username, full_name, notification_preferences')
      .in('id', ownerIds)
      .is('deleted_at', null)

    if (ownersError || !owners) {
      console.error('[NotificationService] Error fetching owners:', ownersError)
      return []
    }

    console.log(`[NotificationService] Fetched ${owners.length} owner profile(s)`)

    // Filter owners who have this notification enabled
    const notifiableOwners = owners.filter((owner: any) => {
      const prefs = owner.notification_preferences as NotificationPreferences
      const isEnabled = prefs?.[preferenceKey] === true
      console.log(`[NotificationService] Owner ${owner.username} (${owner.id}): ${preferenceKey}=${isEnabled}`, prefs)
      return isEnabled
    })

    console.log(`[NotificationService] ${notifiableOwners.length} owner(s) have notifications enabled for ${preferenceKey}`)

    return notifiableOwners.map((owner: any) => ({
      id: owner.id,
      username: owner.username,
      fullName: owner.full_name,
    }))
  }

  /**
   * Get owner email addresses
   * Uses Supabase Auth to get email addresses
   */
  private async getOwnerEmails(ownerIds: string[]) {
    console.log(`[NotificationService] Fetching email addresses for ${ownerIds.length} owner(s)`)
    const emails: { userId: string; email: string }[] = []

    for (const ownerId of ownerIds) {
      const { data, error } = await this.supabase.auth.admin.getUserById(ownerId)

      if (error) {
        console.error(`[NotificationService] Error fetching email for user ${ownerId}:`, error)
      } else if (!data.user?.email) {
        console.warn(`[NotificationService] No email found for user ${ownerId}`)
      } else {
        console.log(`[NotificationService] Found email for user ${ownerId}: ${data.user.email}`)
        emails.push({
          userId: ownerId,
          email: data.user.email,
        })
      }
    }

    console.log(`[NotificationService] Successfully retrieved ${emails.length} email address(es)`)
    return emails
  }

  /**
   * Send notification for new feature suggestion
   */
  async notifyFeatureSuggestionCreated(context: NotificationContext) {
    console.log('[NotificationService] ===== FEATURE SUGGESTION CREATED NOTIFICATION =====')
    console.log('[NotificationService] Context:', {
      projectId: context.projectId,
      projectTitle: context.projectTitle,
      triggeredByUserId: context.triggeredByUserId,
      triggeredByUsername: context.triggeredByUsername,
      contentTitle: context.contentTitle,
    })

    try {
      const owners = await this.getNotifiableOwners(
        context.projectId,
        context.triggeredByUserId,
        'notify_feature_suggestion_added'
      )

      if (owners.length === 0) {
        console.log('[NotificationService] No owners to notify - exiting')
        return { success: true, sent: 0 }
      }

      const ownerEmails = await this.getOwnerEmails(owners.map((o) => o.id))

      if (ownerEmails.length === 0) {
        console.warn('[NotificationService] No email addresses found for owners')
        return { success: true, sent: 0 }
      }

      console.log(`[NotificationService] Preparing to send ${ownerEmails.length} email(s)`)
      console.log(`[NotificationService] Using sender email: ${SENDER_EMAIL}`)

      const emailPromises = ownerEmails.map(async ({ userId, email }) => {
        const owner = owners.find((o) => o.id === userId)
        if (!owner) return null

        console.log(`[NotificationService] Sending email to ${email} for user ${owner.username}`)

        return resend.emails.send({
          from: SENDER_EMAIL,
          to: email,
          subject: `New feature suggestion for ${context.projectTitle}`,
          react: FeatureSuggestionCreated({
            ownerName: owner.fullName || owner.username,
            projectTitle: context.projectTitle,
            suggestionTitle: context.contentTitle || 'Untitled',
            suggestionPreview: context.contentPreview,
            userName: context.triggeredByUserFullName || context.triggeredByUsername,
            projectUrl: context.resourceUrl,
          }),
        })
      })

      const results = await Promise.allSettled(emailPromises)

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`[NotificationService] ✅ Email ${index + 1} sent successfully:`, result.value)
        } else {
          console.error(`[NotificationService] ❌ Email ${index + 1} failed:`, result.reason)
        }
      })

      const successful = results.filter((r) => r.status === 'fulfilled').length

      console.log(`[NotificationService] FINAL RESULT: Sent ${successful}/${ownerEmails.length} feature suggestion notifications`)
      console.log('[NotificationService] ===== END NOTIFICATION =====')

      return { success: true, sent: successful }
    } catch (error) {
      console.error('[NotificationService] ❌ CRITICAL ERROR sending feature suggestion notifications:', error)
      return { success: false, error }
    }
  }

  /**
   * Send notification for new comment on feature suggestion
   */
  async notifyFeatureSuggestionCommentCreated(context: NotificationContext) {
    console.log('[NotificationService] ===== FEATURE SUGGESTION COMMENT NOTIFICATION =====')
    console.log('[NotificationService] Context:', {
      projectId: context.projectId,
      projectTitle: context.projectTitle,
      triggeredByUserId: context.triggeredByUserId,
      triggeredByUsername: context.triggeredByUsername,
      contentTitle: context.contentTitle,
    })

    try {
      const owners = await this.getNotifiableOwners(
        context.projectId,
        context.triggeredByUserId,
        'notify_feature_suggestion_comment_added'
      )

      if (owners.length === 0) {
        console.log('[NotificationService] No owners to notify - exiting')
        return { success: true, sent: 0 }
      }

      const ownerEmails = await this.getOwnerEmails(owners.map((o) => o.id))

      if (ownerEmails.length === 0) {
        console.warn('[NotificationService] No email addresses found for owners')
        return { success: true, sent: 0 }
      }

      console.log(`[NotificationService] Preparing to send ${ownerEmails.length} email(s)`)
      console.log(`[NotificationService] Using sender email: ${SENDER_EMAIL}`)

      const emailPromises = ownerEmails.map(async ({ userId, email }) => {
        const owner = owners.find((o) => o.id === userId)
        if (!owner) return null

        console.log(`[NotificationService] Sending email to ${email} for user ${owner.username}`)

        return resend.emails.send({
          from: SENDER_EMAIL,
          to: email,
          subject: `New comment on feature suggestion in ${context.projectTitle}`,
          react: FeatureSuggestionCommentCreated({
            ownerName: owner.fullName || owner.username,
            projectTitle: context.projectTitle,
            suggestionTitle: context.contentTitle || 'Feature Suggestion',
            commentPreview: context.contentPreview,
            userName: context.triggeredByUserFullName || context.triggeredByUsername,
            projectUrl: context.resourceUrl,
          }),
        })
      })

      const results = await Promise.allSettled(emailPromises)

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`[NotificationService] ✅ Email ${index + 1} sent successfully:`, result.value)
        } else {
          console.error(`[NotificationService] ❌ Email ${index + 1} failed:`, result.reason)
        }
      })

      const successful = results.filter((r) => r.status === 'fulfilled').length

      console.log(`[NotificationService] FINAL RESULT: Sent ${successful}/${ownerEmails.length} comment notifications`)
      console.log('[NotificationService] ===== END NOTIFICATION =====')

      return { success: true, sent: successful }
    } catch (error) {
      console.error('[NotificationService] ❌ CRITICAL ERROR sending comment notifications:', error)
      return { success: false, error }
    }
  }

  /**
   * Send notification for new feedback
   */
  async notifyFeedbackCreated(context: NotificationContext) {
    try {
      const owners = await this.getNotifiableOwners(
        context.projectId,
        context.triggeredByUserId,
        'notify_feedback_added'
      )

      if (owners.length === 0) {
        return { success: true, sent: 0 }
      }

      const ownerEmails = await this.getOwnerEmails(owners.map((o) => o.id))

      const emailPromises = ownerEmails.map(async ({ userId, email }) => {
        const owner = owners.find((o) => o.id === userId)
        if (!owner) return null

        return resend.emails.send({
          from: SENDER_EMAIL,
          to: email,
          subject: `New feedback for ${context.projectTitle}`,
          react: FeedbackCreated({
            ownerName: owner.fullName || owner.username,
            projectTitle: context.projectTitle,
            feedbackTitle: context.contentTitle || 'Feedback',
            feedbackPreview: context.contentPreview,
            userName: context.triggeredByUserFullName || context.triggeredByUsername,
            projectUrl: context.resourceUrl,
          }),
        })
      })

      const results = await Promise.allSettled(emailPromises)
      const successful = results.filter((r) => r.status === 'fulfilled').length

      console.log(`[NotificationService] Sent ${successful}/${ownerEmails.length} feedback notifications`)

      return { success: true, sent: successful }
    } catch (error) {
      console.error('[NotificationService] Error sending feedback notifications:', error)
      return { success: false, error }
    }
  }

  /**
   * Send notification for new comment on feedback
   */
  async notifyFeedbackCommentCreated(context: NotificationContext) {
    try {
      const owners = await this.getNotifiableOwners(
        context.projectId,
        context.triggeredByUserId,
        'notify_feedback_comment_added'
      )

      if (owners.length === 0) {
        return { success: true, sent: 0 }
      }

      const ownerEmails = await this.getOwnerEmails(owners.map((o) => o.id))

      const emailPromises = ownerEmails.map(async ({ userId, email }) => {
        const owner = owners.find((o) => o.id === userId)
        if (!owner) return null

        return resend.emails.send({
          from: SENDER_EMAIL,
          to: email,
          subject: `New reply on feedback in ${context.projectTitle}`,
          react: FeedbackCommentCreated({
            ownerName: owner.fullName || owner.username,
            projectTitle: context.projectTitle,
            feedbackTitle: context.contentTitle || 'Feedback',
            commentPreview: context.contentPreview,
            userName: context.triggeredByUserFullName || context.triggeredByUsername,
            projectUrl: context.resourceUrl,
          }),
        })
      })

      const results = await Promise.allSettled(emailPromises)
      const successful = results.filter((r) => r.status === 'fulfilled').length

      console.log(`[NotificationService] Sent ${successful}/${ownerEmails.length} feedback comment notifications`)

      return { success: true, sent: successful }
    } catch (error) {
      console.error('[NotificationService] Error sending feedback comment notifications:', error)
      return { success: false, error }
    }
  }
}

export const notificationService = new NotificationService()
