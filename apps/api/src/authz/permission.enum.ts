export enum Permission {
  BUSINESS_READ = 'business.read',
  BUSINESS_UPDATE = 'business.update',
  BUSINESS_DELETE = 'business.delete',
  BUSINESS_SUSPEND = 'business.suspend',

  MEMBER_READ = 'member.read',
  MEMBER_INVITE = 'member.invite',
  MEMBER_UPDATE_ROLE = 'member.update_role',
  MEMBER_REMOVE = 'member.remove',

  USER_READ = 'user.read',
  USER_MANAGE = 'user.manage',

  WALLET_READ = 'wallet.read',
  WALLET_TOPUP = 'wallet.topup',
  WALLET_TRANSACTION_READ = 'wallet.transaction.read',
  WALLET_ADMIN_CREDIT = 'wallet.admin_credit',
  WALLET_ADMIN_DEBIT = 'wallet.admin_debit',
  WALLET_ADMIN_REFUND = 'wallet.admin_refund',

  MESSAGE_READ = 'message.read',
  MESSAGE_SEND = 'message.send',
  MESSAGE_SEND_BULK = 'message.send_bulk',

  SENDER_READ = 'sender.read',
  SENDER_MANAGE = 'sender.manage',
  SENDER_APPROVE = 'sender.approve',

  API_KEY_READ = 'api_key.read',
  API_KEY_CREATE = 'api_key.create',
  API_KEY_REVOKE = 'api_key.revoke',

  WEBHOOK_READ = 'webhook.read',
  WEBHOOK_MANAGE = 'webhook.manage',

  PROVIDER_READ = 'provider.read',
  PROVIDER_MANAGE = 'provider.manage',
  ROUTING_READ = 'routing.read',
  ROUTING_MANAGE = 'routing.manage',

  PRICING_READ = 'pricing.read',
  PRICING_MANAGE = 'pricing.manage',

  SUPPORT_READ = 'support.read',
  SUPPORT_MANAGE = 'support.manage',

  COMPLIANCE_READ = 'compliance.read',
  COMPLIANCE_MANAGE = 'compliance.manage',

  AUDIT_READ = 'audit.read',

  PLATFORM_ROLE_READ = 'platform_role.read',
  PLATFORM_ROLE_MANAGE = 'platform_role.manage',
}