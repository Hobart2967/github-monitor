import './Repo.scss';

import { createSignal, Show } from 'solid-js';

import { RepoModel } from '../../../shared/RepoModel';
import { RepoStats } from './RepoStats';
import { RepoWorkflows } from './RepoWorkflows';

export function Repo(props: { repo: RepoModel }) {
  const [showMaster, setShowMaster] = createSignal(true);
  const [showDevelop, setShowDevelop] = createSignal(true);
  const showAny = () => showMaster() || showDevelop();

  return <>
    <Show when={showAny()}>
      <div class="repo">
        <div class="repo__title">
          <a href={`https://github.com/${props.repo.owner.login}/${props.repo.name}`} target="_blank">
            <b class="skeleton skeleton-text">{props.repo.name}</b>
          </a>
        </div>
        <div class="d-flex g-8 mt-16">
          <div class="repo__branches">
            <RepoWorkflows
              repo={props.repo}
              branch='master'
              onWorkflowsLoaded={(workflowRuns) => setShowMaster(!!workflowRuns.length)} />
          </div>
          <div class="repo__branches">
            <RepoWorkflows
              repo={props.repo}
              branch='develop'
              onWorkflowsLoaded={(workflowRuns) => setShowDevelop(!!workflowRuns.length)}/>
          </div>
        </div>
        <div class="repo__stats">
          <RepoStats repo={props.repo}></RepoStats>
        </div>
      </div>
    </Show>
  </>;
}