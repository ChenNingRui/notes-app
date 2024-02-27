import NotesView from "./view";
import NotesAPI from "./api";

export default class App {
  private notes: Note[];
  private activeNote: Note | null;
  private view: NotesView;

  constructor(root: HTMLElement) {
    this.notes = [];
    this.activeNote = null;
    this.view = new NotesView(root, this._handlers());

    this._refreshNotes();
  }

  private _refreshNotes(): void {
    const notes: Note[] = NotesAPI.getAllNotes();

    this._setNotes(notes);

    if (notes.length > 0) {
      this._setActiveNote(notes[0]);
    }
  }

  private _setNotes(notes: Note[]): void {
    this.notes = notes;
    this.view.updateNoteList(notes);
    this.view.updateNotePreviewVisibility(notes.length > 0);
  }

  private _setActiveNote(note: Note): void {
    this.activeNote = note;
    this.view.updateActiveNote(note);
  }

  private _handlers() {
    return {
      onNoteSelect: (noteId: string) => {
        const selectedNote = this.notes.find(
          (note) => String(note.id) === noteId
        );
        if (selectedNote) {
          this._setActiveNote(selectedNote);
        }
      },
      onNoteAdd: () => {
        const newNote: Note = {
          title: "新建笔记",
          body: "开始记录...",
          id: 0, // You may want to replace this with a proper ID generation logic
          updated: new Date().toISOString(),
        };

        NotesAPI.saveNote(newNote);
        this._refreshNotes();
      },
      onNoteEdit: (title: string, body: string) => {
        if (this.activeNote) {
          NotesAPI.saveNote({
            id: this.activeNote.id,
            title,
            body,
            updated: "",
          });

          this._refreshNotes();
        }
      },
      onNoteDelete: (noteId: string) => {
        const parsedNoteId = parseInt(noteId, 10);
        if (!isNaN(parsedNoteId)) {
          NotesAPI.deleteNote(parsedNoteId);
          this._refreshNotes();
        }
      },
      onNotesExport: () => {
        NotesAPI.exportNotesToXML();
      },
      onNotesImport: (selectedFile: File) => {
        NotesAPI.importFile(selectedFile);
        this._refreshNotes();
      },
    };
  }
}
