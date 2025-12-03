// Task Manager Application
class TaskManager {
  constructor() {
    this.tasks = this.loadTasks();
    this.taskInput = document.getElementById("taskInput");
    this.addTaskBtn = document.getElementById("addTaskBtn");
    this.tasksList = document.getElementById("tasksList");
    this.emptyState = document.getElementById("emptyState");
    this.activeCount = document.getElementById("activeCount");
    this.totalCount = document.getElementById("totalCount");

    this.init();
  }

  init() {
    // Event listeners
    this.addTaskBtn.addEventListener("click", () => this.addTask());
    this.taskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addTask();
    });

    // Render initial tasks
    this.render();

    // Attach event listeners to the list once
    this.attachTaskListeners();
  }

  loadTasks() {
    try {
      const stored = localStorage.getItem("taskflow-tasks");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading tasks:", error);
      return [];
    }
  }

  saveTasks() {
    try {
      localStorage.setItem("taskflow-tasks", JSON.stringify(this.tasks));
    } catch (error) {
      console.error("Error saving tasks:", error);
    }
  }

  addTask() {
    const text = this.taskInput.value.trim();

    if (!text) {
      this.taskInput.focus();
      return;
    }

    const task = {
      id: Date.now(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    this.tasks.unshift(task);
    this.saveTasks();
    this.render();

    // Clear input and focus
    this.taskInput.value = "";
    this.taskInput.focus();

    // Add micro-animation feedback
    this.addTaskBtn.style.transform = "scale(0.95)";
    setTimeout(() => {
      this.addTaskBtn.style.transform = "";
    }, 100);
  }

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.render();
    }
  }

  deleteTask(id) {
    // Add fade out animation before removing
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    if (taskElement) {
      taskElement.style.animation = "taskDisappear 0.3s ease-out";

      setTimeout(() => {
        this.tasks = this.tasks.filter((t) => t.id !== id);
        this.saveTasks();
        this.render();
      }, 300);
    }
  }

  getActiveTasks() {
    return this.tasks.filter((t) => !t.completed);
  }

  render() {
    // Update counts
    const activeTasksCount = this.getActiveTasks().length;
    const totalTasksCount = this.tasks.length;

    this.activeCount.textContent = activeTasksCount;
    this.totalCount.textContent = totalTasksCount;

    // Show/hide empty state
    if (this.tasks.length === 0) {
      this.emptyState.style.display = "block";
      // Clear the task list to remove any lingering tasks from the DOM
      this.tasksList.innerHTML = '<li class="empty-state" id="emptyState"><div class="empty-state-icon" aria-hidden="true">📝</div><p>No tasks yet. Add one to get started!</p></li>';
      return;
    } else {
      this.emptyState.style.display = "none";
    }

    // Render tasks
    this.tasksList.innerHTML = this.tasks
      .map((task) => this.createTaskHTML(task))
      .join("");

    // Attach event listeners to newly created elements
    // this.attachTaskListeners(); // REMOVED: Moved to init() to prevent duplicates
  }

  createTaskHTML(task) {
    return `
      <li class="task-item ${task.completed ? "completed" : ""
      }" data-task-id="${task.id}" role="listitem">
        <input 
          type="checkbox" 
          class="task-checkbox" 
          ${task.completed ? "checked" : ""}
          data-action="toggle"
          data-id="${task.id}"
          id="task-${task.id}"
          aria-label="Mark task as ${task.completed ? "incomplete" : "complete"
      }"
        >
        <label for="task-${task.id}" class="task-text">${this.escapeHtml(
        task.text
      )}</label>
        <button 
          class="btn-delete" 
          data-action="delete"
          data-id="${task.id}"
          aria-label="Delete task: ${this.escapeHtml(task.text)}"
        >
          Delete
        </button>
      </li>
    `;
  }

  attachTaskListeners() {
    // Use event delegation for better performance
    this.tasksList.addEventListener("click", (e) => {
      const action = e.target.dataset.action;
      const id = parseInt(e.target.dataset.id);

      if (action === "toggle") {
        this.toggleTask(id);
      } else if (action === "delete") {
        this.deleteTask(id);
      }
    });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Add disappear animation to CSS dynamically
const style = document.createElement("style");
style.textContent = `
  @keyframes taskDisappear {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(-20px);
    }
  }
`;
document.head.appendChild(style);

// Initialize the app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new TaskManager());
} else {
  new TaskManager();
}
