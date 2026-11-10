import type { Project } from './ProjectEditor'

const STORAGE_KEY = 'ccc-projects-v1'
const STATUSES = ['Planned', 'Active', 'Blocked', 'Completed']

type LoadResult = {
  projects: Project[]
  snapshot: string | null | undefined
  error: string
}

type SaveResult =
  | { ok: true; snapshot: string }
  | { ok: false; error: string }

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length <= maxLength
}

function isRepository(value: string): boolean {
  if (!value) return true

  try {
    const url = new URL(value)
    const parts = url.pathname.split('/').filter(Boolean)

    return (
      url.protocol === 'https:' &&
      url.hostname === 'github.com' &&
      !url.username &&
      !url.password &&
      !url.port &&
      !url.search &&
      !url.hash &&
      parts.length === 2
    )
  } catch {
    return false
  }
}

function isProject(value: unknown): value is Project {
  if (typeof value !== 'object' || value === null) return false

  const project = value as Record<string, unknown>

  return (
    isText(project.id, 100) &&
    project.id.trim().length > 0 &&
    isText(project.name, 100) &&
    project.name.trim().length > 0 &&
    isText(project.category, 100) &&
    isText(project.description, 2000) &&
    typeof project.status === 'string' &&
    STATUSES.includes(project.status) &&
    isText(project.repository, 300) &&
    isRepository(project.repository)
  )
}

function isProjectList(value: unknown): value is Project[] {
  if (!Array.isArray(value) || value.length === 0) return false
  if (!value.every(isProject)) return false

  return new Set(value.map(project => project.id)).size === value.length
}

export function loadProjects(fallback: Project[]): LoadResult {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (raw === null) {
      return { projects: fallback, snapshot: null, error: '' }
    }

    const parsed: unknown = JSON.parse(raw)

    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid stored workspace')
    }

    const workspace = parsed as Record<string, unknown>

    if (workspace.version !== 1 || !isProjectList(workspace.projects)) {
      throw new Error('Invalid stored projects')
    }

    return {
      projects: workspace.projects,
      snapshot: raw,
      error: '',
    }
  } catch {
    return {
      projects: fallback,
      snapshot: undefined,
      error:
        'Saved projects could not be loaded. Showing sample projects. ' +
        'Project saving is blocked to protect existing data.',
    }
  }
}

export function saveProjects(
  projects: Project[],
  expectedSnapshot: string | null | undefined,
): SaveResult {
  if (expectedSnapshot === undefined) {
    return {
      ok: false,
      error: 'Saving is blocked because saved projects could not be loaded.',
    }
  }

  if (!isProjectList(projects)) {
    return { ok: false, error: 'Project data failed validation.' }
  }

  try {
    if (localStorage.getItem(STORAGE_KEY) !== expectedSnapshot) {
      return {
        ok: false,
        error:
          'Saved projects changed in another tab. Your edits remain in this ' +
          'form. Copy them before refreshing to load the latest data.',
      }
    }

    const snapshot = JSON.stringify({ version: 1, projects })
    localStorage.setItem(STORAGE_KEY, snapshot)

    return { ok: true, snapshot }
  } catch {
    return {
      ok: false,
      error:
        'Projects could not be saved. Your edits remain in this form. ' +
        'Browser storage may be unavailable or full.',
    }
  }
}
