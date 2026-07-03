import test from "node:test";
import assert from "node:assert/strict";
import { TodoList } from "../src/todo.js";

test("creates a task with a title", () => {
  const todo = new TodoList();

  const task = todo.createTask("Write AIEF spec");

  assert.equal(task.id, 1);
  assert.equal(task.title, "Write AIEF spec");
  assert.equal(task.completed, false);
});

test("lists created tasks", () => {
  const todo = new TodoList();

  todo.createTask("Create spec");
  todo.createTask("Create tasks");

  const tasks = todo.listTasks();

  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].title, "Create spec");
  assert.equal(tasks[1].title, "Create tasks");
});

test("rejects empty task titles", () => {
  const todo = new TodoList();

  assert.throws(
    () => todo.createTask("   "),
    /Task title is required/
  );
});
