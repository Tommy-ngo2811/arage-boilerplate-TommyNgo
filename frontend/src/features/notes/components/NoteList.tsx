'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { NotebookPen, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useNotes } from '../hooks/useNotes'
import { createNote, deleteNote, updateNote } from '../actions/notes.actions'
import { noteSchema, type NoteInput } from '@/lib/validations/notes'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDatetime } from '@/lib/utils'
import type { Note } from '@/types/firestore'

function NoteForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  defaultValues?: NoteInput
  onSubmit: (data: NoteInput) => Promise<void>
  onCancel?: () => void
  submitLabel: string
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NoteInput>({
    resolver: zodResolver(noteSchema),
    defaultValues: defaultValues ?? { title: '', body: '' },
  })

  const submit = handleSubmit(async (data) => {
    await onSubmit(data)
    reset({ title: '', body: '' })
  })

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          aria-invalid={!!errors.title}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-500 focus:outline-none aria-invalid:border-red-500 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Note title"
          {...register('title')}
        />
        {errors.title && (
          <p className="text-xs text-red-500" role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="body" className="text-sm font-medium">
          Body
        </label>
        <textarea
          id="body"
          rows={3}
          aria-invalid={!!errors.body}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-zinc-400 focus:ring-2 focus:ring-zinc-500 focus:outline-none aria-invalid:border-red-500 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Write something…"
          {...register('body')}
        />
        {errors.body && (
          <p className="text-xs text-red-500" role="alert">
            {errors.body.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

function NoteCard({ note }: { note: Note }) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleUpdate = async (data: NoteInput) => {
    const result = await updateNote(note.id, data)
    if (result.success) {
      toast.success('Note updated')
      setEditing(false)
    } else {
      toast.error(result.error ?? 'Failed to update note')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const result = await deleteNote(note.id)
    if (result.success) {
      toast.success('Note deleted')
    } else {
      toast.error(result.error ?? 'Failed to delete note')
      setDeleting(false)
    }
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <NoteForm
          defaultValues={{ title: note.title, body: note.body }}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitLabel="Save"
        />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-sm break-words">{note.title}</h3>
          {note.body && (
            <p className="mt-1 text-sm text-zinc-500 whitespace-pre-wrap break-words">
              {note.body}
            </p>
          )}
          <p className="mt-2 text-xs text-zinc-400">
            Updated {note.updatedAt ? formatDatetime(note.updatedAt.toDate()) : '—'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit note"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete note"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function NoteList() {
  const { user, loading: authLoading } = useAuth()
  const { data: notes, loading, error } = useNotes(user?.uid)

  const handleCreate = async (data: NoteInput) => {
    const result = await createNote(data)
    if (result.success) {
      toast.success('Note created')
    } else {
      toast.error(result.error ?? 'Failed to create note')
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        title="Couldn't load notes"
        description={error.message}
        icon={NotebookPen}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <NoteForm onSubmit={handleCreate} submitLabel="Add note" />
      </div>

      {notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          description="Create your first note using the form above."
          icon={NotebookPen}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </div>
  )
}
