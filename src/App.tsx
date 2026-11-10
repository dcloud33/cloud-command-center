import { useEffect, useState } from 'react'
import './App.css'
import ProjectEditor from './ProjectEditor'
import type { Project } from './ProjectEditor'
import { loadProjects, saveProjects } from './projectStorage'

type Theme = 'light' | 'dark' | 'system'

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem('ccc-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Use the system preference when storage is unavailable.
  }
  return 'system'
}

const seedProjects = [
  {
    id: 'pulseforge',
    name: 'PulseForge',
    category: 'Primary · Kubernetes / DevOps',
    description: 'Build, operate, and troubleshoot a reliable Kubernetes application.',
  },
  {
    id: 'forge',
    name: 'Forge AI Platform',
    category: 'Independent · Advanced architecture',
    description: 'Explore distributed workflows and application architecture.',
  },
]

function App() {
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [initialStorage] = useState(() =>
    loadProjects(seedProjects.map(project => ({
      ...project,
      status: 'Planned',
      repository: '',
    }))),
  )
  const [projects, setProjects] = useState<Project[]>(initialStorage.projects)
  const [storageSnapshot, setStorageSnapshot] = useState(initialStorage.snapshot)
  const [storageMessage, setStorageMessage] = useState(initialStorage.error)
  const [editor, setEditor] = useState<Project | 'new' | null>(null)

  function saveProject(project: Project) {
    const nextProjects = projects.some(item => item.id === project.id)
      ? projects.map(item => item.id === project.id ? project : item)
      : [...projects, project]

    const result = saveProjects(nextProjects, storageSnapshot)

    if (!result.ok) {
      setStorageMessage(result.error)
      return
    }

    setProjects(nextProjects)
    setStorageSnapshot(result.snapshot)
    setStorageMessage('Projects saved in this browser.')
    setSelectedProject(project.id)
    setEditor(null)
  }
  const [selectedProject, setSelectedProject] = useState(
    initialStorage.projects[0].id,
  )
  const [themeMessage, setThemeMessage] = useState('')

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    function applyTheme() {
      const resolved = theme === 'system'
        ? (media.matches ? 'dark' : 'light')
        : theme

      document.documentElement.dataset.theme = resolved
    }

    applyTheme()
    media.addEventListener('change', applyTheme)


    return () => media.removeEventListener('change', applyTheme)
  }, [theme])

  function handleThemeChange(nextTheme: Theme) {
    setTheme(nextTheme)

    try {
      localStorage.setItem('ccc-theme', nextTheme)
      setThemeMessage('')
    } catch {
      setThemeMessage('Appearance changed, but could not be saved.')
    }
  }

  const currentProject = projects.find(
    project => project.id === selectedProject,
  )!

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#main">CLOUD COMMAND CENTER</a>

        <p className="eyebrow">PROJECT WORKSPACES</p>

        <nav aria-label="Choose project">
          {projects.map(project => (
            <button
              key={project.id}
              className={selectedProject === project.id ? 'selected' : ''}
              aria-pressed={selectedProject === project.id}
              onClick={() => setSelectedProject(project.id)}
            >
              {project.name}
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <strong>Depth over speed.</strong>
          <p>Build deliberately. Record decisions. Keep the evidence.</p>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <span>Personal workspace</span>

          <label className="appearance">
            Appearance
            <select
              value={theme}
              onChange={event => handleThemeChange(event.target.value as Theme)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>
        </header>

        <main id="main">
          <p className="eyebrow">YOUR ENGINEERING WORKBENCH</p>
          <h1>Make the next step count.</h1>
          <p className="intro">
            One focused task. Clear reasoning. Evidence you can explain.
          </p>

          <section className="focus" aria-labelledby="focus-title">
            <p className="eyebrow">SELECTED PROJECT</p>
            <h2 id="focus-title">{currentProject.name}</h2>
            <p>{currentProject.description}</p>
            <div className="focus-footer">
              Next: add an editable current task for this project.
            </div>
          </section>

          <div className="section-toolbar">
            <h2 className="section-heading">Your projects</h2>
            <button onClick={() => setEditor('new')}>Add project</button>
          </div>

          {editor !== null && (
            <ProjectEditor
              key={editor === 'new' ? 'new' : editor.id}
              project={editor === 'new' ? undefined : editor}
              onSave={saveProject}
              onCancel={() => setEditor(null)}
              storageMessage={storageMessage}
            />
          )}

          <div className="project-grid">
            {projects.map(project => (
              <article className="project-card" key={project.id}>
                <p className="eyebrow">{project.category}</p>
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                <span className="badge">{project.status}</span>
                <div className="actions">
                  <button onClick={() => setEditor(project)}>Edit project</button>
                  {project.repository && (
                    <a
                      href={project.repository}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open GitHub ↗
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>

          <p className="notice">
            Projects save in this browser profile and site address.
            They do not sync across devices. Export and import are planned.
          </p>

          <p role="status">{storageMessage}</p>
          <p role="status">{themeMessage}</p>
        </main>

        <footer>
          Independent portfolio projects · Completed work requires evidence.
        </footer>
      </div>
    </div>
  )
}

export default App
