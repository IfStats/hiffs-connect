import Link from 'next/link';
import { redirect } from 'next/navigation';

import { VerifyPhoneForm } from './components/verify-phone-form';

type Props = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function VerifyPhonePage({
  searchParams,
}: Props) {
  const params =
    await searchParams;

  const email =
    params.email?.trim().toLowerCase();

  if (!email) {
    redirect('/signup');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <div className="w-full">
        <Link
          href="/"
          className="mx-auto mb-8 flex w-fit items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-black text-white">
            HC
          </div>

          <div>
            <p className="font-bold text-slate-950">
              Hiffs Connect
            </p>

            <p className="text-xs text-slate-500">
              Business Messaging
            </p>
          </div>
        </Link>

        <div className="flex justify-center">
          <VerifyPhoneForm
            email={email}
          />
        </div>
      </div>
    </main>
  );
}