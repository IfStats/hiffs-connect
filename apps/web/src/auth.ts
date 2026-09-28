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
  accessTokenExpiresAt: string;

  refreshToken: string;
  refreshTokenExpiresAt: string;
};

type RefreshResponse = {
  accessToken: string;
  accessTokenExpiresAt: string;

  refreshToken: string;
  refreshTokenExpiresAt: string;
};

type AppUser = User & {
  businessId: string | null;
  businessName: string | null;
  businessRole: string | null;
  platformRole: string | null;

  accessToken: string | null;
  accessTokenExpiresAt: number | null;

  refreshToken: string | null;
  refreshTokenExpiresAt: number | null;
};

type AppToken = JWT & {
  userId?: string;

  businessId?: string | null;
  businessName?: string | null;
  businessRole?: string | null;
  platformRole?: string | null;

  accessToken?: string | null;
  accessTokenExpiresAt?: number | null;

  refreshToken?: string | null;
  refreshTokenExpiresAt?: number | null;

  authError?: 'RefreshAccessTokenError';
};

type AppSessionUser =
  DefaultSession['user'] & {
    id: string;

    businessId: string | null;
    businessName: string | null;
    businessRole: string | null;
    platformRole: string | null;

    accessToken: string | null;
  };

type AppSession =
  DefaultSession & {
    authError?:
      | 'RefreshAccessTokenError';
  };

const REFRESH_BUFFER_MS =
  5 * 60 * 1000;

function parseExpiry(
  value: string | null | undefined,
) {
  if (!value) {
    return null;
  }

  const timestamp =
    new Date(value).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : null;
}

async function refreshAccessToken(
  token: AppToken,
): Promise<AppToken> {
  if (!token.refreshToken) {
    return {
      ...token,
      accessToken: undefined,
      authError:
        'RefreshAccessTokenError',
    };
  }

  if (
    token.refreshTokenExpiresAt &&
    Date.now() >=
      token.refreshTokenExpiresAt
  ) {
    return {
      ...token,
      accessToken: undefined,
      refreshToken: undefined,
      authError:
        'RefreshAccessTokenError',
    };
  }

  try {
    const apiBaseUrl =
      process.env.HIFFS_API_URL ??
      'http://localhost:4000';

    const response =
      await fetch(
        `${apiBaseUrl}/auth/refresh`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            refreshToken:
              token.refreshToken,
          }),

          cache: 'no-store',
        },
      );

    if (!response.ok) {
      return {
        ...token,
        accessToken: undefined,
        refreshToken: undefined,
        authError:
          'RefreshAccessTokenError',
      };
    }

    const refreshed =
      (await response.json()) as RefreshResponse;

    const accessTokenExpiresAt =
      parseExpiry(
        refreshed.accessTokenExpiresAt,
      );

    const refreshTokenExpiresAt =
      parseExpiry(
        refreshed.refreshTokenExpiresAt,
      );

    if (
      !refreshed.accessToken ||
      !refreshed.refreshToken ||
      !accessTokenExpiresAt ||
      !refreshTokenExpiresAt
    ) {
      return {
        ...token,
        accessToken: undefined,
        refreshToken: undefined,
        authError:
          'RefreshAccessTokenError',
      };
    }

    return {
      ...token,

      accessToken:
        refreshed.accessToken,

      accessTokenExpiresAt,

      refreshToken:
        refreshed.refreshToken,

      refreshTokenExpiresAt,

      authError: undefined,
    };
  } catch (error) {
    console.error(
      'Unable to refresh Hiffs Connect access token',
      error,
    );

    return {
      ...token,
      accessToken: undefined,
      refreshToken: undefined,
      authError:
        'RefreshAccessTokenError',
    };
  }
}

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
          const payload =
            (await response
              .json()
              .catch(() => null)) as {
              code?: string;
            } | null;

          if (
            payload?.code ===
            'EMAIL_NOT_VERIFIED'
          ) {
            throw new Error(
              'EMAIL_NOT_VERIFIED',
            );
          }

          if (
            payload?.code ===
            'PHONE_NOT_VERIFIED'
          ) {
            throw new Error(
              'PHONE_NOT_VERIFIED',
            );
          }

          return null;
        }

        const apiUser =
          (await response.json()) as ApiAuthUser;

        const membership =
          apiUser.memberships?.[0];

        const accessTokenExpiresAt =
          parseExpiry(
            apiUser.accessTokenExpiresAt,
          );

        const refreshTokenExpiresAt =
          parseExpiry(
            apiUser.refreshTokenExpiresAt,
          );

        if (
          !apiUser.accessToken ||
          !apiUser.refreshToken ||
          !accessTokenExpiresAt ||
          !refreshTokenExpiresAt
        ) {
          return null;
        }

        const user: AppUser = {
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.name,
          image: apiUser.image,

          businessId:
            membership?.businessId ??
            null,

          businessName:
            membership?.businessName ??
            null,

          businessRole:
            membership?.role ?? null,

          platformRole:
            apiUser.platformRole ??
            null,

          accessToken:
            apiUser.accessToken,

          accessTokenExpiresAt,

          refreshToken:
            apiUser.refreshToken,

          refreshTokenExpiresAt,
        };

        return user;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      let appToken =
        token as AppToken;

      /*
       * Initial credentials login.
       */
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

        appToken.accessTokenExpiresAt =
          appUser.accessTokenExpiresAt;

        appToken.refreshToken =
          appUser.refreshToken;

        appToken.refreshTokenExpiresAt =
          appUser.refreshTokenExpiresAt;

        appToken.authError =
          undefined;

        return appToken;
      }

      /*
       * Existing session with a valid
       * access token. Refresh five
       * minutes before expiry.
       */
      if (
        appToken.accessToken &&
        appToken.accessTokenExpiresAt &&
        Date.now() <
          appToken.accessTokenExpiresAt -
            REFRESH_BUFFER_MS
      ) {
        return appToken;
      }

      /*
       * Access token is missing,
       * expired or approaching expiry.
       */
      appToken =
        await refreshAccessToken(
          appToken,
        );

      return appToken;
    },

    async session({
      session,
      token,
    }) {
      const appToken =
        token as AppToken;

      if (session.user) {
        const sessionUser =
          session.user as AppSessionUser;

        sessionUser.id =
          appToken.userId ?? '';

        sessionUser.businessId =
          appToken.businessId ??
          null;

        sessionUser.businessName =
          appToken.businessName ??
          null;

        sessionUser.businessRole =
          appToken.businessRole ??
          null;

        sessionUser.platformRole =
          appToken.platformRole ??
          null;

        sessionUser.accessToken =
          appToken.accessToken ??
          null;
      }

      (
        session as AppSession
      ).authError =
        appToken.authError;

      return session;
    },
  },
};