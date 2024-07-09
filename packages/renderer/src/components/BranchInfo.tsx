import './BranchInfo.scss';

import { Show } from 'solid-js';

import BranchMerged from '/public/images/branch-merged.svg';
import BranchOpen from '/public/images/branch-open.svg';
import PullRequest from '/public/images/pull-request.svg';

export function KpiInfo(props: { count: number, link: string, type: string }) {
  return <>
    <Show when={props.count}>
      <a href={props.link} target="_blank">
        <div class={"kpi-info d-flex kpi-info--" + props.type}>
          <Show when={props.type === 'open'}><BranchOpen /></Show>
          <Show when={props.type === 'merged'}><BranchMerged /></Show>
          <Show when={props.type === 'pr'}><PullRequest /></Show>
          <div>{props.count}</div>
        </div>
      </a>
    </Show>
  </>
}