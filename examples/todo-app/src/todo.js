export class TodoList {
  constructor() {
    this.tasks = [];
    this.nextId = 1;
  }

  createTask(title) {
    const normalizedTitle = typeof title === "string" ? title.trim() : "";

    if (!normalizedTitle) {
      throw new Error("Task title is required.");
    }

    const task = {
      id: this.nextId,
      title: normalizedTitle,
      completed: false
    };

    this.nextId += 1;
    this.tasks.push(task);

    return task;
  }

  listTasks() {
    return [...this.tasks];
  }
}
