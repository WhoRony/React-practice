import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";

function App() {
  const { register, handleSubmit, reset } = useForm();

  // Dark Mode
  const [dark, setDark] = useState(false);

  // Load tasks from localStorage (only once)
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("tasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState(""); // ✅ NEW SEARCH STATE

  const renderCount = useRef(0);
  const intervalRef = useRef(null);

  // Save to localStorage manually
  const saveTasks = (updated) => {
    setTasks(updated);
    localStorage.setItem("tasks", JSON.stringify(updated));
  };

  // Add Task
  const onSubmit = (data) => {
    const newTask = {
      id: Date.now(),
      title: data.title,
      description: data.description,
      priority: data.priority,
      completed: false,
      time: 0,
      running: false,
    };

    const updated = [...tasks, newTask];
    saveTasks(updated);
    reset();
  };

  // Delete Task
  const deleteTask = (id) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
  };

  // Complete Task
  const toggleComplete = (id) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed, running: false } : t
    );

    clearInterval(intervalRef.current);
    saveTasks(updated);
  };

  // Timer
  const toggleTimer = (id) => {
    const selected = tasks.find((t) => t.id === id);
    if (!selected || selected.completed) return;

    let updated;

    if (selected.running) {
      clearInterval(intervalRef.current);
      updated = tasks.map((t) =>
        t.id === id ? { ...t, running: false } : t
      );
      saveTasks(updated);
    } else {
      clearInterval(intervalRef.current);

      updated = tasks.map((t) =>
        t.id === id
          ? { ...t, running: true }
          : { ...t, running: false }
      );

      saveTasks(updated);

      intervalRef.current = setInterval(() => {
        setTasks((prev) => {
          const newTasks = prev.map((t) =>
            t.id === id && t.running
              ? { ...t, time: t.time + 1 }
              : t
          );
          localStorage.setItem("tasks", JSON.stringify(newTasks));
          renderCount.current++;
          return newTasks;
        });
      }, 1000);
    }
  };

  // Dark Mode Toggle
  const toggleDark = () => {
    setDark(!dark);
    renderCount.current++;
  };

  // ✅ FILTER + SEARCH LOGIC
  const filteredTasks = tasks
    .filter((task) => {
      if (filter === "active") return !task.completed;
      if (filter === "completed") return task.completed;
      return true;
    })
    .filter((task) => {
      const text = search.toLowerCase();
      return (
        task.title.toLowerCase().includes(text) ||
        task.description.toLowerCase().includes(text)
      );
    });

  const completedCount = tasks.filter((t) => t.completed).length;
  const activeCount = tasks.length - completedCount;
  const totalTime = tasks.reduce((acc, t) => acc + t.time, 0);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      className={`min-h-screen p-10 overflow-x-auto ${
        dark ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-800"
      }`}
    >
      <div className="w-[1100px] mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Task Manager</h1>

          <div className="flex gap-6 items-center">
            <p className="text-sm text-gray-500">
              Controlled Renders: {renderCount.current}
            </p>

            <button
              onClick={toggleDark}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              {dark ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={`p-4 rounded shadow mb-6 ${
            dark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <input
            {...register("title")}
            placeholder="Title"
            className={`w-full p-2 border rounded mb-3 ${
              dark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
            }`}
            required
          />

          <textarea
            {...register("description")}
            placeholder="Description"
            className={`w-full p-2 border rounded mb-3 ${
              dark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
            }`}
            required
          />

          <select
            {...register("priority")}
            className={`w-full p-2 border rounded mb-3 ${
              dark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
            }`}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
            Add Task
          </button>
        </form>

        {/* 🔍 Search Bar */}
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full p-2 border rounded mb-4 ${
            dark ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"
          }`}
        />

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          {["all", "active", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1 rounded ${
                filter === f
                  ? "bg-blue-600 text-white"
                  : dark
                  ? "bg-gray-700 text-gray-200"
                  : "bg-gray-300 text-gray-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Tasks */}
        {filteredTasks.length === 0 && (
          <p className="text-gray-500">No tasks found.</p>
        )}

        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 rounded shadow mb-3 ${
              dark ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h3
              className={`font-bold ${
                task.completed ? "line-through text-gray-400" : ""
              }`}
            >
              {task.title}
            </h3>

            <p className="text-sm text-gray-500">
              {task.description}
            </p>

            <p className="text-sm">
              Priority:{" "}
              <span
                className={
                  task.priority === "High"
                    ? "text-red-600"
                    : task.priority === "Medium"
                    ? "text-yellow-600"
                    : "text-green-600"
                }
              >
                {task.priority}
              </span>
            </p>

            <p className="text-sm font-mono">
              Time: {formatTime(task.time)}
            </p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => toggleTimer(task.id)}
                disabled={task.completed}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded disabled:bg-gray-400"
              >
                {task.running ? "Stop" : "Start"}
              </button>

              <button
                onClick={() => toggleComplete(task.id)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded"
              >
                {task.completed ? "Undo" : "Complete"}
              </button>

              <button
                onClick={() => deleteTask(task.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {/* Statistics */}
        <div
          className={`p-4 rounded shadow mt-6 ${
            dark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2 className="font-bold mb-2">Statistics</h2>

          <p>Total Tasks: {tasks.length}</p>
          <p>Completed: {completedCount}</p>
          <p>Active: {activeCount}</p>
          <p>Total Time: {formatTime(totalTime)}</p>
        </div>

      </div>
    </div>
  );
}

export default App;
