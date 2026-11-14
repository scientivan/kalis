import { KalisApp } from '../../components/kalis-app';
import { MarketplaceNext } from '../../components/marketplace-next';
import { MethodDetail } from '../../components/method-detail';
import { RunPage } from '../../components/run-page';
import * as P from '../../components/app-pages';
export const dynamic = 'force-dynamic';
export default async function Page({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path } = await params;
  if (path?.length === 2 && path[0] === 'marketplace' && (path[1] === 'mine' || path[1] === 'publish')) return <MarketplaceNext mine authorSection={path[1] === 'publish' ? "Drafts" : "Published"} />;
  if (path && path[0] === 'marketplace' && path[1] && path[1] !== 'mine' && path[1] !== 'publish' && path.length <= 3) return <MethodDetail id={decodeURIComponent(path[1])} tab={path[2]} />;
  const key = (path || []).join('/');
  const pages: Record<string, () => React.ReactElement> = {
    'runs/ongoing': () => <P.MyRunsPage section="Ongoing" />, 'runs/results': () => <P.MyRunsPage section="Results" />, 'runs': () => <P.MyRunsPage />, 'workspace': () => <P.MyRunsPage />, 'approvals': () => <P.ApprovalsPage />, 'activity': () => <P.ActivityPage />,
    'account': () => <P.AccountPage />, 'balance': () => <P.AccountPage />, 'community/proposals': () => <P.CommunityPage section="Proposals" />, 'community/issues': () => <P.ImprovementsPage section="Issues" />, 'community': () => <P.CommunityPage />, 'community/bounties': () => <P.ImprovementsPage />,
    'connectors': () => <P.ConnectionsPage />, 'connections': () => <P.ConnectionsPage />, 'workspace/files': () => <P.DocumentsPage />, 'workspace/memory': () => <P.NotesPage />,
  };
  if (pages[key]) return pages[key]();
  if (path?.length === 2 && path[0] === 'runs') return <RunPage runId={path[1] === 'new' ? undefined : decodeURIComponent(path[1])} />;
  if (path?.length === 2 && path[0] === 'experts') return <MarketplaceNext expert={decodeURIComponent(path[1])} />;
  return !path?.length || (path.length === 1 && path[0] === 'marketplace') ? <MarketplaceNext /> : <KalisApp />;
}
