import { isProjectList } from './projectStorage'
import { isTask } from './taskStorage'
import type { CurrentTask } from './taskStorage'
import type { WorkspaceBackup } from './workspaceBackup'

export function parseWorkspaceBackup(text: string): WorkspaceBackup {
  if (text.length > 5_000_000) {
    throw new Error('This backup exceeds the supported size.')
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('This file does not contain valid JSON.')
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('This file is not a workspace backup.')
  }

  const record = parsed as Record<string, unknown>

  if (
    record.format !== 'cloud-command-center' ||
    record.version !== 1
  ) {
    throw new Error('Unsupported backup format or version.')
  }

  if (
    typeof record.exportedAt !== 'string' ||
    !Number.isFinite(Date.parse(record.exportedAt))
  ) {
    throw new Error('The backup has an invalid export date.')
  }

  if (
    !isProjectList(record.projects) ||
    record.projects.length > 1000
  ) {
    throw new Error('The backup contains invalid or duplicate projects.')
  }

  if (
    !Array.isArray(record.tasks) ||
    record.tasks.length > record.projects.length
  ) {
    throw new Error('The backup contains an invalid task list.')
  }

  const projectIds = new Set(record.projects.map(project => project.id))
  const taskProjectIds = new Set<string>()
  const tasks: CurrentTask[] = []
  const candidates: unknown[] = record.tasks

  for (const candidate of candidates) {
    if (typeof candidate !== 'object' || candidate === null) {
      throw new Error('The backup contains an invalid task.')
    }

    const fields = candidate as Record<string, unknown>
    const projectId = fields.projectId

    if (
      typeof projectId !== 'string' ||
      !projectIds.has(projectId) ||
      taskProjectIds.has(projectId) ||
      !isTask(candidate, projectId)
    ) {
      throw new Error(
        'A task is invalid, duplicated, or linked to a missing project.',
      )
    }

    taskProjectIds.add(projectId)

    tasks.push({
      projectId: candidate.projectId,
      title: candidate.title,
      status: candidate.status,
      nextStep: candidate.nextStep,
      notes: candidate.notes,
    })
  }

  return {
    format: 'cloud-command-center',
    version: 1,
    exportedAt: record.exportedAt,
    projects: record.projects.map(project => ({
      id: project.id,
      name: project.name,
      category: project.category,
      description: project.description,
      status: project.status,
      repository: project.repository,
    })),
    tasks,
  }
}

export function restoreIntoEmptyWorkspace(backup: WorkspaceBackup): void {
  const validated = parseWorkspaceBackup(JSON.stringify(backup))
  const projectKey = 'ccc-projects-v1'
  const taskPrefix = 'ccc-task-v1:'

  if (localStorage.getItem(projectKey) !== null) {
    throw new Error(
      'Restore requires an empty workspace. Existing projects were not changed. ' +
      'Use a fresh Incognito session for this test.',
    )
  }

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)

    if (key?.startsWith(taskPrefix)) {
      throw new Error(
        'Restore requires an empty workspace. Existing tasks were not changed.',
      )
    }
  }

  const entries: [string, string][] = validated.tasks.map(task => [
    `${taskPrefix}${task.projectId}`,
    JSON.stringify({ version: 1, task }),
  ])

  entries.push([
    projectKey,
    JSON.stringify({ version: 1, projects: validated.projects }),
  ])

  const attempted: [string, string][] = []

  try {
    for (const [key, value] of entries) {
      if (localStorage.getItem(key) !== null) {
        throw new Error('Workspace changed during restore.')
      }

      attempted.push([key, value])
      localStorage.setItem(key, value)
    }

    for (const [key, value] of entries) {
      if (localStorage.getItem(key) !== value) {
        throw new Error('Restored data could not be verified.')
      }
    }
  } catch {
    let cleanupFailed = false

    for (const [key, value] of attempted.reverse()) {
      try {
        if (localStorage.getItem(key) === value) {
          localStorage.removeItem(key)
        }
      } catch {
        cleanupFailed = true
      }
    }

    throw new Error(
      cleanupFailed
        ? 'Restore failed and partial imported records may remain. ' +
          'Keep the backup file and stop editing this workspace.'
        : 'Restore failed. Newly written records were removed. ' +
          'Keep the backup file and try again in a fresh session.',
    )
  }
}
