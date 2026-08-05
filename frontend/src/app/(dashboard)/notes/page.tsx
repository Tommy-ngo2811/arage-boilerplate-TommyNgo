import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/PageHeader'
import { NoteList } from '@/features/notes/components/NoteList'

export const metadata: Metadata = {
  title: 'Notes',
}

export default function NotesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Notes" description="Quick notes only you can see." />
      <NoteList />
    </div>
  )
}
