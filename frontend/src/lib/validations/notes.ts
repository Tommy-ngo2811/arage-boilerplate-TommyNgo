import { z } from 'zod'

export const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  body: z.string().max(5000, 'Note must be less than 5000 characters'),
})

export type NoteInput = z.infer<typeof noteSchema>
