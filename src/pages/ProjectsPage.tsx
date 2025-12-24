import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Trash2, MoreVertical, Sparkles } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Loading,
} from '@/components/ui'
import { AppSidebar, AppHeader, CreateProjectDialog } from '@/components/layout'
import { formatDate } from '@/lib/utils'
import type { Project } from '@/types'
import { ProjectRepository } from '@/services/projectRepository'

export function ProjectsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Create dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load projects
  useEffect(() => {
    loadProjects()
  }, [])

  // Open create dialog if navigated with state
  useEffect(() => {
    if (location.state?.openCreateDialog) {
      setIsCreateDialogOpen(true)
      // Clear the state to prevent reopening on refresh
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state])

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const data = await ProjectRepository.getAll()
      setProjects(data)
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      await ProjectRepository.delete(deleteTarget.id)
      setDeleteTarget(null)
      loadProjects()
    } catch (error) {
      console.error('Failed to delete project:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Floating Sidebar Navigation */}
      <AppSidebar onCreateProject={() => setIsCreateDialogOpen(true)} />

      {/* Main Content */}
      <main className="flex flex-1 flex-col">
        {/* Header */}
        <AppHeader />

        {/* Page Content */}
        <div className="flex-1 px-8 py-6">
          <div className="mx-auto max-w-7xl">
            {/* Page Title & Actions */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-primary">项目列表</h1>
              </div>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="rounded-full bg-primary px-6 text-surface hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                新建项目
              </Button>
            </div>

            {/* Projects Grid */}
            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loading size="lg" />
              </div>
            ) : projects.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface">
                <Sparkles className="mb-4 h-12 w-12 text-muted" />
                <p className="mb-4 text-muted">暂无项目</p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="rounded-full bg-primary px-6 text-surface hover:bg-primary/90"
                >
                  创建你的第一个项目
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {/* New Project Card */}
                <button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-surface transition-all hover:border-primary hover:shadow-md"
                  style={{ height: 'calc(8rem + 68px)' }}
                >
                  <Plus className="mb-2 h-6 w-6 text-muted" />
                  <span className="text-sm text-muted">新建项目</span>
                </button>

                {/* Project Cards */}
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-primary hover:shadow-md"
                    onClick={() => navigate(`/editor/${project.id}`)}
                  >
                    {/* Thumbnail - 固定高度 */}
                    <div className="flex h-32 items-center justify-center bg-background">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Sparkles className="h-8 w-8 text-muted" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-medium text-primary">
                            {project.title}
                          </h3>
                          <p className="text-xs text-muted">
                            更新于 {formatDate(project.updatedAt)}
                          </p>
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteTarget(project)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Dialog */}
      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>删除项目</DialogTitle>
            <DialogDescription>
              确定要删除 &quot;{deleteTarget?.title}&quot; 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="rounded-full"
            >
              取消
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-full bg-red-600 text-surface hover:bg-red-700"
            >
              {isDeleting ? '删除中...' : '删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
