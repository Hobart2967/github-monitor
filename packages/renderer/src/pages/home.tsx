import './home.scss';

import { createEffect, createResource, createSignal, For, Show } from 'solid-js';

import { RepoModel } from '../../../shared/RepoModel';
import { Input } from '../components/Input';
import { Repo } from '../components/Repo';
import { githubApi } from '../samples/electron-store';

export default function Home() {
  const [org, setOrg] = createSignal(localStorage.getItem('org') || '');
  const [token, setToken] = createSignal(localStorage.getItem('token') || '');
  githubApi.setToken(token());

  createEffect(() => {
    localStorage.setItem('org', org());
    localStorage.setItem('token', token());

    githubApi.setToken(token());
  });

  const [lastRefreshDate, setLastRefreshDate] = createSignal(new Date(Date.now()));
  async function forceRefresh() {
    await githubApi.deleteCache();
    setLastRefreshDate(new Date(Date.now()));
  }

  const fetchRepos = async (lastRefreshDate: Date) => {
    if (!org() || !token()) {
      return [];
    }

    console.log('Last refresh on ', lastRefreshDate);
    const repos = (await githubApi.listRepositories(org())).filter(x => !x.archived);

    return repos.sort((a: any, b: any) => a.name > b.name ? 1 : -1)
  }

  const [repos] = createResource(lastRefreshDate, fetchRepos);

  return (<>
    <header>
      <div class="d-flex home__action-bar m-8 g-8">
        <div class="d-flex flex">
          <Input
            label="Github Organization or User"
            value={org()}
            change={value => setOrg(value)}
            required={true}/>
        </div>
         <div class="d-flex flex">
          <Input
            label="Github Token"
            type="password"
            value={token()}
            change={value => setToken(value)}
            required={true}/>
        </div>
        <div><button onClick={() => forceRefresh()}>Refresh</button></div>
      </div>
    </header>
    <Show when={org() && token()}>
      <main>
        <div class="home">
          <div class="d-flex home__repo-list">
            <For each={repos()}>{(repo: RepoModel) =>
              <Repo repo={repo}></Repo>
            }</For>
          </div>
        </div>
      </main>
    </Show>

  </>);
}
