import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      businessId?: string;
      businessName?: string;
      businessRole?: string;
      platformRole?: string | null;
      accessToken?: string;
    } & DefaultSession['user'];
  }

  interface User {
    businessId?: string;
    businessName?: string;
    businessRole?: string;
    platformRole?: string | null;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    businessId?: string;
    businessName?: string;
    businessRole?: string;
    platformRole?: string | null;
    accessToken?: string;
  }
}

export {};