import { BusinessRole, PlatformRole } from '@prisma/client';
import { Permission } from './permission.enum.js';

export const BUSINESS_ROLE_PERMISSIONS: Record<
  BusinessRole,
  readonly Permission[]
> = {
  [BusinessRole.OWNER]: [
    Permission.BUSINESS_READ,
    Permission.BUSINESS_UPDATE,
    Permission.BUSINESS_DELETE,

    Permission.MEMBER_READ,
    Permission.MEMBER_INVITE,
    Permission.MEMBER_UPDATE_ROLE,
    Permission.MEMBER_REMOVE,

    Permission.WALLET_READ,
    Permission.WALLET_TOPUP,
    Permission.WALLET_TRANSACTION_READ,

    Permission.MESSAGE_READ,
    Permission.MESSAGE_SEND,
    Permission.MESSAGE_SEND_BULK,

    Permission.SENDER_READ,
    Permission.SENDER_MANAGE,

    Permission.API_KEY_READ,
    Permission.API_KEY_CREATE,
    Permission.API_KEY_REVOKE,

    Permission.WEBHOOK_READ,
    Permission.WEBHOOK_MANAGE,

    Permission.PRICING_READ,
  ],

  [BusinessRole.ADMIN]: [
    Permission.BUSINESS_READ,
    Permission.BUSINESS_UPDATE,

    Permission.MEMBER_READ,
    Permission.MEMBER_INVITE,
    Permission.MEMBER_UPDATE_ROLE,
    Permission.MEMBER_REMOVE,

    Permission.WALLET_READ,
    Permission.WALLET_TOPUP,
    Permission.WALLET_TRANSACTION_READ,

    Permission.MESSAGE_READ,
    Permission.MESSAGE_SEND,
    Permission.MESSAGE_SEND_BULK,

    Permission.SENDER_READ,
    Permission.SENDER_MANAGE,

    Permission.API_KEY_READ,
    Permission.API_KEY_CREATE,
    Permission.API_KEY_REVOKE,

    Permission.WEBHOOK_READ,
    Permission.WEBHOOK_MANAGE,

    Permission.PRICING_READ,
  ],

  [BusinessRole.DEVELOPER]: [
    Permission.BUSINESS_READ,

    Permission.MEMBER_READ,

    Permission.WALLET_READ,

    Permission.MESSAGE_READ,
    Permission.MESSAGE_SEND,

    Permission.SENDER_READ,

    Permission.API_KEY_READ,
    Permission.API_KEY_CREATE,
    Permission.API_KEY_REVOKE,

    Permission.WEBHOOK_READ,
    Permission.WEBHOOK_MANAGE,
  ],

  [BusinessRole.BILLING]: [
    Permission.BUSINESS_READ,

    Permission.WALLET_READ,
    Permission.WALLET_TOPUP,
    Permission.WALLET_TRANSACTION_READ,

    Permission.PRICING_READ,
  ],

  [BusinessRole.OPERATOR]: [
    Permission.BUSINESS_READ,

    Permission.WALLET_READ,

    Permission.MESSAGE_READ,
    Permission.MESSAGE_SEND,
    Permission.MESSAGE_SEND_BULK,

    Permission.SENDER_READ,
    Permission.SENDER_MANAGE,

    Permission.PRICING_READ,
  ],

  [BusinessRole.VIEWER]: [
    Permission.BUSINESS_READ,
    Permission.MEMBER_READ,

    Permission.WALLET_READ,
    Permission.WALLET_TRANSACTION_READ,

    Permission.MESSAGE_READ,
    Permission.SENDER_READ,

    Permission.PRICING_READ,
  ],
};

export const PLATFORM_ROLE_PERMISSIONS: Record<
  PlatformRole,
  readonly Permission[]
> = {
  [PlatformRole.SUPER_ADMIN]: Object.values(Permission),

  [PlatformRole.OPERATIONS]: [
    Permission.BUSINESS_READ,
    Permission.BUSINESS_SUSPEND,

    Permission.USER_READ,
    Permission.MEMBER_READ,

    Permission.WALLET_READ,
    Permission.WALLET_TRANSACTION_READ,

    Permission.MESSAGE_READ,

    Permission.SENDER_READ,
    Permission.SENDER_MANAGE,
    Permission.SENDER_APPROVE,

    Permission.PROVIDER_READ,
    Permission.PROVIDER_MANAGE,

    Permission.ROUTING_READ,
    Permission.ROUTING_MANAGE,

    Permission.PRICING_READ,

    Permission.SUPPORT_READ,
    Permission.SUPPORT_MANAGE,

    Permission.COMPLIANCE_READ,

    Permission.AUDIT_READ,
  ],

  [PlatformRole.SUPPORT]: [
    Permission.BUSINESS_READ,
    Permission.USER_READ,
    Permission.MEMBER_READ,

    Permission.WALLET_READ,
    Permission.WALLET_TRANSACTION_READ,

    Permission.MESSAGE_READ,

    Permission.SENDER_READ,

    Permission.PROVIDER_READ,
    Permission.ROUTING_READ,

    Permission.PRICING_READ,

    Permission.SUPPORT_READ,
    Permission.SUPPORT_MANAGE,

    Permission.AUDIT_READ,
  ],

  [PlatformRole.FINANCE]: [
    Permission.BUSINESS_READ,
    Permission.USER_READ,

    Permission.WALLET_READ,
    Permission.WALLET_TRANSACTION_READ,
    Permission.WALLET_ADMIN_CREDIT,
    Permission.WALLET_ADMIN_DEBIT,
    Permission.WALLET_ADMIN_REFUND,

    Permission.PRICING_READ,
    Permission.PRICING_MANAGE,

    Permission.SUPPORT_READ,

    Permission.AUDIT_READ,
  ],

  [PlatformRole.COMPLIANCE]: [
    Permission.BUSINESS_READ,
    Permission.USER_READ,
    Permission.MEMBER_READ,

    Permission.SENDER_READ,
    Permission.SENDER_APPROVE,

    Permission.COMPLIANCE_READ,
    Permission.COMPLIANCE_MANAGE,

    Permission.AUDIT_READ,
  ],
};

export function businessRoleHasPermission(
  role: BusinessRole,
  permission: Permission,
): boolean {
  return BUSINESS_ROLE_PERMISSIONS[role].includes(permission);
}

export function platformRoleHasPermission(
  role: PlatformRole,
  permission: Permission,
): boolean {
  return PLATFORM_ROLE_PERMISSIONS[role].includes(permission);
}