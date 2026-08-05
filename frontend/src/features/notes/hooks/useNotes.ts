'use client'

import { useMemo } from 'react'
import { orderBy, where } from 'firebase/firestore'
import { useCollection } from '@/hooks/useFirestore'
import { getNotesCollection } from '@/lib/firebase/firestore'
import type { Note } from '@/types/firestore'

/**
 * Realtime list of the signed-in user's non-deleted notes, newest first.
 * Pass `undefined` while the auth state is still loading.
 */
export function useNotes(uid: string | undefined) {
  // useCollection() only resubscribes when the collection ref's identity
  // changes (see useFirestore.ts), but getNotesCollection() returns a new
  // object every call. Memoizing on `uid` keeps the ref stable once the
  // real uid is known, so the listener doesn't tear down and rebuild on
  // every data update — which otherwise starves the Firestore watch stream.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `uid` is a deliberate memo key, not a real dependency of getNotesCollection()
  const notesCollection = useMemo(() => getNotesCollection(), [uid])

  return useCollection<Note>(
    notesCollection,
    where('uid', '==', uid ?? '__no_user__'),
    where('deletedAt', '==', null),
    orderBy('updatedAt', 'desc')
  )
}
