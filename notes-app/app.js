class App {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem('notes-app-data')) || [];
        this.activeNote = null;

        this.$addNoteBtn = document.getElementById('add-note-btn');
        this.$notesList = document.getElementById('notes-list');
        this.$noteTitle = document.getElementById('note-title');
        this.$noteContent = document.getElementById('note-content');

        this.addEventListeners();
        this.renderNotesList();
    }

    addEventListeners() {
        this.$addNoteBtn.addEventListener('click', () => this.addNote());
        this.$noteTitle.addEventListener('input', () => this.saveNote());
        this.$noteContent.addEventListener('input', () => this.saveNote());
    }

    saveNote() {
        if (!this.activeNote) return;

        this.activeNote.title = this.$noteTitle.value;
        this.activeNote.body = this.$noteContent.value;
        this.activeNote.updated = new Date().toISOString();

        this.saveNotesToStorage();
        this.renderNotesList();
    }

    saveNotesToStorage() {
        localStorage.setItem('notes-app-data', JSON.stringify(this.notes));
    }

    addNote() {
        const newNote = {
            id: Math.floor(Math.random() * 1000000),
            title: 'New Note',
            body: 'Take a note...',
            updated: new Date().toISOString()
        };

        this.notes.push(newNote);
        this.saveNotesToStorage();
        this.renderNotesList();
        this.setActiveNote(newNote);
    }

    setActiveNote(note) {
        this.activeNote = note;
        this.$noteTitle.value = note.title;
        this.$noteContent.value = note.body;
        this.renderNotesList(); // Re-render to highlight selected
    }

    deleteNote(e, noteId) {
        e.stopPropagation();
        this.notes = this.notes.filter(note => note.id !== noteId);
        this.saveNotesToStorage();
        this.renderNotesList();

        if (this.activeNote && this.activeNote.id === noteId) {
            this.activeNote = null;
            this.$noteTitle.value = '';
            this.$noteContent.value = '';
        }
    }

    renderNotesList() {
        this.$notesList.innerHTML = '';

        this.notes.sort((a, b) => new Date(b.updated) - new Date(a.updated)).forEach(note => {
            const $noteItem = document.createElement('div');
            $noteItem.classList.add('notes-list-item');
            if (this.activeNote && this.activeNote.id === note.id) {
                $noteItem.classList.add('selected');
            }

            $noteItem.innerHTML = `
                <div class="notes-list-item-title">${note.title}</div>
                <div class="notes-list-item-body">${note.body.substring(0, 50)}${note.body.length > 50 ? '...' : ''}</div>
                <div class="notes-list-item-updated">${new Date(note.updated).toLocaleString()}</div>
            `;

            $noteItem.addEventListener('click', () => this.setActiveNote(note));

            // Add delete button (simple implementation for now, maybe improve UI later)
            $noteItem.addEventListener('dblclick', (e) => {
                if (confirm('Delete this note?')) {
                    this.deleteNote(e, note.id);
                }
            });

            this.$notesList.appendChild($noteItem);
        });
    }
}

new App();
