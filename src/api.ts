import builder from "xmlbuilder";
export default class NotesAPI {
  static parseAndProcessXML(xmlContent: string) {
    // Use a DOMParser to parse the XML content
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "application/xml");

    // Now you can work with xmlDoc, for example:
    const rootElement = xmlDoc.documentElement;
    console.log("Root element:", rootElement.tagName);

    // Add your XML processing logic here
    return NotesAPI.loadAndStoreXML(xmlDoc);
  }

  static importFile(selectedFile: File) {
    if (
      selectedFile.type === "application/xml" ||
      selectedFile.type === "text/xml"
    ) {
      const reader = new FileReader();
      reader.onload = function (event) {
        const xmlContent = event.target?.result as string;

        NotesAPI.parseAndProcessXML(xmlContent);
      };
      reader.readAsText(selectedFile);
    } else {
      console.error("Invalid file type. Please select an XML file.");
    }
  }

  static parseXmlItem(xmlItem: any) {
    return {
      id: xmlItem.id,
      title: xmlItem.title,
      body: xmlItem.body,
      updated: xmlItem.updated,
    };
  }

  static async loadAndStoreXML(xmlDoc: Document) {
    try {
      const result: Note[] = [];

      const len = xmlDoc.getElementsByTagName("title").length;
      for (let i = 0; i < len; i++) {
        result.push({
          title: String(xmlDoc.getElementsByTagName("title")[i]["textContent"]),
          id: Number(xmlDoc.getElementsByTagName("id")[i]["textContent"]),
          body: String(xmlDoc.getElementsByTagName("body")[i]["textContent"]),
          updated: String(
            xmlDoc.getElementsByTagName("updated")[i]["textContent"]
          ),
        });
      }

      const existing = NotesAPI.getAllNotes();

      const mergedArray = [...existing, ...result].filter(
        (item, index, array) =>
          array.findIndex((i) => i.id === item.id) === index
      );

      localStorage.setItem("notesapp-notes", JSON.stringify(mergedArray));
      window.location.reload(); //lazy, doesn't want to use custom event
    } catch (error) {
      console.error("Error loading XML:", error);
      return undefined;
    }
  }

  static exportNotesToXML(): void {
    const notes = NotesAPI.getAllNotes();
    if (!notes || !notes.length) return;
    const root = builder.create("notes");

    notes.forEach((note, index) => {
      const noteElement = root.ele("note", { id: index + 1 });
      noteElement.ele("id", note.id);
      noteElement.ele("body", note.body);
      noteElement.ele("title", note.title);
      noteElement.ele("updated", note.updated);
    });

    const xmlData = root.end({ pretty: true });

    const downloadLink = document.createElement("a");
    const blob = new Blob([xmlData], { type: "application/xml" });
    const url = URL.createObjectURL(blob);

    downloadLink.href = url;
    downloadLink.download = "notes.xml";

    document.body.appendChild(downloadLink);
    downloadLink.click();

    // Clean up
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  }

  static getAllNotes(): Note[] {
    const notes: Note[] = JSON.parse(
      localStorage.getItem("notesapp-notes") || "[]"
    );

    return notes.sort((a, b) => {
      return new Date(a.updated) > new Date(b.updated) ? -1 : 1;
    });
  }

  static saveNote(noteToSave: Note): void {
    const notes: Note[] = NotesAPI.getAllNotes();
    const existing: Note | undefined = notes.find(
      (note) => note.id === noteToSave.id
    );

    // Edit/Update
    if (existing) {
      existing.title = noteToSave.title;
      existing.body = noteToSave.body;
      existing.updated = new Date().toISOString();
    } else {
      noteToSave.id = Math.floor(Math.random() * 1000000);
      noteToSave.updated = new Date().toISOString();
      notes.push(noteToSave);
    }

    localStorage.setItem("notesapp-notes", JSON.stringify(notes));
  }

  static deleteNote(id: number): void {
    console.log(id);
    const notes: Note[] = NotesAPI.getAllNotes();
    const newNotes: Note[] = notes.filter((note) => note.id != id);

    localStorage.setItem("notesapp-notes", JSON.stringify(newNotes));
  }
}
