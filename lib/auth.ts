export type WorkspaceUser = { userId: string };

/** Authentication will be integrated separately. Never trust client identity headers. */
export async function getCurrentUser(): Promise<WorkspaceUser | null> {
  return null;
}
