'use server'

import { FieldValue } from 'firebase-admin/firestore'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/actions/auth.actions'
import { adminDb } from '@/lib/firebase/admin'
import { noteSchema } from '@/lib/validations/notes'
import { idSchema } from '@/lib/validations/common'
import type { ActionResult } from '@/types'
import type { CreateNoteInput, UpdateNoteInput } from '@/types/firestore'

const NOTES_COLLECTION = 'notes'

export async function createNote(input: CreateNoteInput): Promise<ActionResult<string>> {
  const session = await requireAuth()

  const parsed = noteSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  }

  try {
    const ref = await adminDb.collection(NOTES_COLLECTION).add({
      uid: session.uid,
      title: parsed.data.title,
      body: parsed.data.body,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      deletedAt: null,
      _schemaVersion: 1,
    })
    revalidatePath('/notes')
    return { success: true, data: ref.id }
  } catch {
    return { success: false, error: 'Failed to create note' }
  }
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<ActionResult> {
  const session = await requireAuth()

  const parsedId = idSchema.safeParse(id)
  const parsedInput = noteSchema.partial().safeParse(input)
  if (!parsedId.success || !parsedInput.success) {
    return { success: false, error: 'Invalid input' }
  }

  try {
    const docRef = adminDb.collection(NOTES_COLLECTION).doc(id)
    const snap = await docRef.get()
    if (!snap.exists || snap.data()?.uid !== session.uid) {
      return { success: false, error: 'Note not found' }
    }

    await docRef.update({
      ...parsedInput.data,
      updatedAt: FieldValue.serverTimestamp(),
    })
    revalidatePath('/notes')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update note' }
  }
}

export async function deleteNote(id: string): Promise<ActionResult> {
  const session = await requireAuth()

  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return { success: false, error: 'Invalid input' }
  }

  try {
    const docRef = adminDb.collection(NOTES_COLLECTION).doc(id)
    const snap = await docRef.get()
    if (!snap.exists || snap.data()?.uid !== session.uid) {
      return { success: false, error: 'Note not found' }
    }

    await docRef.update({
      deletedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
    revalidatePath('/notes')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to delete note' }
  }
}
