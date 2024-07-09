import { ipcMain } from 'electron';
import fs from 'fs';
import fetch, { RequestInfo, RequestInit } from 'node-fetch';
import path from 'path';

import { Comparison } from '../../shared/Comparison';
import { IGithubApi } from '../../shared/IGitHubApi';

/**
 * Example of 'electron-store' usage.
 */
interface QueueItem<T> {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  op: () => Promise<T>;
  promise: Promise<T>;
}

class RequestQueue {
  private queue: Array<QueueItem<unknown>> = [];
  private currentPoints = 0;
  private currentJobCount = 0;
  locked: boolean = false;

  public constructor(
    private readonly config: {
      maxPoints: number,
      period: number,
      timeout: number,
      parallelity: number
    }) { }

  /**
   * Schedules the specified operation to run later.
   * @param op The operation to schedule.
   */
  public schedule<T>(op: () => Promise<T>): Promise<T> {
    let queueItem = {
      op,
    } as QueueItem<unknown>;

    queueItem.promise = new Promise<T>((resolve, reject) => {
      queueItem.reject = reject;
      queueItem.resolve = resolve as (value: unknown) => void;
    })

    this.queue.push(queueItem);

    this.tryNextSchedule();

    return queueItem.promise as Promise<T>;
  }

  private isLocked(): boolean {
    if (this.config.parallelity > 1) {
      return this.config.parallelity < this.currentJobCount;
    }

    return this.locked;
  }

  private tryNextSchedule() {
    if (this.isLocked() || !this.queue.length) {
      return;
    }

    if (this.currentPoints >= this.config.maxPoints) {
      setTimeout(() => this.tryNextSchedule(), this.config.timeout);
      return;
    }

    this.locked = true;
    if (this.config.parallelity > 1) {
      this.currentJobCount++;
    }

    this.incresePoints();

    const finalize = () => {
      this.currentJobCount--;
      setTimeout(() => this.decreasePoints(), this.config.period);
      this.locked = false;
      if (this.config.parallelity === 1) {
        this.tryNextSchedule();
      }
    }

    const queueItem = this.queue.pop()!;
    const result = queueItem.op();
    if (this.config.parallelity > 1) {
      this.tryNextSchedule();
    }

    result.then(result => {
        queueItem.resolve(result);
        finalize();
      })
      .catch(error => {
        queueItem.reject(error);
        finalize();
      });
  }

  private decreasePoints(): void {
    this.currentPoints--;
    console.log('Points Decreased To: ', this.currentPoints);
    this.tryNextSchedule();
  }

  private incresePoints() {
    this.currentPoints++;
    console.log('Points Increased To: ', this.currentPoints);
  }
}
class GithubApi implements IGithubApi {
  private basePath: string;
  private bottleNeck = new RequestQueue({
    parallelity: 50,
    maxPoints: 200,
    period: 5 * 1000,
    timeout: 100
  });
  private rimrafOp: Promise<boolean>|null = null;

  private _token?: string;

  public constructor() {
    this.basePath = path.join(process.cwd(), 'tmp');
  }

  public setToken(token: string): void {
    this._token = token;
  }

  public async deleteCache(): Promise<void> {
    fs.rmSync(this.basePath, { recursive: true, force: true });
  }

  public async getOpenPullRequests(owner: string, repo: string) {
    console.log('getOpenPullRequests', owner, repo);
    let pageContent: Array<any> = [];
    let page = 1;
    let results: Array<any> = [];
    do {
      console.log('listBranches', owner, repo, page, pageContent.length);
      const response = await this.fetchIt(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open&page=${page}`, {
        headers: {
          Authorization: 'Bearer ' + this._token,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });


      if (response.status < 200 || response.status >= 300 ) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }

      pageContent = await response.json();
      results = [...results, ...pageContent];

      page++;
    } while(pageContent.length);
    console.log('END getOpenPullRequests', owner, repo);

    return results;
  }

  public async listRepositories(owner: string) {
    console.log('listRepositories', owner)
    let pageContent: Array<any> = [];
    let page = 1;
    let results: Array<any> = [];
    do {
      console.log('listRepositories', owner, page, pageContent.length);
      const response = await this.fetchIt(`https://api.github.com/orgs/${owner}/repos?page=${page}`, {
        headers: {
          Authorization: 'Bearer ' + this._token
        }
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }

      pageContent = await response.json();
      results = [...results, ...pageContent];

      page++;
    } while(pageContent.length);
    console.log('END listRepositories', owner)
    return results;

  }

