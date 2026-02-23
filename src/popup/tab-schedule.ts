import { getStorage, setStorage } from "../storage";
import type { Schedule } from "../types";

let schedules: Schedule[] = [];
let scheduleEnabled = false;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function renderSchedules(): void {
  const container = document.getElementById("scheduleContent") as HTMLDivElement;
  container.innerHTML = "";

  if (schedules.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No schedules yet. Add one to auto-block at specific times.";
    container.appendChild(empty);
    return;
  }

  for (const schedule of schedules) {
    const card = document.createElement("div");
    card.className = "schedule-card";

    // Header row
    const header = document.createElement("div");
    header.className = "schedule-header";

    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.className = "schedule-label";
    labelInput.value = schedule.label;
    labelInput.placeholder = "Schedule name";
    labelInput.addEventListener("change", () => {
      schedule.label = labelInput.value;
      saveSchedules();
    });

    const actions = document.createElement("div");
    actions.className = "schedule-actions";

    const toggle = document.createElement("label");
    toggle.className = "switch switch-sm";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = schedule.enabled;
    checkbox.addEventListener("change", () => {
      schedule.enabled = checkbox.checked;
      saveSchedules();
    });
    const slider = document.createElement("span");
    slider.className = "slider";
    toggle.appendChild(checkbox);
    toggle.appendChild(slider);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "schedule-delete";
    deleteBtn.textContent = "\u00d7";
    deleteBtn.title = "Delete schedule";
    deleteBtn.addEventListener("click", () => deleteSchedule(schedule.id));

    actions.appendChild(toggle);
    actions.appendChild(deleteBtn);

    header.appendChild(labelInput);
    header.appendChild(actions);

    // Day buttons
    const daysRow = document.createElement("div");
    daysRow.className = "schedule-days";

    for (let d = 0; d < 7; d++) {
      const dayBtn = document.createElement("button");
      dayBtn.className = "day-btn";
      dayBtn.textContent = DAY_LABELS[d];
      dayBtn.classList.toggle("active", schedule.days.includes(d));
      dayBtn.addEventListener("click", () => {
        if (schedule.days.includes(d)) {
          schedule.days = schedule.days.filter((day) => day !== d);
        } else {
          schedule.days.push(d);
          schedule.days.sort();
        }
        dayBtn.classList.toggle("active", schedule.days.includes(d));
        saveSchedules();
      });
      daysRow.appendChild(dayBtn);
    }

    // Time inputs
    const timeRow = document.createElement("div");
    timeRow.className = "schedule-time";

    const startInput = document.createElement("input");
    startInput.type = "time";
    startInput.className = "time-input";
    startInput.value = schedule.startTime;
    startInput.addEventListener("change", () => {
      schedule.startTime = startInput.value;
      saveSchedules();
    });

    const separator = document.createElement("span");
    separator.className = "time-separator";
    separator.textContent = "\u2013";

    const endInput = document.createElement("input");
    endInput.type = "time";
    endInput.className = "time-input";
    endInput.value = schedule.endTime;
    endInput.addEventListener("change", () => {
      schedule.endTime = endInput.value;
      saveSchedules();
    });

    timeRow.appendChild(startInput);
    timeRow.appendChild(separator);
    timeRow.appendChild(endInput);

    card.appendChild(header);
    card.appendChild(daysRow);
    card.appendChild(timeRow);
    container.appendChild(card);
  }
}

function addSchedule(): void {
  const newSchedule: Schedule = {
    id: crypto.randomUUID(),
    label: "Schedule " + (schedules.length + 1),
    days: [1, 2, 3, 4, 5], // Weekdays
    startTime: "09:00",
    endTime: "17:00",
    enabled: true,
  };
  schedules.push(newSchedule);
  renderSchedules();
  saveSchedules();
}

function deleteSchedule(id: string): void {
  schedules = schedules.filter((s) => s.id !== id);
  renderSchedules();
  saveSchedules();
}

async function saveSchedules(): Promise<void> {
  try {
    await setStorage({ schedules, scheduleEnabled });
  } catch (error) {
    console.error("Failed to save schedules:", error);
  }
}

async function onMasterToggle(enabled: boolean): Promise<void> {
  scheduleEnabled = enabled;
  const label = document.getElementById("scheduleToggleLabel") as HTMLSpanElement;
  label.textContent = enabled ? "Scheduling: ON" : "Scheduling: OFF";
  label.classList.toggle("active", enabled);
  await saveSchedules();
}

export async function initScheduleTab(): Promise<void> {
  try {
    const data = await getStorage();
    schedules = data.schedules;
    scheduleEnabled = data.scheduleEnabled;
  } catch (error) {
    console.error("Failed to load schedules:", error);
  }

  // Master toggle
  const masterCheckbox = document.getElementById("scheduleEnabled") as HTMLInputElement;
  masterCheckbox.checked = scheduleEnabled;
  const label = document.getElementById("scheduleToggleLabel") as HTMLSpanElement;
  label.textContent = scheduleEnabled ? "Scheduling: ON" : "Scheduling: OFF";
  label.classList.toggle("active", scheduleEnabled);

  masterCheckbox.addEventListener("change", () => {
    onMasterToggle(masterCheckbox.checked);
  });

  document.getElementById("addScheduleBtn")?.addEventListener("click", addSchedule);

  renderSchedules();
}
