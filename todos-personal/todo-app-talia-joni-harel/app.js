// Import Firebase modules
import { db, auth } from './firebase-config.js';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  where,
  Timestamp 
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { 
  onAuthStateChanged,
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";


// Task Manager Application with Firebase Firestore
class TaskManager {
  constructor(user) {
    console.log('🚀 TaskManager constructor called');
    this.user = user;
    this.tasks = [];
    this.taskInput = document.getElementById("taskInput");
    this.addTaskBtn = document.getElementById("addTaskBtn");
    this.tasksList = document.getElementById("tasksList");
    this.emptyState = document.getElementById("emptyState");
    this.activeCount = document.getElementById("activeCount");
    this.totalCount = document.getElementById("totalCount");
    this.userEmail = document.getElementById("userEmail");
    this.logoutBtn = document.getElementById("logoutBtn");
    this.tasksCollection = collection(db, "tasks");
    this.unsubscribe = null;
    console.log('📦 Database collection initialized:', this.tasksCollection);
    console.log('👤 User:', user.email);

    this.init();
  }

  init() {
    console.log('⚙️ Initializing TaskManager');
    
    // Display user email
    if (this.userEmail) {
      this.userEmail.textContent = this.user.email;
    }
    
    // Logout button
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener("click", () => this.logout());
    }
    
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

    // Attach event listeners for task actions (toggle and delete)
    this.attachTaskListeners();

    // Set up real-time listener for tasks
    this.setupRealtimeListener();
  }

  setupRealtimeListener() {
    // Query tasks for current user only
    // Note: We filter by userId only to avoid needing a Firestore composite index
    // Sorting is done client-side in JavaScript instead
    const q = query(
      this.tasksCollection, 
      where("userId", "==", this.user.uid)
    );
    
    console.log('📡 Setting up real-time listener for user:', this.user.uid);
    
    // Listen for real-time updates
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort tasks by creation date (newest first) - done client-side
      this.tasks.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA; // Descending order (newest first)
      });
      
      console.log('📋 Tasks loaded:', this.tasks.length);
      this.render();
    }, (error) => {
      console.error("Error fetching tasks:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
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
      userId: this.user.uid,
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
    console.log('🗑️ deleteTask called with ID:', id);
    // Add fade out animation before removing
    const taskElement = document.querySelector(`[data-task-id="${id}"]`);
    console.log('📍 Task element found:', taskElement);
    
    if (taskElement) {
      console.log('✨ Starting delete animation');
      taskElement.style.animation = "taskDisappear 0.3s ease-out";

      setTimeout(async () => {
        try {
          console.log('🔥 Attempting to delete from Firestore, ID:', id);
          const taskRef = doc(db, "tasks", id);
          await deleteDoc(taskRef);
          console.log('✅ Task deleted successfully from Firestore');
        } catch (error) {
          console.error("❌ Error deleting task:", error);
          console.error("Error details:", error.message, error.code);
          alert("Failed to delete task. Please try again. Error: " + error.message);
          // Revert animation if deletion fails
          taskElement.style.animation = "";
        }
      }, 300);
    } else {
      console.warn('⚠️ Task element not found for ID:', id);
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
    console.log('🎯 Attaching task listeners with event delegation');
    // Use event delegation for better performance
    this.tasksList.addEventListener("click", (e) => {
      console.log('👆 Click detected on:', e.target);
      const action = e.target.dataset.action;
      const id = e.target.dataset.id;
      console.log('📋 Action:', action, 'ID:', id);

      if (action === "toggle") {
        console.log('✓ Toggle action triggered');
        this.toggleTask(id);
      } else if (action === "delete") {
        console.log('🗑️ Delete action triggered');
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
  
  // Logout method
  async logout() {
    try {
      await signOut(auth);
      window.location.href = 'auth.html';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
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

// Check authentication state before initializing app
console.log('🔐 Checking authentication state...');
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, initialize the app
    console.log('✅ User authenticated:', user.email);
    const taskManager = new TaskManager(user);
    
    // Store reference for cleanup if needed
    window.taskManager = taskManager;
  } else {
    // No user is signed in, redirect to auth page
    console.log('❌ No user signed in, redirecting to auth page...');
    window.location.href = 'auth.html';
  }
});
