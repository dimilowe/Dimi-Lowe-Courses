import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { UserSessionData, userSessionOptions } from '@/lib/user-session';
import WorkspaceClient from './WorkspaceClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Workspace | VCM Suite',
  description: 'Your files locker for course resources, notes, and homework.',
  robots: { index: false, follow: false },
};

export default async function WorkspacePage() {
  const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
  
  if (!session.isLoggedIn || !session.userId) {
    redirect('/login?redirect=/workspace');
  }

  return <WorkspaceClient />;
}
