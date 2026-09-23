import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

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

        const response =
          await fetch(
            `${apiBaseUrl}/auth/credentials`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body: JSON.stringify({
                email:
                  credentials.email,
                password:
                  credentials.password,
              }),

              cache: 'no-store',
            },
          );

        if (!response.ok) {
          return null;
        }

        const user =
          await response.json();

        const membership =
          user.memberships?.[0];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,

          businessId:
            membership?.businessId ??
            null,

          businessName:
            membership?.businessName ??
            null,

          businessRole:
            membership?.role ??
            null,

          platformRole:
            user.platformRole ??
            null,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({
      token,
      user,
    }) {
      if (user) {
        token.userId =
          user.id;

        token.businessId =
          (user as any).businessId;

        token.businessName =
          (user as any).businessName;

        token.businessRole =
          (user as any).businessRole;

        token.platformRole =
          (user as any).platformRole;
      }

      return token;
    },

    async session({
      session,
      token,
    }) {
      if (session.user) {
        (session.user as any).id =
          token.userId;

        (session.user as any).businessId =
          token.businessId;

        (session.user as any).businessName =
          token.businessName;

        (session.user as any).businessRole =
          token.businessRole;

        (session.user as any).platformRole =
          token.platformRole;
      }

      return session;
    },
  },
};