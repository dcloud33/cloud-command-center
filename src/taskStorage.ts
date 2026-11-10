export const TASK_STATUSES = [
  'Planned',
  'In progress',
  'Blocked',
  'Completed',
] as const

export type TaskStatus = typeof TASK_STATUSES[number]

export type CurrentTask = {
  projectId: string
  title: string
  status: TaskStatus
  nextStep: string
  notes: string
}

type LoadResult = {
  task: CurrentTask | null
  snapshot: string | null | undefined
  error: string
}

type SaveResult =
  | { ok: true; snapshot: string }
  | { ok: false; error: string }

function storageKey(projectId: string): string {
  return `ccc-task-v1:${projectId}`
}

function isText(value: unknown, limit: number): value is string {
  return typeof value === 'string' && value.length <= limit
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUSES.some(status => status === value)
}

export function isTask(value: unknown, projectId: string): value is CurrentTask {
  if (typeof value !== 'object' || value === null) return false

  const task = value as Record<string, unknown>

  return (
    task.projectId === projectId &&
    isText(task.title, 150) &&
    task.title.trim().length > 0 &&
    isTaskStatus(task.status) &&
    isText(task.nextStep, 1000) &&
    isText(task.notes, 5000)
  )
}

export function loadTask(projectId: string): LoadResult {
  try {
    const raw = localStorage.getItem(storageKey(projectId))

    if (raw === null) {
      return { task: null, snapshot: null, error: '' }
    }

    const parsed: unknown = JSON.parse(raw)

    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid stored task')
    }

    const record = parsed as Record<string, unknown>

    if (record.version !== 1 || !isTask(record.task, projectId)) {
      throw new Error('Stored task failed validation')
    }

    return { task: record.task, snapshot: raw, error: '' }
  } catch {
    return {
      task: null,
      snapshot: undefined,
      error:
        'This project’s saved task could not be loaded. ' +
        'Task saving is blocked to protect existing data.',
    }
  }
}

export function saveTask(
  task: CurrentTask,
  expectedSnapshot: string | null | undefined,
): SaveResult {
  if (expectedSnapshot === undefined) {
    return {
      ok: false,
      error: 'Saving is blocked because the saved task could not be loaded.',
    }
  }

  if (!isText(task.projectId, 100) || !task.projectId.trim()) {
    return { ok: false, error: 'A valid project ID is required.' }
  }

  if (!isTask(task, task.projectId)) {
    return { ok: false, error: 'Task data failed validation.' }
  }

  try {
    const key = storageKey(task.projectId)

    if (localStorage.getItem(key) !== expectedSnapshot) {
      return {
        ok: false,
        error:
          'This task changed in another tab. Your edits remain in the form. ' +
          'Copy them before refreshing.',
      }
    }

    const snapshot = JSON.stringify({ version: 1, task })
    localStorage.setItem(key, snapshot)

    return { ok: true, snapshot }
  } catch {
    return {
      ok: false,
      error:
        'The task could not be saved. Your edits remain in the form. ' +
        'Browser storage may be unavailable or full.',
    }
  }
}
