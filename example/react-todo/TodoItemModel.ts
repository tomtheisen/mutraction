export class TodoItemModel {
    title: string;
    editingTitle = "";
    editing = false;
    done = false;

    constructor(title: string) {
        this.title = title;
    }

    startEditing() {
        this.editing = true;
        this.editingTitle = this.title;
    }

    saveTitle() {
        this.editing = false;
        this.title = this.editingTitle;
    }

    cancel() {
        this.editing = false;
    }
}
