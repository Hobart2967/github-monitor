interface AuthorShort {
  name: string;
  email: string;
  date: string;
}

interface Commit {
  url: string;
  author: AuthorShort;
  committer: AuthorShort;
  message: string;
  tree: {
    url: string;
    sha: string;
  };
  comment_count: number;
  verification: {
    verified: boolean;
    reason: string;
    signature: any;
    payload: any;
  };
}

interface Author {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: "";
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
}

export interface CommitInfo {
  url: string;
  sha: string;
  node_id: string;
  html_url: string;
  comments_url: string;
  commit: Commit,
  author: Author,
  committer: Author,
  parents: Array<{
    url: string;
    sha: string;
  }>
}

interface File {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch: string;
}

export interface Comparison {
  url: string;
  html_url: string;
  permalink_url: string;
  diff_url: string;
  patch_url: string;
  base_commit: CommitInfo,
  merge_base_commit: CommitInfo,
  status: string;
  ahead_by: number;
  behind_by: number;
  total_commits: number;
  commits: Array<CommitInfo>,
  files: Array<File>
}