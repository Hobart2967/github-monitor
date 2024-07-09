import './RepoWorkflows.scss';

import { createEffect, createResource, For, Show } from 'solid-js';

import { RepoModel } from '../../../shared/RepoModel';
import { githubApi } from '../samples/electron-store';

export function RepoWorkflows(props: { repo: RepoModel, branch: string, onWorkflowsLoaded?: (workflows: any[]) => void }) {
  const maxShown = 5;
  const [workflowRuns] = createResource(() => refreshWorkflows(props.repo));

  createEffect(() => {
    if (!props.onWorkflowsLoaded || !Array.isArray(workflowRuns())) {
      return;
    }
    props.onWorkflowsLoaded(workflowRuns() || []);
  });

  const maximumDuration = () => {
    let max = 0;
    for (const run of workflowRuns()!.slice(0, maxShown)) {
      max = Math.max(max, calculateDuration(run));
    }
    return max;
  };

  const minimumDuration = () => {
    let min = Number.MAX_VALUE;
    for (const run of workflowRuns()!.slice(0, maxShown)) {
      min = Math.min(min, calculateDuration(run));
    }
    return min;
  };

  function getStatusClass(workflowRun: any) {
    if (workflowRun.status === 'in_progress') {
      return 'workflow-chart__bar--in-progress';
    }
    if (workflowRun.conclusion) {
      return 'workflow-chart__bar--' + workflowRun.conclusion;
    }
    return '';
  }


  async function refreshWorkflows(repo: RepoModel): Promise<any[]> {
    const workflows = await githubApi.listWorkflowRuns(repo.owner.login, repo.name, props.branch);

    return workflows.slice(0, maxShown);
  }

  const branchState = () => {
    const [mostRecent] = [...workflowRuns() || []].sort((a, b) => {
      const aDate = new Date(a.updated_at);
      const bDate = new Date(b.updated_at);

      return bDate.getTime() - aDate.getTime();
    });

    if (!mostRecent) {
      return '';
    }

    const state = mostRecent.status === 'in_progress'
      ? '--checking'
      : `--${mostRecent.conclusion}`;

    return `branch-name${state}`
  }

  function calculateDuration(workflowRun: any): number {
    const created = new Date(workflowRun.created_at);
    const updated = new Date(workflowRun.updated_at);

    const duration = updated.getTime() - created.getTime();

    return duration;
  }

  function durationHeight(duration: number): string {
    const high = maximumDuration() - minimumDuration();

    const percentage =  (duration - minimumDuration()) / high * 100;
    return `height: ${Math.max(5, percentage)}%`;
  }

  return <>
    <Show when={workflowRuns.loading}>
      <div class="repo-workflows">
        <div class={"branch-name skeleton skeleton-text skeleton--active" + branchState()}></div>
        <div class={"d-flex workflow-chart g-3 "}>
          <a class="workflow-chart__bar workflow-chart__bar--skeleton"></a>
          <a class="workflow-chart__bar workflow-chart__bar--skeleton"></a>
          <a class="workflow-chart__bar workflow-chart__bar--skeleton"></a>
          <a class="workflow-chart__bar workflow-chart__bar--skeleton"></a>
          <a class="workflow-chart__bar workflow-chart__bar--skeleton"></a>
        </div>
      </div>
    </Show>

    <Show when={workflowRuns()?.length}>
      <div class="repo-workflows">
        <div class={"branch-name " + branchState()}>
          <Show when={props.repo.default_branch === props.branch}><b>{props.branch}</b></Show>
          <Show when={props.repo.default_branch !== props.branch}>{props.branch}</Show>
        </div>
        <div class={"d-flex workflow-chart g-3 "}>
          <For each={workflowRuns()}>{(workflowRun) =>
            <a
              class={"workflow-chart__bar " + getStatusClass(workflowRun)}
              style={durationHeight(calculateDuration(workflowRun))}
              href={workflowRun.html_url}
              target='_blank'>
            </a>
          }</For>
        </div>
      </div>
    </Show>
  </>;
}
