interface NotesViewCallbacks {
  onNoteSelect?: ((noteId: string) => void) | undefined;
  onNoteAdd?: (() => void) | undefined;
  onNoteEdit?: ((title: string, body: string) => void) | undefined;
  onNoteDelete?: ((noteId: string) => void) | undefined;
  onNotesExport?: (() => void) | undefined;
  onNotesImport?: ((selectedFile: File) => void) | undefined;
}
