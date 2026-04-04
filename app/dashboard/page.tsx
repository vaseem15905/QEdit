import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import { QuestionPaperRecord } from '@/types';
import { getAdminRole } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const email = user.email || '';

  // Fetch user's own papers
  const { data: ownPapers } = await supabase
    .from('question_papers')
    .select('*')
    .eq('owner_email', email)
    .order('updated_at', { ascending: false });

  // Fetch papers shared with user
  const { data: collabs } = await supabase
    .from('collaborations')
    .select('paper_id')
    .eq('collaborator_email', email);

  let sharedPapers: QuestionPaperRecord[] = [];
  if (collabs && collabs.length > 0) {
    const paperIds = collabs.map(c => c.paper_id);
    const { data: shared } = await supabase
      .from('question_papers')
      .select('*')
      .in('id', paperIds)
      .order('updated_at', { ascending: false });
    sharedPapers = (shared || []) as QuestionPaperRecord[];
  }

  const allOwn = (ownPapers || []) as QuestionPaperRecord[];
  const drafts = allOwn.filter(p => p.status === 'draft');
  const saved = allOwn.filter(p => p.status === 'saved');

  // Check if they are admin or superadmin
  const adminCheck = await getAdminRole();

  return (
    <DashboardClient
      user={{ email, name: user.user_metadata?.full_name || email }}
      drafts={drafts}
      savedPapers={saved}
      sharedPapers={sharedPapers}
      isAdmin={adminCheck.ok}
    />
  );
}
