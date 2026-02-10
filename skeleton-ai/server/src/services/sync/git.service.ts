import simpleGit, { SimpleGit, SimpleGitOptions } from "simple-git";
import fs from "fs/promises";
import path from "path";

const REPO_BASE_PATH = process.env.SYNC_REPO_PATH || "/app/repos";

function getRepoPath(repoId: string): string {
  return path.join(REPO_BASE_PATH, repoId);
}

function getGit(repoPath: string): SimpleGit {
  const options: Partial<SimpleGitOptions> = {
    baseDir: repoPath,
    binary: "git",
    maxConcurrentProcesses: 1,
    trimmed: true,
  };
  return simpleGit(options);
}

export async function cloneRepo(
  repoId: string,
  repoUrl: string,
  branch?: string,
  token?: string
): Promise<{ commitHash: string }> {
  const repoPath = getRepoPath(repoId);

  // Ensure parent directory exists
  await fs.mkdir(path.dirname(repoPath), { recursive: true });

  // Inject token for private repos
  let authUrl = repoUrl;
  if (token && repoUrl.startsWith("https://")) {
    const url = new URL(repoUrl);
    url.username = "x-access-token";
    url.password = token;
    authUrl = url.toString();
  }

  const cloneOptions = ["--depth", "1"];
  if (branch) {
    cloneOptions.push("--branch", branch);
  }

  const git = simpleGit();
  await git.clone(authUrl, repoPath, cloneOptions);

  const repoGit = getGit(repoPath);
  const log = await repoGit.log({ maxCount: 1 });
  return { commitHash: log.latest?.hash || "" };
}

export async function pullRepo(
  repoId: string,
  token?: string,
  repoUrl?: string
): Promise<{ commitHash: string; changed: boolean; changedFiles: string[] }> {
  const repoPath = getRepoPath(repoId);
  const git = getGit(repoPath);

  // Update remote URL with token if provided
  if (token && repoUrl && repoUrl.startsWith("https://")) {
    const url = new URL(repoUrl);
    url.username = "x-access-token";
    url.password = token;
    try {
      await git.remote(["set-url", "origin", url.toString()]);
    } catch {
      // Ignore if remote doesn't exist
    }
  }

  // Unshallow if needed for diff
  try {
    await git.fetch(["--unshallow"]);
  } catch {
    await git.fetch();
  }

  const beforeHash = (await git.log({ maxCount: 1 })).latest?.hash || "";

  await git.pull();

  const afterHash = (await git.log({ maxCount: 1 })).latest?.hash || "";
  const changed = beforeHash !== afterHash;

  let changedFiles: string[] = [];
  if (changed && beforeHash) {
    try {
      const diff = await git.diffSummary([beforeHash, afterHash]);
      changedFiles = diff.files.map((f) => f.file);
    } catch {
      // If diff fails (e.g., shallow clone), treat all files as changed
      changedFiles = [];
    }
  }

  return { commitHash: afterHash, changed, changedFiles };
}

export async function getHeadCommit(repoId: string): Promise<string> {
  const repoPath = getRepoPath(repoId);
  const git = getGit(repoPath);
  const log = await git.log({ maxCount: 1 });
  return log.latest?.hash || "";
}

export async function listBranches(repoId: string): Promise<string[]> {
  const repoPath = getRepoPath(repoId);
  const git = getGit(repoPath);
  const branches = await git.branch(["-r"]);
  return branches.all
    .map((b) => b.replace("origin/", ""))
    .filter((b) => b !== "HEAD");
}

export async function checkoutBranch(
  repoId: string,
  branch: string
): Promise<void> {
  const repoPath = getRepoPath(repoId);
  const git = getGit(repoPath);
  await git.checkout(branch);
}

export async function isRepo(repoId: string): Promise<boolean> {
  const repoPath = getRepoPath(repoId);
  try {
    const git = getGit(repoPath);
    return await git.checkIsRepo();
  } catch {
    return false;
  }
}

export async function removeRepo(repoId: string): Promise<void> {
  const repoPath = getRepoPath(repoId);
  try {
    await fs.rm(repoPath, { recursive: true, force: true });
  } catch {
    // Ignore if directory doesn't exist
  }
}

export function getRepoFullPath(repoId: string): string {
  return getRepoPath(repoId);
}
