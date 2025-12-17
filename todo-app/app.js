// Import Firebase modules
import { db } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy,
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";


// Task Manager Application with Firebase Firestore
class TaskManager {
  constructor() {
    console.log('🚀 TaskManager constructor called');
    this.tasks = [];
    this.taskInput = document.getElementById("taskInput");
    this.addTaskBtn = document.getElementById("addTaskBtn");
    this.tasksList = document.getElementById("tasksList");
    this.emptyState = document.getElementById("emptyState");
    this.activeCount = document.getElementById("activeCount");
    this.totalCount = document.getElementById("totalCount");
    this.tasksCollection = collection(db, "tasks");
    this.unsubscribe = null;
    console.log('📦 Database collection initialized:', this.tasksCollection);

    this.init();
  }

  init() {
    console.log('⚙️ Initializing TaskManager');
    // Event listeners
    this.addTaskBtn.addEventListener("click", () => {
      console.log('🖱️ Add button clicked');
      this.addTask();
    });
    this.taskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        console.log('⌨️ Enter key pressed');
        this.addTask();
      }
    });

<<<<<<< Updated upstream
    // Set up real-time listener for tasks
    this.setupRealtimeListener();
=======
    // Attach task list listeners once
    this.attachTaskListeners();

    // Render initial tasks
    this.render();

    // Attach event listeners for tasks (delegation)
    this.attachTaskListeners();
  }

  setupRealtimeListener() {
    // Query tasks ordered by creation date (newest first)
    const q = query(this.tasksCollection, orderBy("createdAt", "desc"));
    
    // Listen for real-time updates
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      this.render();
    }, (error) => {
      console.error("Error fetching tasks:", error);
    });
  }

  async addTask() {
    console.log('➕ addTask called');
    const text = this.taskInput.value.trim();
    console.log('📝 Task text:', text);

    if (!text) {
      console.log('⚠️ No text entered, focusing input');
      this.taskInput.focus();
      return;
    }

    const task = {
      text: text,
      completed: false,
      createdAt: Timestamp.now(),
    };

    try {
      console.log('💾 Attempting to add task to Firestore:', task);
      // Add task to Firestore
      const docRef = await addDoc(this.tasksCollection, task);
      console.log('✅ Task added successfully with ID:', docRef.id);

      // Clear input and focus
      this.taskInput.value = "";
      this.taskInput.focus();

      // Add micro-animation feedback
      this.addTaskBtn.style.transform = "scale(0.95)";
      setTimeout(() => {
        this.addTaskBtn.style.transform = "";
      }, 100);
    } catch (error) {
      console.error("❌ Error adding task:", error);
      console.error("Error details:", error.message, error.code);
      alert("Failed to add task. Please try again. Error: " + error.message);
    }
  }

  async toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      try {
        const taskRef = doc(db, "tasks", id);
        await updateDoc(taskRef, {
          completed: !task.completed
        });
      } catch (error) {
        console.error("Error toggling task:", error);
        alert("Failed to update task. Please try again.");
      }
    }
  }

  async deleteTask(id) {
    // Add fade out animation before removing
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    if (taskElement) {
      taskElement.style.animation = "taskDisappear 0.3s ease-out";

      setTimeout(async () => {
        try {
          const taskRef = doc(db, "tasks", id);
          await deleteDoc(taskRef);
        } catch (error) {
          console.error("Error deleting task:", error);
          alert("Failed to delete task. Please try again.");
          // Revert animation if deletion fails
          taskElement.style.animation = "";
        }
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
<<<<<<< Updated upstream

    // Attach event listeners to newly created elements
    // this.attachTaskListeners(); // Moved to init() to prevent multiple listeners
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
      const id = e.target.dataset.id;

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

  // Cleanup method to unsubscribe from Firestore listener
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
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
