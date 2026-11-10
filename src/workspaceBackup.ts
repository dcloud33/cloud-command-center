import { loadProjects } from './projectStorage'
import { loadTask } from './taskStorage'
import type { Project } from './ProjectEditor'
import type { CurrentTask } from './taskStorage'

export type WorkspaceBackup = {
  format: 'cloud-command-center'
  version: 1
  exportedAt: string
  projects: Project[]
  tasks: CurrentTask[]
}

export function createWorkspaceBackup(): WorkspaceBackup {
  const workspace = loadProjects([])

  if (workspace.snapshot === undefined) {
    throw new Error(
      'Export blocked: saved projects could not be loaded. ' +
      'Existing storage has not been changed.',
    )
  }

  if (workspace.snapshot === null) {
    throw new Error(
      'Save at least one project before exporting your workspace.',
    )
  }

  const tasks: CurrentTask[] = []
  const taskSnapshots = new Map<string, string | null>()

  for (const project of workspace.projects) {
    const result = loadTask(project.id)

    if (result.snapshot === undefined) {
      throw new Error(
        `Export blocked: the saved task for "${project.name}" ` +
        'could not be loaded. Existing storage has not been changed.',
      )
    }

    taskSnapshots.set(project.id, result.snapshot)

    if (result.task) {
      tasks.push(result.task)
    }
  }

  const latestProjects = loadProjects([])

  if (latestProjects.snapshot !== workspace.snapshot) {
    throw new Error('Projects changed during export. Please try again.')
  }

  for (const project of workspace.projects) {
    const latestTask = loadTask(project.id)

    if (latestTask.snapshot !== taskSnapshots.get(project.id)) {
      throw new Error('A task changed during export. Please try again.')
    }
  }

  return {
    format: 'cloud-command-center',
    version: 1,
    exportedAt: new Date().toISOString(),
    projects: workspace.projects,
    tasks,
  }
}

export function downloadWorkspaceBackup(backup: WorkspaceBackup): void {
  const contents = JSON.stringify(backup, null, 2)
  const blob = new Blob([contents], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  try {
    link.href = url
    link.download =
      `cloud-command-center-${backup.exportedAt.replace(/[:.]/g, '-')}.json`

    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}
