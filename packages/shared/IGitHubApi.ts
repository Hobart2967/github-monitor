import { Branch } from './Branch';
import { Comparison } from './Comparison';
import { RepoModel } from './RepoModel';

export interface IGithubApi {
  deleteCache(): Promise<void>;
  setToken(token: string): void;
  getOpenPullRequests(login: string, name: string): any;
  listRepositories(owner: string): Promise<RepoModel[]>;
  compareCommits(owner: string, repo: string, base: string, head: string): Promise<Comparison>;
  listBranches(owner: string, repo: string): Promise<Branch[]>;
  listWorkflowRuns(owner: string, repo: string, branch: string): Promise<any[]>;
}