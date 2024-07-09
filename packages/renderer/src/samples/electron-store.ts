import { IGithubApi } from '../../../shared/IGitHubApi';

// Usage of 'electron-store'
export const githubApi = new Proxy<IGithubApi>({} as any, {
  get(target, prop, receiver) {
    return async (...args: any[]) => {
      const { invoke } = window.ipcRenderer
      let value = await invoke('github-api', prop, ...args)
      try {
        value = JSON.parse(value)
      } finally {
        return value
      }
    }
  },
});