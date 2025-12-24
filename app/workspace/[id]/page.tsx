import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { UserSessionData, userSessionOptions } from '@/lib/user-session';
import { query } from '@/lib/db';
import WorkspaceItemClient from './WorkspaceItemClient';

export const metadata: Metadata = {
  title: 'Workspace Item | VCM Suite',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkspaceItemPage({ params }: Props) {
  const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
  
  if (!session.isLoggedIn || !session.userId) {
    redirect('/login?redirect=/workspace');
  }

  const { id } = await params;

  const result = await query(
    `UPDATE workspace_items 
     SET last_opened_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id, title, type, cloud_id, tool_id, workflow_id, is_starred, 
               preview_text, payload_json, thumbnail_url, created_at, updated_at, last_opened_at`,
    [id, session.userId]
  );

  if (result.rows.length === 0) {
    notFound();
  }

  return <WorkspaceItemClient item={result.rows[0]} />;
}
