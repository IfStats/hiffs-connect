import type {
  DefaultSession,
  NextAuthOptions,
  User,
} from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';

type ApiMembership = {
  id: string;
  businessId: string;
  businessName: string;
  role: string;
};

type ApiAuthUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  platformRole: string | null;
  memberships: ApiMembership[];
  accessToken: string;
};

type AppUser = User & {
  businessId: string | null;
  businessName: string | null;
  businessRole: string | null;
  platformRole: string | null;
  accessToken: string | null;
};

type AppToken = JWT & {
  userId?: string;
  businessId?: string | null;
  businessName?: string | null;
  businessRole?: string | null;
  platformRole?: string | null;
  accessToken?: string | null;
};

type AppSessionUser = DefaultSession['user'] & {
  id: string;
  businessId: string | null;
  businessName: string | null;
  businessRole: string | null;
  platformRole: string | null;
  accessToken: string | null;
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'Credentials',

      credentials: {
        email: {
          label: 'Email',
          type: 'email',
        },

        password: {
          label: 'Password',
          type: 'password',
        },
      },

      async authorize(credentials) {
        if (
          !credentials?.email ||
          !credentials?.password
        ) {
          return null;
        }

        const apiBaseUrl =
          process.env.HIFFS_API_URL ??
          'http://localhost:4000';

        const response = await fetch(
          `${apiBaseUrl}/auth/credentials`,
          {
            method: 'POST',

            headers: {
              'Content-Type': 'application/json',
            },

            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),

            cache: 'no-store',
          },
        );

        if (!response.ok) {
          return null;
        }

        const apiUser =
          (await response.json()) as ApiAuthUser;

        const membership =
          apiUser.memberships?.[0];

        const user: AppUser = {
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.name,
          image: apiUser.image,

          businessId:
            membership?.businessId ?? null,

          businessName:
            membership?.businessName ?? null,

          businessRole:
            membership?.role ?? null,

          platformRole:
            apiUser.platformRole ?? null,

          accessToken:
            apiUser.accessToken ?? null,
        };

        return user;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      const appToken =
        token as AppToken;

      if (user) {
        const appUser =
          user as AppUser;

        appToken.userId =
          appUser.id;

        appToken.businessId =
          appUser.businessId;

        appToken.businessName =
          appUser.businessName;

        appToken.businessRole =
          appUser.businessRole;

        appToken.platformRole =
          appUser.platformRole;

        appToken.accessToken =
          appUser.accessToken;
      }

      return appToken;
    },

    async session({ session, token }) {
      const appToken =
        token as AppToken;

      if (session.user) {
        const sessionUser =
          session.user as AppSessionUser;

        sessionUser.id =
          appToken.userId ?? '';

        sessionUser.businessId =
          appToken.businessId ?? null;

        sessionUser.businessName =
          appToken.businessName ?? null;

        sessionUser.businessRole =
          appToken.businessRole ?? null;

        sessionUser.platformRole =
          appToken.platformRole ?? null;

        sessionUser.accessToken =
          appToken.accessToken ?? null;
      }

      return session;
    },
  },
};