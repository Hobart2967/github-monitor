export interface RepoModel {
  name: string;
  default_branch: string;
  archived: boolean;
  owner: {
    login: string;
  }
}