  public async compareCommits(owner: string, repo: string, base: string, head: string): Promise<Comparison> {
    console.log('compareCommits', owner, repo, base, head);
    const response = await this.fetchIt(`https://api.github.com/repos/${owner}/${repo}/compare/${base}...${head}`, {
      headers: {
        Authorization: 'Bearer ' + this._token,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (response.status < 200 || response.status >= 300 ) {
      throw new Error(`${response.status}: ${await response.text()}`);
    }

    console.log('END compareCommits', owner, repo, base, head);
    return await response.json();
  }

  public async listBranches(owner: string, repo: string) {
    console.log('listBranches', owner, repo);
    let pageContent: Array<any> = [];
    let page = 1;
    let results: Array<any> = [];
    do {
      console.log('listBranches', owner, repo, page, pageContent.length);
      const response = await this.fetchIt(`https://api.github.com/repos/${owner}/${repo}/branches?page=${page}`, {
        headers: {
          Authorization: 'Bearer ' + this._token,
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });


      if (response.status < 200 || response.status >= 300 ) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }

      pageContent = await response.json();
      results = [...results, ...pageContent];

      page++;
    } while(pageContent.length);

    console.log('END listBranches', owner)
    return results;
  }


  public async listWorkflowRuns(owner: string, repo: string, branch: string) {
    console.log(`Requested to load workflow runs for ${owner}/${repo}`)
    const response = await this.fetchIt(`https://api.github.com/repos/${owner}/${repo}/actions/runs?branch=${branch}`, {
      headers: {
        Authorization: 'Bearer ' + this._token,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`${response.status}: ${await response.text()}`);
    }

    console.log('END listWorkflowRuns', owner, repo)
    return (await response.json()).workflow_runs;
  }

  private async fetchIt(url: RequestInfo, init?: RequestInit): Promise<fetch.Response> {
    if (this.rimrafOp) {
      await this.rimrafOp;
    }

    const urlString = url as string;
    const filePath = urlString
      .replace(/^https:\/\//, '')
      .replace(/\?/, '_')
      .replace(/\&/, '_')
      .replace(/\=/, '_') + '.json';

    const cacheFilePath = path.join(this.basePath, filePath);

    if (!fs.existsSync(cacheFilePath)) {
      fs.mkdirSync(path.dirname(cacheFilePath), { recursive: true });
    }

    // check if filepath exists and return content from filePath
    if (fs.existsSync(cacheFilePath)) {
      const stored = JSON.parse(fs.readFileSync(cacheFilePath).toString());
      return {
        status: stored.status,
        json: () => stored.data
      } as fetch.Response;
    }

    const response = await this.bottleNeck.schedule(() => fetch(url, init));
    const result = await response.json();
    // Write result to filePath as json
    if (response.status >= 200 && response.status < 300 && !fs.existsSync(cacheFilePath)) {
      fs.writeFileSync(cacheFilePath, JSON.stringify({
        status: response.status,
        data: result
      }));
    }

    return {
      status: response.status,
      json: () => result
    } as fetch.Response;
  }
}
/**
 * Expose 'electron-store' to Renderer-process through 'ipcMain.handle'
 */

const store = new GithubApi();

ipcMain.handle(
  'github-api',
  async (_evnet, methodSign: string, ...args: any[]) => {

    console.log('methodSign', methodSign);

    let result;
    if (typeof (store as any)[methodSign] === 'function') {
      result = (store as any)[methodSign](...args);
    } else {
      result = (store as any)[methodSign];
    }

    return result;
  }
);
