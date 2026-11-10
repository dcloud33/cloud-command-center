import { useId, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  createWorkspaceBackup,
  downloadWorkspaceBackup,
} from './workspaceBackup'
import type { WorkspaceBackup } from './workspaceBackup'
import {
  parseWorkspaceBackup,
  restoreIntoEmptyWorkspace,
} from './workspaceImport'

export default function WorkspaceBackupPanel() {
  const inputId = useId()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<WorkspaceBackup | null>(null)
  const [fileName, setFileName] = useState('')
  const [reading, setReading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  function handleExport() {
    setMessage('')
    setError('')

    try {
      const backup = createWorkspaceBackup()
      downloadWorkspaceBackup(backup)

      setMessage(
        `Download requested: ${backup.projects.length} projects and ` +
        `${backup.tasks.length} tasks. Check your browser downloads.`,
      )
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The workspace could not be exported.',
      )
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    setConfirmed(false)
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''

    setPreview(null)
    setFileName('')
    setError('')
    setMessage('')

    if (!file) return

    if (file.size > 5_000_000) {
      setError('Select a backup smaller than 5 MB.')
      return
    }

    setReading(true)

    try {
      const contents = await file.text()
      const backup = parseWorkspaceBackup(contents)

      setPreview(backup)
      setFileName(file.name)
      setMessage('Backup validated. Saved workspace has not been changed.')
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The selected backup could not be read.',
      )
    } finally {
      setReading(false)
    }
  }

  function handleRestore() {
    if (!preview || !confirmed) return

    setError('')
    setMessage('')

    try {
      restoreIntoEmptyWorkspace(preview)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Restore failed.',
      )
      return
    }

    window.location.reload()
  }

  function cancelPreview() {
    setConfirmed(false)
    setPreview(null)
    setFileName('')
    setError('')
    setMessage('Preview canceled. Saved workspace has not been changed.')
  }

  return (
    <section className="editor" aria-labelledby="backup-title">
      <h2 id="backup-title">Workspace backup</h2>

      <p>
        Download your saved projects and current tasks.
        Save any form edits before exporting.
      </p>

      <p className="notice">
        Backup files contain project details and task notes.
        Appearance preferences are not included.
      </p>

      <div className="actions">
        <button onClick={handleExport}>Export workspace</button>
      </div>

      <h3>Preview a backup</h3>

      <label htmlFor={inputId}>
        Choose a workspace JSON file
        <input
          id={inputId}
          type="file"
          accept=".json,application/json"
          disabled={reading}
          onChange={handleFile}
        />
      </label>

      <p className="notice">
        Selecting a file only previews it. Restore currently requires an
        empty workspace and will refuse to overwrite existing records.
      </p>

      {reading && <p role="status">Reading backup…</p>}

      {preview && (
        <div className="backup-preview">
          <h4>Validated backup</h4>
          <p className="task-text">{fileName}</p>
          <p>
            Exported: {new Date(preview.exportedAt).toLocaleString()}
          </p>
          <p>
            {preview.projects.length} projects · {preview.tasks.length} tasks
          </p>

          <ul>
            {preview.projects.map(project => {
              const task = preview.tasks.find(
                item => item.projectId === project.id,
              )

              return (
                <li key={project.id}>
                  <strong>{project.name}</strong>
                  {' — '}
                  {task ? `Current task: ${task.title}` : 'No saved task'}
                </li>
              )
            })}
          </ul>

          <label className="restore-confirmation">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={event => setConfirmed(event.target.checked)}
            />
            I want to restore this backup into this empty workspace.
            Reloading will discard any unsaved form edits.
          </label>

          <div className="actions">
            <button
              disabled={!confirmed}
              onClick={handleRestore}
            >
              Restore into empty workspace
            </button>
            <button onClick={cancelPreview}>Cancel preview</button>
          </div>
        </div>
      )}

      {error && <p role="alert">{error}</p>}
      <p role="status">{message}</p>
    </section>
  )
}
