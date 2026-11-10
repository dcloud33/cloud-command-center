import { useState } from 'react'
import type { FormEvent } from 'react'
import { loadTask, saveTask, TASK_STATUSES } from './taskStorage'
import type { CurrentTask } from './taskStorage'

type Props = {
  projectId: string
  projectName: string
}

export default function CurrentTaskPanel({
  projectId,
  projectName,
}: Props) {
  const [loaded] = useState(() => loadTask(projectId))
  const [task, setTask] = useState<CurrentTask | null>(loaded.task)
  const [snapshot, setSnapshot] = useState(loaded.snapshot)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState(loaded.error)
  const [message, setMessage] = useState('')

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    const title = String(data.get('title') ?? '').trim()
    const nextStep = String(data.get('nextStep') ?? '').trim()
    const status = TASK_STATUSES.find(
      option => option === data.get('status'),
    )

    if (!title || !nextStep || !status) {
      setError('Enter a title, a next step, and a valid status.')
      return
    }

    const nextTask: CurrentTask = {
      projectId,
      title,
      status,
      nextStep,
      notes: String(data.get('notes') ?? ''),
    }

    const result = saveTask(nextTask, snapshot)

    if (!result.ok) {
      setError(result.error)
      setMessage('')
      return
    }

    setTask(nextTask)
    setSnapshot(result.snapshot)
    setEditing(false)
    setError('')
    setMessage('Task saved in this browser.')
  }

  function openEditor() {
    setError('')
    setMessage('')
    setEditing(true)
  }

  return (
    <section
      className="editor task-panel"
      aria-labelledby="current-task-title"
    >
      <p className="eyebrow">ONE STEP AT A TIME · {projectName}</p>
      <h2 id="current-task-title">Current task</h2>

      {editing ? (
        <form onSubmit={handleSave}>
          <label>
            Task title
            <input
              name="title"
              defaultValue={task?.title}
              required
              maxLength={150}
            />
          </label>

          <label>
            Status
            <select name="status" defaultValue={task?.status ?? 'Planned'}>
              {TASK_STATUSES.map(status => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          <label>
            One next action or diagnostic question
            <textarea
              name="nextStep"
              defaultValue={task?.nextStep}
              required
              maxLength={1000}
            />
          </label>

          <label>
            Notes and observations
            <textarea
              name="notes"
              defaultValue={task?.notes}
              maxLength={5000}
            />
          </label>

          <p className="notice">
            Save or cancel before switching projects.
            Unsaved task edits are discarded when you switch.
          </p>

          {error && <p role="alert">{error}</p>}

          <div className="actions">
            <button type="submit">Save task</button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setError('')
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          {task ? (
            <>
              <h3>{task.title}</h3>
              <span className="badge">{task.status}</span>

              <h4>Next step</h4>
              <p className="task-text">{task.nextStep}</p>

              {task.notes && (
                <>
                  <h4>Notes</h4>
                  <p className="task-text">{task.notes}</p>
                </>
              )}
            </>
          ) : (
            <p>No current task has been saved for this project.</p>
          )}

          {error && <p role="alert">{error}</p>}
          <p role="status">{message}</p>

          <div className="actions">
            <button
              disabled={snapshot === undefined}
              onClick={openEditor}
            >
              {task ? 'Edit task' : 'Add current task'}
            </button>
          </div>
        </>
      )}
    </section>
  )
}
