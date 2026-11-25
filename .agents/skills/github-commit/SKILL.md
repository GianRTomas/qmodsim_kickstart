---
name: github-commit
description: >-
  Use this skill whenever the user asks to commit, push, sync, or add changes to GitHub
  (e.g., "add to github", "push and commit", "commit to git", "update github").
  Handles locating the Git binary via GitHub Desktop on Windows, staging and committing changes,
  pushing to origin, and keeping the local workspace and GitHub Desktop mirror repository in sync.
---

# GitHub Commit & Sync Skill

Follow this procedure whenever the user asks to commit, push, or sync changes to GitHub.

## 1. Locate the Git Executable (Windows)

The `git` command is often not in the default PowerShell `PATH` on this machine and is instead bundled inside GitHub Desktop. Always resolve `$git` at the start of your PowerShell command:

```powershell
$git = (Get-Command git -ErrorAction SilentlyContinue).Source
if (-not $git) {
  $git = Get-ChildItem -Path "$env:LOCALAPPDATA\GitHubDesktop" -Filter "git.exe" -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -like "*\cmd\git.exe" } |
    Select-Object -First 1 -ExpandProperty FullName
}
```

## 2. Stage, Commit, and Push in the Active Workspace

1. **Check status**:
   Run `& $git status --short` to verify modified and untracked files.
2. **Stage and commit**:
   Stage the relevant files (or `& $git add -A`) and commit with a clear, concise imperative message describing the changes:
   ```powershell
   & $git add -A
   & $git commit -m "<Concise imperative summary of changes>"
   ```
3. **Push to remote**:
   Push directly to `origin main` (or the current active branch):
   ```powershell
   & $git push origin main
   ```

## 3. Synchronize Mirror Repository (Fatama Workspace)

When working in `c:\Users\jiyan\Desktop\fatama`, a mirror clone exists at `C:\Users\Jiyan\Documents\GitHub\fatama` (tracked by GitHub Desktop).

**Important**: Do not create a separate duplicate commit in the mirror repository, as that creates divergent commit hashes when pushing to the same remote. Instead, after pushing from `c:\Users\jiyan\Desktop\fatama`, fast-forward/reset the mirror repository to match `origin/main`:

```powershell
if (Test-Path "C:\Users\Jiyan\Documents\GitHub\fatama\.git") {
  Set-Location "C:\Users\Jiyan\Documents\GitHub\fatama"
  & $git fetch origin main
  & $git reset --hard origin/main
  & $git status --short
}
```

*(If `git push` from the workspace was not possible, pull directly from the workspace into the mirror using `& $git pull "c:\Users\jiyan\Desktop\fatama" main` and then push).*

## 4. Fallback if Authentication Prompts Hang

If `& $git push` ever times out or fails due to interactive credential prompts:
1. Ensure the commit is synced to `C:\Users\Jiyan\Documents\GitHub\fatama`.
2. Launch GitHub Desktop so the user can push with one click:
   ```powershell
   if (Test-Path "$env:LOCALAPPDATA\GitHubDesktop\GitHubDesktop.exe") {
     Start-Process "$env:LOCALAPPDATA\GitHubDesktop\GitHubDesktop.exe"
   }
   ```

## 5. Verification

Always verify and report back to the user:
- The latest commit hash (`& $git log -n 1 --oneline`)
- That `working tree clean` and `Your branch is up to date with 'origin/main'` are confirmed.

