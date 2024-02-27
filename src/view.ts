export default class NotesView {
  private root: HTMLElement;
  private onNoteSelect: (noteId: string) => void;
  private onNoteAdd: () => void;
  private onNoteEdit: (title: string, body: string) => void;
  private onNoteDelete: (noteId: string) => void;
  private onNotesExport: () => void;
  private onNotesImport?: ((selectedFile: File) => void) | undefined;

  constructor(
    root: HTMLElement,
    {
      onNoteSelect,
      onNoteAdd,
      onNoteEdit,
      onNoteDelete,
      onNotesExport,
      onNotesImport,
    }: NotesViewCallbacks = {}
  ) {
    this.root = root;
    this.onNoteSelect = onNoteSelect ? onNoteSelect : () => {}; // Default to an empty function if onNoteSelect is undefined
    this.onNoteAdd = onNoteAdd ? onNoteAdd : () => {};
    this.onNoteEdit = onNoteEdit ? onNoteEdit : (_title: string) => {};
    this.onNoteDelete = onNoteDelete ? onNoteDelete : () => {};
    this.onNotesExport = onNotesExport ? onNotesExport : () => {};
    this.onNotesImport = onNotesImport ? onNotesImport : () => {};

    this.root.innerHTML = `
          <div class="top__nav">
            <a id="importNotes" href="#importNotes">
              <input type="file" id="fileInput" accept=".xml" />
              <button id="importBtn">Handle File</button>
            </a>
            <a id="exportNotes" href="#exportNotes">Export Notes</a>
          </div>
          <div class="notes__wrapper">
            <div class="notes__sidebar">
                <button class="notes__add" type="button">添加新的笔记 📒</button>
                <div class="list__wrapper">
                  <div class="notes__list"></div>
                </div>
            </div>
            <div class="notes__preview">
                <input class="notes__title" type="text" placeholder="新笔记...">
                <textarea class="notes__body">编辑笔记...</textarea>
            </div>
          </div>
      `;

    const btnFileInput = this.root.querySelector("#importBtn");
    const btnNotesExport = this.root.querySelector("#exportNotes");
    const btnNotesImport = this.root.querySelector("#importNotes");
    const btnAddNote = this.root.querySelector(".notes__add");
    const inpTitle = this.root.querySelector(
      ".notes__title"
    ) as HTMLInputElement;
    const inpBody = this.root.querySelector(
      ".notes__body"
    ) as HTMLTextAreaElement;

    if (!btnFileInput) return;
    btnFileInput.addEventListener("click", () => {
      const fileInput = document.getElementById(
        "fileInput"
      ) as HTMLInputElement;

      if (fileInput.files && fileInput.files.length > 0) {
        const selectedFile = fileInput.files[0];
        if (this.onNotesImport) this.onNotesImport(selectedFile);
      }
    });

    if (!btnAddNote) return;
    btnAddNote.addEventListener("click", () => {
      this.onNoteAdd();
    });

    [inpTitle, inpBody].forEach((inputField) => {
      inputField.addEventListener("blur", () => {
        const updatedTitle = inpTitle.value.trim();
        const updatedBody = inpBody.value.trim();

        this.onNoteEdit(updatedTitle, updatedBody);
      });
    });

    if (!btnNotesExport) return;
    btnNotesExport.addEventListener("click", () => {
      this.onNotesExport();
    });

    if (!btnNotesImport) return;
    btnNotesImport.addEventListener("click", async () => {});

    this.updateNotePreviewVisibility(false);
  }

  private _createModal() {
    return `
      <div class="notes__modal" id="modal">
        <div class="notes__modal__panel" id="panel">
          <div>确认要删除该笔记吗?</div>
          <div class="notes__modal__buttons__wrapper">
              <button id="cancel">Cancel</button>
              <button id="confirm">Confirm</button>
          </div>
        </div>
      </div>
    `;
  }

  private _createListItemHTML(
    id: number,
    title: string,
    body: string,
    updated: Date
  ): string {
    const MAX_BODY_LENGTH = 60;

    return `
          <div class="notes__list-item" data-note-id="${id}">
              <div class="notes__small-title">${title}</div>
              <div class="notes__small-body">
                  ${body.substring(0, MAX_BODY_LENGTH)}
                  ${body.length > MAX_BODY_LENGTH ? "..." : ""}
              </div>
              <div class="notes__small-updated">
                  ${updated.toLocaleString(undefined, {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
              </div>
          </div>
      `;
  }

  updateNoteList(notes: Note[]): void {
    const notesListContainer = this.root.querySelector(".notes__list");

    if (!notesListContainer) return;
    // Empty list
    notesListContainer.innerHTML = "";

    for (const note of notes) {
      const html = this._createListItemHTML(
        note.id,
        note.title,
        note.body,
        new Date(note.updated)
      );

      notesListContainer.insertAdjacentHTML("beforeend", html);
    }

    // Add select/delete events for each list item
    notesListContainer
      .querySelectorAll(".notes__list-item")
      .forEach((noteListItem) => {
        noteListItem.addEventListener("click", () => {
          const dataset = (noteListItem as HTMLElement).dataset;
          if (dataset && dataset.noteId) this.onNoteSelect(dataset.noteId);
        });

        noteListItem.addEventListener("dblclick", () => {
          // show modal
          const modal = this._createModal();
          this.root.insertAdjacentHTML("beforeend", modal);

          //modal events
          this.root.querySelector("#panel")?.addEventListener("click", (e) => {
            e.stopPropagation();
          });

          this.root.querySelector("#modal")?.addEventListener("click", () => {
            this.root.querySelector("#modal")?.remove(); //remove modal
          });

          this.root.querySelector("#cancel")?.addEventListener("click", () => {
            this.root.querySelector("#modal")?.remove(); //remove modal
          });

          this.root.querySelector("#confirm")?.addEventListener("click", () => {
            const dataset = (noteListItem as HTMLElement).dataset;
            if (dataset && dataset.noteId) {
              this.onNoteDelete(dataset.noteId); //delete item
              this.root.querySelector("#modal")?.remove(); //remove modal
            }
          });
        });
      });
  }

  updateActiveNote(note: Note): void {
    const titleInput = this.root.querySelector(
      ".notes__title"
    ) as HTMLInputElement;
    const bodyTextarea = this.root.querySelector(
      ".notes__body"
    ) as HTMLTextAreaElement;

    titleInput.value = note.title;
    bodyTextarea.value = note.body;

    this.root.querySelectorAll(".notes__list-item").forEach((noteListItem) => {
      noteListItem.classList.remove("notes__list-item--selected");
    });

    const selectedNoteListItem = this.root.querySelector(
      `.notes__list-item[data-note-id="${note.id}"]`
    );

    if (selectedNoteListItem) {
      selectedNoteListItem.classList.add("notes__list-item--selected");
    }
  }

  updateNotePreviewVisibility(visible: boolean): void {
    const previewDiv = this.root.querySelector(
      ".notes__preview"
    ) as HTMLDivElement;
    previewDiv.style.visibility = visible ? "visible" : "hidden";
  }
}
