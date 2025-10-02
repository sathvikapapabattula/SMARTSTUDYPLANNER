// Smart Study Planner - JavaScript Functionality
class StudyPlanner {
    constructor() {
        this.goals = this.loadFromStorage('goals') || [];
        this.tasks = this.loadFromStorage('tasks') || [];
        this.reminders = this.loadFromStorage('reminders') || [];
        this.currentEditingId = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initTheme();
        this.renderGoals();
        this.renderTasks();
        this.renderReminders();
        this.renderTimeline();
        this.updateGoalSelect();
        this.checkReminders();
        
        // Check reminders every minute
        setInterval(() => this.checkReminders(), 60000);
    }

    // Local Storage Methods
    saveToStorage(key, data) {
        localStorage.setItem(`studyPlanner_${key}`, JSON.stringify(data));
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(`studyPlanner_${key}`);
        return data ? JSON.parse(data) : null;
    }

    // Theme Management
    initTheme() {
        const savedTheme = localStorage.getItem('studyPlanner_theme') || 'light';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('studyPlanner_theme', theme);
        
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('i');
        
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
            themeToggle.setAttribute('aria-label', 'Switch to light mode');
        } else {
            icon.className = 'fas fa-moon';
            themeToggle.setAttribute('aria-label', 'Switch to dark mode');
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Theme Toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Goal Modal
        document.getElementById('addGoalBtn').addEventListener('click', () => this.openGoalModal());
        document.getElementById('closeGoalModal').addEventListener('click', () => this.closeGoalModal());
        document.getElementById('cancelGoal').addEventListener('click', () => this.closeGoalModal());
        document.getElementById('goalForm').addEventListener('submit', (e) => this.handleGoalSubmit(e));
        document.getElementById('goalProgress').addEventListener('input', (e) => {
            document.getElementById('progressValue').textContent = e.target.value + '%';
        });

        // Task Modal
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openTaskModal());
        document.getElementById('closeTaskModal').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('cancelTask').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));

        // Reminder Modal
        document.getElementById('addReminderBtn').addEventListener('click', () => this.openReminderModal());
        document.getElementById('closeReminderModal').addEventListener('click', () => this.closeReminderModal());
        document.getElementById('cancelReminder').addEventListener('click', () => this.closeReminderModal());
        document.getElementById('reminderForm').addEventListener('submit', (e) => this.handleReminderSubmit(e));

        // Task Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterTasks(e.target.dataset.filter));
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }

    // Tab Navigation
    switchTab(tabName) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Refresh timeline when switching to it
        if (tabName === 'timeline') {
            this.renderTimeline();
        }
    }

    // Goal Management
    openGoalModal(goalId = null) {
        this.currentEditingId = goalId;
        const modal = document.getElementById('goalModal');
        const form = document.getElementById('goalForm');
        
        if (goalId) {
            const goal = this.goals.find(g => g.id === goalId);
            if (goal) {
                document.getElementById('goalModalTitle').textContent = 'Edit Study Goal';
                document.getElementById('goalTitle').value = goal.title;
                document.getElementById('goalDescription').value = goal.description;
                document.getElementById('goalDeadline').value = goal.deadline;
                document.getElementById('goalPriority').value = goal.priority;
                document.getElementById('goalProgress').value = goal.progress;
                document.getElementById('progressValue').textContent = goal.progress + '%';
            }
        } else {
            document.getElementById('goalModalTitle').textContent = 'Add Study Goal';
            form.reset();
            document.getElementById('progressValue').textContent = '0%';
        }
        
        modal.style.display = 'block';
    }

    closeGoalModal() {
        document.getElementById('goalModal').style.display = 'none';
        this.currentEditingId = null;
    }

    handleGoalSubmit(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('goalTitle').value,
            description: document.getElementById('goalDescription').value,
            deadline: document.getElementById('goalDeadline').value,
            priority: document.getElementById('goalPriority').value,
            progress: parseInt(document.getElementById('goalProgress').value)
        };

        if (this.currentEditingId) {
            // Edit existing goal
            const index = this.goals.findIndex(g => g.id === this.currentEditingId);
            if (index !== -1) {
                this.goals[index] = { ...this.goals[index], ...formData };
                this.showNotification('Goal updated successfully!', 'success');
            }
        } else {
            // Add new goal
            const newGoal = {
                id: Date.now().toString(),
                ...formData,
                createdAt: new Date().toISOString()
            };
            this.goals.push(newGoal);
            this.showNotification('Goal added successfully!', 'success');
        }

        this.saveToStorage('goals', this.goals);
        this.renderGoals();
        this.updateGoalSelect();
        this.closeGoalModal();
    }

    deleteGoal(goalId) {
        if (confirm('Are you sure you want to delete this goal?')) {
            this.goals = this.goals.filter(g => g.id !== goalId);
            this.tasks = this.tasks.filter(t => t.goalId !== goalId);
            this.saveToStorage('goals', this.goals);
            this.saveToStorage('tasks', this.tasks);
            this.renderGoals();
            this.renderTasks();
            this.updateGoalSelect();
            this.showNotification('Goal deleted successfully!', 'success');
        }
    }

    renderGoals() {
        const container = document.getElementById('goalsGrid');
        
        if (this.goals.length === 0) {
            container.innerHTML = `
                <div class="empty-state fade-in-up">
                    <i class="fas fa-target"></i>
                    <h3>No Study Goals Yet</h3>
                    <p>Create your first study goal to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.goals.map((goal, index) => `
            <div class="goal-card ${goal.priority}-priority fade-in-up" style="animation-delay: ${index * 0.1}s">
                <div class="goal-header">
                    <div>
                        <div class="goal-title">${this.escapeHtml(goal.title)}</div>
                        <span class="goal-priority ${goal.priority}">${goal.priority}</span>
                    </div>
                    <div class="goal-actions">
                        <button class="btn btn-sm btn-primary" onclick="planner.openGoalModal('${goal.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="planner.deleteGoal('${goal.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="goal-description">${this.escapeHtml(goal.description)}</div>
                <div class="goal-deadline">
                    <i class="fas fa-calendar"></i> Deadline: ${this.formatDate(goal.deadline)}
                </div>
                <div class="goal-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${goal.progress}%"></div>
                    </div>
                    <div class="progress-text">${goal.progress}% Complete</div>
                </div>
            </div>
        `).join('');
    }

    // Task Management
    openTaskModal(taskId = null) {
        this.currentEditingId = taskId;
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        
        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                document.getElementById('taskModalTitle').textContent = 'Edit Task';
                document.getElementById('taskTitle').value = task.title;
                document.getElementById('taskDescription').value = task.description;
                document.getElementById('taskGoal').value = task.goalId || '';
                document.getElementById('taskDueDate').value = task.dueDate || '';
                document.getElementById('taskPriority').value = task.priority;
            }
        } else {
            document.getElementById('taskModalTitle').textContent = 'Add Task';
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    closeTaskModal() {
        document.getElementById('taskModal').style.display = 'none';
        this.currentEditingId = null;
    }

    handleTaskSubmit(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            goalId: document.getElementById('taskGoal').value || null,
            dueDate: document.getElementById('taskDueDate').value || null,
            priority: document.getElementById('taskPriority').value
        };

        if (this.currentEditingId) {
            // Edit existing task
            const index = this.tasks.findIndex(t => t.id === this.currentEditingId);
            if (index !== -1) {
                this.tasks[index] = { ...this.tasks[index], ...formData };
                this.showNotification('Task updated successfully!', 'success');
            }
        } else {
            // Add new task
            const newTask = {
                id: Date.now().toString(),
                ...formData,
                completed: false,
                createdAt: new Date().toISOString()
            };
            this.tasks.push(newTask);
            this.showNotification('Task added successfully!', 'success');
        }

        this.saveToStorage('tasks', this.tasks);
        this.renderTasks();
        this.closeTaskModal();
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveToStorage('tasks', this.tasks);
            this.renderTasks();
            this.showNotification(
                task.completed ? 'Task completed!' : 'Task marked as pending',
                'success'
            );
        }
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveToStorage('tasks', this.tasks);
            this.renderTasks();
            this.showNotification('Task deleted successfully!', 'success');
        }
    }

    filterTasks(filter) {
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        this.currentFilter = filter;
        this.renderTasks();
    }

    renderTasks() {
        const container = document.getElementById('tasksList');
        let filteredTasks = this.tasks;

        // Apply filter
        if (this.currentFilter === 'pending') {
            filteredTasks = this.tasks.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = this.tasks.filter(t => t.completed);
        }

        if (filteredTasks.length === 0) {
            const message = this.currentFilter === 'all' ? 'No tasks yet' :
                          this.currentFilter === 'pending' ? 'No pending tasks' :
                          'No completed tasks';
            container.innerHTML = `
                <div class="empty-state fade-in-up">
                    <i class="fas fa-tasks"></i>
                    <h3>${message}</h3>
                    <p>Create your first task to get started!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTasks.map((task, index) => {
            const goal = task.goalId ? this.goals.find(g => g.id === task.goalId) : null;
            return `
                <div class="task-item ${task.completed ? 'completed' : ''} fade-in-up" style="animation-delay: ${index * 0.1}s">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                         onclick="planner.toggleTask('${task.id}')">
                        ${task.completed ? '<i class="fas fa-check"></i>' : ''}
                    </div>
                    <div class="task-content">
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                        <div class="task-description">${this.escapeHtml(task.description)}</div>
                        <div class="task-meta">
                            <span class="task-priority ${task.priority}">
                                <i class="fas fa-flag"></i> ${task.priority}
                            </span>
                            ${task.dueDate ? `<span><i class="fas fa-calendar"></i> ${this.formatDate(task.dueDate)}</span>` : ''}
                            ${goal ? `<span><i class="fas fa-target"></i> ${this.escapeHtml(goal.title)}</span>` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-sm btn-primary" onclick="planner.openTaskModal('${task.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="planner.deleteTask('${task.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Reminder Management
    openReminderModal(reminderId = null) {
        this.currentEditingId = reminderId;
        const modal = document.getElementById('reminderModal');
        const form = document.getElementById('reminderForm');
        
        if (reminderId) {
            const reminder = this.reminders.find(r => r.id === reminderId);
            if (reminder) {
                document.getElementById('reminderModalTitle').textContent = 'Edit Reminder';
                document.getElementById('reminderTitle').value = reminder.title;
                document.getElementById('reminderDescription').value = reminder.description;
                document.getElementById('reminderDate').value = reminder.date;
                document.getElementById('reminderTime').value = reminder.time;
                document.getElementById('reminderType').value = reminder.type;
            }
        } else {
            document.getElementById('reminderModalTitle').textContent = 'Add Reminder';
            form.reset();
        }
        
        modal.style.display = 'block';
    }

    closeReminderModal() {
        document.getElementById('reminderModal').style.display = 'none';
        this.currentEditingId = null;
    }

    handleReminderSubmit(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('reminderTitle').value,
            description: document.getElementById('reminderDescription').value,
            date: document.getElementById('reminderDate').value,
            time: document.getElementById('reminderTime').value,
            type: document.getElementById('reminderType').value
        };

        if (this.currentEditingId) {
            // Edit existing reminder
            const index = this.reminders.findIndex(r => r.id === this.currentEditingId);
            if (index !== -1) {
                this.reminders[index] = { ...this.reminders[index], ...formData };
                this.showNotification('Reminder updated successfully!', 'success');
            }
        } else {
            // Add new reminder
            const newReminder = {
                id: Date.now().toString(),
                ...formData,
                createdAt: new Date().toISOString()
            };
            this.reminders.push(newReminder);
            this.showNotification('Reminder added successfully!', 'success');
        }

        this.saveToStorage('reminders', this.reminders);
        this.renderReminders();
        this.closeReminderModal();
    }

    deleteReminder(reminderId) {
        if (confirm('Are you sure you want to delete this reminder?')) {
            this.reminders = this.reminders.filter(r => r.id !== reminderId);
            this.saveToStorage('reminders', this.reminders);
            this.renderReminders();
            this.showNotification('Reminder deleted successfully!', 'success');
        }
    }

    renderReminders() {
        const container = document.getElementById('remindersList');
        
        if (this.reminders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell"></i>
                    <h3>No Reminders Yet</h3>
                    <p>Create your first reminder to stay on track!</p>
                </div>
            `;
            return;
        }

        // Sort reminders by date and time
        const sortedReminders = [...this.reminders].sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA - dateB;
        });

        container.innerHTML = sortedReminders.map(reminder => {
            const reminderDateTime = new Date(`${reminder.date} ${reminder.time}`);
            const now = new Date();
            const timeDiff = reminderDateTime - now;
            const isUrgent = timeDiff < 24 * 60 * 60 * 1000 && timeDiff > 0; // Less than 24 hours
            const isUpcoming = timeDiff < 7 * 24 * 60 * 60 * 1000 && timeDiff > 0; // Less than 7 days

            return `
                <div class="reminder-item ${isUrgent ? 'urgent' : isUpcoming ? 'upcoming' : ''}">
                    <div class="reminder-header">
                        <div class="reminder-title">${this.escapeHtml(reminder.title)}</div>
                        <span class="reminder-type ${reminder.type}">${reminder.type}</span>
                    </div>
                    <div class="reminder-datetime">
                        <i class="fas fa-clock"></i> ${this.formatDateTime(reminder.date, reminder.time)}
                    </div>
                    <div class="reminder-description">${this.escapeHtml(reminder.description)}</div>
                    <div class="reminder-actions">
                        <button class="btn btn-sm btn-primary" onclick="planner.openReminderModal('${reminder.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="planner.deleteReminder('${reminder.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    checkReminders() {
        const now = new Date();
        
        this.reminders.forEach(reminder => {
            const reminderDateTime = new Date(`${reminder.date} ${reminder.time}`);
            const timeDiff = reminderDateTime - now;
            
            // Show notification if reminder is due (within 5 minutes)
            if (timeDiff > 0 && timeDiff <= 5 * 60 * 1000) {
                this.showNotification(
                    `Reminder: ${reminder.title}`,
                    'warning'
                );
            }
        });
    }

    // Timeline Management
    renderTimeline() {
        const container = document.getElementById('timelineContainer');
        
        // Combine goals, tasks, and reminders for timeline
        const timelineItems = [];
        
        // Add goals
        this.goals.forEach(goal => {
            timelineItems.push({
                type: 'goal',
                title: goal.title,
                description: goal.description,
                date: goal.deadline,
                priority: goal.priority,
                progress: goal.progress
            });
        });
        
        // Add completed tasks
        this.tasks.filter(task => task.completed).forEach(task => {
            timelineItems.push({
                type: 'task',
                title: task.title,
                description: task.description,
                date: task.dueDate || task.createdAt,
                priority: task.priority
            });
        });
        
        // Add upcoming reminders
        this.reminders.forEach(reminder => {
            const reminderDate = new Date(`${reminder.date} ${reminder.time}`);
            if (reminderDate > new Date()) {
                timelineItems.push({
                    type: 'reminder',
                    title: reminder.title,
                    description: reminder.description,
                    date: reminder.date,
                    time: reminder.time,
                    reminderType: reminder.type
                });
            }
        });
        
        // Sort by date
        timelineItems.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (timelineItems.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <h3>No Timeline Items</h3>
                    <p>Create goals, complete tasks, and set reminders to see your timeline!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = timelineItems.map((item, index) => {
            const icon = item.type === 'goal' ? 'fas fa-target' :
                        item.type === 'task' ? 'fas fa-check-circle' :
                        'fas fa-bell';
            
            return `
                <div class="timeline-item">
                    <div class="timeline-marker">
                        <i class="${icon}"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-title">${this.escapeHtml(item.title)}</div>
                        <div class="timeline-date">
                            ${item.type === 'reminder' ? 
                                this.formatDateTime(item.date, item.time) : 
                                this.formatDate(item.date)
                            }
                        </div>
                        <div class="timeline-description">${this.escapeHtml(item.description)}</div>
                        ${item.type === 'goal' && item.progress ? 
                            `<div class="goal-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${item.progress}%"></div>
                                </div>
                                <div class="progress-text">${item.progress}% Complete</div>
                            </div>` : ''
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    // Utility Methods
    updateGoalSelect() {
        const select = document.getElementById('taskGoal');
        select.innerHTML = '<option value="">No specific goal</option>';
        
        this.goals.forEach(goal => {
            const option = document.createElement('option');
            option.value = goal.id;
            option.textContent = goal.title;
            select.appendChild(option);
        });
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        this.currentEditingId = null;
    }

    showNotification(message, type = 'success') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const title = type === 'success' ? 'Success' :
                     type === 'error' ? 'Error' :
                     type === 'warning' ? 'Warning' : 'Info';
        
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    formatDate(dateString) {
        if (!dateString) return 'No date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateTime(dateString, timeString) {
        if (!dateString || !timeString) return 'No date/time';
        const date = new Date(`${dateString} ${timeString}`);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
let planner;
document.addEventListener('DOMContentLoaded', () => {
    planner = new StudyPlanner();
});

// Add some sample data for demonstration (optional)
function addSampleData() {
    if (planner.goals.length === 0) {
        const sampleGoals = [
            {
                id: '1',
                title: 'Complete JavaScript Course',
                description: 'Finish the complete JavaScript fundamentals course and build 3 projects',
                deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                priority: 'high',
                progress: 25,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                title: 'Prepare for Math Exam',
                description: 'Study calculus and algebra for the upcoming final exam',
                deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                priority: 'medium',
                progress: 60,
                createdAt: new Date().toISOString()
            }
        ];

        const sampleTasks = [
            {
                id: '1',
                title: 'Complete JavaScript Arrays Chapter',
                description: 'Read chapter 5 and complete all exercises',
                goalId: '1',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                priority: 'high',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                title: 'Practice Calculus Problems',
                description: 'Solve 20 integration problems from textbook',
                goalId: '2',
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                priority: 'medium',
                completed: true,
                createdAt: new Date().toISOString()
            }
        ];

        const sampleReminders = [
            {
                id: '1',
                title: 'Study Session',
                description: 'Daily JavaScript practice session',
                date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                time: '19:00',
                type: 'study',
                createdAt: new Date().toISOString()
            }
        ];

        planner.goals = sampleGoals;
        planner.tasks = sampleTasks;
        planner.reminders = sampleReminders;
        
        planner.saveToStorage('goals', planner.goals);
        planner.saveToStorage('tasks', planner.tasks);
        planner.saveToStorage('reminders', planner.reminders);
        
        planner.renderGoals();
        planner.renderTasks();
        planner.renderReminders();
        planner.renderTimeline();
        planner.updateGoalSelect();
        
        planner.showNotification('Sample data added! You can now explore the features.', 'success');
    }
}

// Add sample data button (for demonstration)
document.addEventListener('DOMContentLoaded', () => {
    // Add a button to load sample data if no data exists
    if (localStorage.getItem('studyPlanner_goals') === null) {
        const addSampleBtn = document.createElement('button');
        addSampleBtn.className = 'btn btn-secondary';
        addSampleBtn.innerHTML = '<i class="fas fa-database"></i> Add Sample Data';
        addSampleBtn.style.marginLeft = '10px';
        addSampleBtn.onclick = addSampleData;
        
        const header = document.querySelector('.section-header');
        if (header) {
            header.appendChild(addSampleBtn);
        }
    }
});
