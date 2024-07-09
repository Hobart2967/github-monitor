import './RepoStats.scss';

import { createResource } from 'solid-js';

import { RepoModel } from '../../../shared/RepoModel';
import { githubApi } from '../samples/electron-store';
import { KpiInfo } from './BranchInfo';

interface BranchStats {
  name: string;
  ahead_by: number;
  behind_by: number;
}

interface BranchesStatCollection {
  all: BranchStats[];
  featureBranches: BranchStats[];
  finished: BranchStats[];
  open: BranchStats[];
}

export function RepoStats(props: { repo: RepoModel }) {
  const maxShown = 15;
  const [branches] = createResource(() => getBranchInfo(props.repo));
  const [openPullRequests] = createResource(() => githubApi.getOpenPullRequests(props.repo.owner.login, props.repo.name));

  async function getBranchInfo(repo: RepoModel): Promise<BranchesStatCollection> {
    const branches = await githubApi.listBranches(repo.owner.login, repo.name);
    const branchInfos = await Promise.all(branches
      .filter(x => x.name !== repo.default_branch)
      .map(async (branch) => {
      const comparison = await githubApi.compareCommits(repo.owner.login, repo.name, repo.default_branch, branch.name);

      return {
        name: branch.name,
        ahead_by: comparison.ahead_by,
        behind_by: comparison.behind_by,
      };
    }));
    return {
      all: branchInfos,
      featureBranches: branchInfos.filter(x => !(['master', 'develop'].includes(x.name))),
      finished: branchInfos.filter(x => !(['master', 'develop'].includes(x.name))).filter(x => x.ahead_by === 0),
      open: branchInfos.filter(x => x.ahead_by > 0),
    };
  }


  return <div class="repo-stats  d-flex g-8 mt-8">
    <KpiInfo type='open' count={branches()?.featureBranches.length || 0} link={`https://github.com/${props.repo.owner.login}/${props.repo.name}/branches/all`} />
    <KpiInfo type='merged' count={branches()?.finished.length || 0} link={`https://github.com/${props.repo.owner.login}/${props.repo.name}/branches/all`} />
    <KpiInfo type='pr' count={openPullRequests()?.length || 0} link={`https://github.com/${props.repo.owner.login}/${props.repo.name}/pulls`} />
  </div>;
}

