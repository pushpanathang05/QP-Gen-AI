import AuditLog from '../models/AuditLog.js'

export async function writeAuditLog({ req, userId, action, resourceType, resourceId, details }) {
  try {
    await AuditLog.create({
      userId,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress: req?.ip,
      userAgent: req?.headers?.['user-agent'],
      timestamp: new Date(),
    })
  } catch {
    // ignore audit failures
  }
}
