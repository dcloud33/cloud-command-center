import { useState } from 'react'
import type { FormEvent } from 'react'

export type Project = {
  id: string
  name: string
  category: string
  description: string
  status: string
  repository: string
}

type Props = {
  project?: Project
  onSave: (project: Project) => void
  onCancel: () => void
}

export default function ProjectEditor({
  project,
  onSave,
  onCancel,
}: Props) {
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const repository = String(data.get('repository') ?? '').trim()

    if (!name) {
      setError('Enter a project name.')
      return
    }

    if (repository) {
      try {
        const url = new URL(repository)
        const parts = url.pathname.split('/').filter(Boolean)

        if (
          url.protocol !== 'https:' ||
          url.hostname !== 'github.com' ||
          url.username ||
          url.password ||
          url.port ||
          parts.length !== 2 ||
          url.search ||
          url.hash
        ) {
          throw new Error('Invalid repository URL')
        }
      } catch {
        setError('Use a repository URL such as https://github.com/owner/repository')
        return
      }
    }

    onSave({
      id: project?.id ?? crypto.randomUUID(),
      name,
      category: String(data.get('category') ?? '').trim(),
      description: String(data.get('description') ?? '').trim(),
      status: String(data.get('status') ?? 'Planned'),
      repository,
    })
  }

  return (
    <section className="editor" aria-labelledby="editor-title">
      <h2 id="editor-title">
        {project ? 'Edit project' : 'Add project'}
      </h2>

      <form onSubmit={handleSubmit}>
        <label>
          Project name
          <input
            name="name"
            defaultValue={project?.name}
            required
            maxLength={100}
          />
        </label>

        <label>
          Category
          <input
            name="category"
            defaultValue={project?.category}
            placeholder="Cloud / DevOps / Software"
            maxLength={100}
          />
        </label>

        <label>
          Purpose
          <textarea
            name="description"
            defaultValue={project?.description}
            maxLength={2000}
          />
        </label>

        <label>
          Status
          <select name="status" defaultValue={project?.status ?? 'Planned'}>
            <option>Planned</option>
            <option>Active</option>
            <option>Blocked</option>
            <option>Completed</option>
          </select>
        </label>

        <label>
          GitHub repository URL — optional
          <input
            name="repository"
            type="url"
            defaultValue={project?.repository}
            placeholder="https://github.com/owner/repository"
            maxLength={300}
          />
        </label>

        <p role="alert">{error}</p>

        <div className="actions">
          <button type="submit">Save project</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  )
}
