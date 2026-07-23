import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'

/**
 * Custom Payload storage adapter that stores uploaded files directly in a
 * GitHub repository via the Contents API, instead of a paid cloud storage
 * service (Vercel Blob, S3, etc).
 *
 * Why this exists: the university has no storage budget, and files uploaded
 * through Payload's normal drag-and-drop button need somewhere durable to
 * live regardless of which server eventually hosts this site. GitHub is
 * free, already the project's source of truth, and can serve file bytes
 * directly over HTTPS via the raw.githubusercontent.com CDN — so no
 * additional storage service is required.
 *
 * How it works:
 *  - handleUpload: takes the uploaded file's buffer and commits it to the
 *    configured GitHub repo/branch/path using the Contents API (PUT
 *    /repos/{owner}/{repo}/contents/{path}), base64-encoded as required by
 *    that endpoint.
 *  - generateURL: returns the public raw.githubusercontent.com URL for the
 *    file, which the website (and Payload's own admin previews) can load
 *    directly — no proxying through Payload's server required.
 *  - handleDelete: removes the file from the repo when the corresponding
 *    Payload document is deleted. GitHub's delete endpoint requires the
 *    blob's current SHA, so this looks the file up first.
 *  - staticHandler: a fallback that redirects to the same raw GitHub URL,
 *    in case anything still requests a file through Payload's own
 *    /api/media/file/:filename route rather than using generateURL's
 *    direct link.
 *
 * Required environment variables (set these in Railway/Vercel/wherever this
 * runs — never commit them):
 *  - GITHUB_TOKEN        A GitHub Personal Access Token with "repo" scope
 *                        (Contents: Read and write) for the target repo.
 *  - GITHUB_REPO_OWNER   e.g. "talakherawish"
 *  - GITHUB_REPO_NAME    e.g. "Dignity"
 *  - GITHUB_REPO_BRANCH  e.g. "main" (defaults to "main" if unset)
 *  - GITHUB_UPLOADS_PATH Folder inside the repo where uploads are committed,
 *                        e.g. "public/uploads" (defaults to "public/uploads")
 *
 * Rate limits: GitHub's Contents API allows generous but not unlimited
 * traffic, and creating content in quick succession can trigger a
 * temporary "secondary rate limit" (HTTP 403 / 429). This adapter retries
 * once with a short backoff on that specific error, which comfortably
 * covers a real editor uploading a handful of files in a row. If the
 * initiative ever needs true bulk/automated uploads (hundreds of files
 * scripted back-to-back), that should go through the GitHub web upload UI
 * or a batching script instead of this live adapter.
 */

interface GithubStorageAdapterArgs {
  token: string
  owner: string
  repo: string
  branch?: string
  uploadsPath?: string
}

interface GithubContentsApiFile {
  sha: string
}

const GITHUB_API_BASE = 'https://api.github.com'

function buildRepoPath(uploadsPath: string, filename: string): string {
  // Normalize slashes and strip any leading/trailing slash so we always end
  // up with a clean "public/uploads/filename.ext" style path, regardless of
  // how uploadsPath was configured.
  const cleanedUploadsPath = uploadsPath.replace(/^\/+|\/+$/g, '')
  const cleanedFilename = filename.replace(/^\/+/, '')
  return `${cleanedUploadsPath}/${cleanedFilename}`
}

function buildRawUrl(owner: string, repo: string, branch: string, repoPath: string): string {
  const encodedPath = repoPath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodedPath}`
}

async function githubApiRequest(
  url: string,
  init: RequestInit,
  token: string,
  retryOnce = true,
): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  // GitHub's secondary rate limit shows up as 403 or 429. A single short
  // backoff-and-retry comfortably covers a real person uploading a handful
  // of files in a row; anything heavier should not go through this adapter.
  if ((response.status === 403 || response.status === 429) && retryOnce) {
    const retryAfterHeader = response.headers.get('retry-after')
    const waitMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 2000
    await new Promise((resolve) => setTimeout(resolve, waitMs))
    return githubApiRequest(url, init, token, false)
  }

  return response
}

async function getExistingFileSha(
  owner: string,
  repo: string,
  branch: string,
  repoPath: string,
  token: string,
): Promise<string | undefined> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${repoPath}?ref=${branch}`
  const response = await githubApiRequest(url, { method: 'GET' }, token)
  if (!response.ok) {
    // 404 just means the file doesn't exist yet — that's fine for a create.
    return undefined
  }
  const json = (await response.json()) as GithubContentsApiFile
  return json.sha
}

export function createGithubStorageAdapter({
  token,
  owner,
  repo,
  branch = 'main',
  uploadsPath = 'public/uploads',
}: GithubStorageAdapterArgs): Adapter {
  return () => ({
    name: 'github-contents',

    generateURL: ({ filename }) => {
      const repoPath = buildRepoPath(uploadsPath, filename)
      return buildRawUrl(owner, repo, branch, repoPath)
    },

    handleUpload: async ({ data, file }) => {
      const { buffer, filename, mimeType } = file
      const repoPath = buildRepoPath(uploadsPath, filename)
      const base64Content = buffer.toString('base64')

      // If a file already exists at this path (e.g. same filename reused),
      // GitHub requires the current blob's sha to overwrite it.
      const existingSha = await getExistingFileSha(owner, repo, branch, repoPath, token)

      const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${repoPath}`
      const response = await githubApiRequest(
        url,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Add media upload: ${filename}`,
            content: base64Content,
            branch,
            ...(existingSha ? { sha: existingSha } : {}),
          }),
        },
        token,
      )

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(
          `GitHub upload failed for "${filename}" (${mimeType}): ${response.status} ${errorBody}`,
        )
      }

      return data
    },

    handleDelete: async ({ filename }) => {
      const repoPath = buildRepoPath(uploadsPath, filename)
      const sha = await getExistingFileSha(owner, repo, branch, repoPath, token)

      // Nothing to delete if the file was never actually committed —
      // don't throw, just no-op so a Payload document delete never fails
      // because of a missing remote file.
      if (!sha) return

      const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${repoPath}`
      const response = await githubApiRequest(
        url,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Remove media upload: ${filename}`,
            sha,
            branch,
          }),
        },
        token,
      )

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`GitHub delete failed for "${filename}": ${response.status} ${errorBody}`)
      }
    },

    staticHandler: async (_req, { params: { filename } }) => {
      const repoPath = buildRepoPath(uploadsPath, filename)
      const rawUrl = buildRawUrl(owner, repo, branch, repoPath)
      return Response.redirect(rawUrl, 302)
    },
  })
}
