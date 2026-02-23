import { getStorage, setStorage } from "../storage";
import { extractDomain } from "../url-utils";
import { DEFAULT_CATEGORIES } from "../category-defaults";
import type { Category } from "../types";

let categories: Category[] = [];

function renderCategories(): void {
  const container = document.getElementById("categoriesContent") as HTMLDivElement;
  container.innerHTML = "";

  if (categories.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No categories yet.";
    container.appendChild(empty);
    return;
  }

  for (const cat of categories) {
    const card = document.createElement("div");
    card.className = "category-card";

    // Header
    const header = document.createElement("div");
    header.className = "category-header";

    const left = document.createElement("div");
    left.className = "category-left";

    const icon = document.createElement("span");
    icon.className = "category-icon";
    icon.textContent = cat.icon;

    const name = document.createElement("span");
    name.className = "category-name";
    name.textContent = cat.name;

    const count = document.createElement("span");
    count.className = "category-count";
    count.textContent = `(${cat.websites.length})`;

    left.appendChild(icon);
    left.appendChild(name);
    left.appendChild(count);

    const right = document.createElement("div");
    right.className = "category-right";

    // Toggle
    const toggle = document.createElement("label");
    toggle.className = "switch switch-sm";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = cat.enabled;
    checkbox.addEventListener("change", () => toggleCategory(cat.id, checkbox.checked));
    const slider = document.createElement("span");
    slider.className = "slider";
    toggle.appendChild(checkbox);
    toggle.appendChild(slider);

    // Expand chevron
    const chevron = document.createElement("button");
    chevron.className = "category-chevron";
    chevron.textContent = "\u25B6";
    chevron.title = "Expand";
    chevron.addEventListener("click", () => {
      const body = card.querySelector(".category-body") as HTMLDivElement;
      const isOpen = body.classList.toggle("open");
      chevron.textContent = isOpen ? "\u25BC" : "\u25B6";
    });

    // Delete (custom only)
    if (!cat.isBuiltIn) {
      const deleteBtn = document.createElement("button");
      deleteBtn.className = "category-delete";
      deleteBtn.textContent = "\u00d7";
      deleteBtn.title = "Delete category";
      deleteBtn.addEventListener("click", () => deleteCategory(cat.id));
      right.appendChild(deleteBtn);
    }

    right.appendChild(toggle);
    right.appendChild(chevron);

    header.appendChild(left);
    header.appendChild(right);

    // Body (collapsed by default)
    const body = document.createElement("div");
    body.className = "category-body";

    const chipList = document.createElement("div");
    chipList.className = "chip-list";
    for (const site of cat.websites) {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.appendChild(document.createTextNode(site));

      const removeBtn = document.createElement("button");
      removeBtn.className = "chip-remove";
      removeBtn.textContent = "\u00d7";
      removeBtn.addEventListener("click", () => removeSiteFromCategory(cat.id, site));
      chip.appendChild(removeBtn);

      chipList.appendChild(chip);
    }
    body.appendChild(chipList);

    // Add site to category
    const addRow = document.createElement("div");
    addRow.className = "add-site add-site-sm";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Add site...";
    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.addEventListener("click", () => {
      addSiteToCategory(cat.id, input.value);
      input.value = "";
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addSiteToCategory(cat.id, input.value);
        input.value = "";
      }
    });
    addRow.appendChild(input);
    addRow.appendChild(addBtn);
    body.appendChild(addRow);

    card.appendChild(header);
    card.appendChild(body);
    container.appendChild(card);
  }
}

async function toggleCategory(id: string, enabled: boolean): Promise<void> {
  const cat = categories.find((c) => c.id === id);
  if (cat) {
    cat.enabled = enabled;
    await saveCategories();
  }
}

async function deleteCategory(id: string): Promise<void> {
  categories = categories.filter((c) => c.id !== id);
  renderCategories();
  await saveCategories();
}

async function addSiteToCategory(categoryId: string, input: string): Promise<void> {
  const domain = extractDomain(input);
  if (!domain) return;
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat || cat.websites.includes(domain)) return;

  cat.websites.push(domain);
  renderCategories();
  await saveCategories();
}

async function removeSiteFromCategory(categoryId: string, domain: string): Promise<void> {
  const cat = categories.find((c) => c.id === categoryId);
  if (!cat) return;

  cat.websites = cat.websites.filter((w) => w !== domain);
  renderCategories();
  await saveCategories();
}

async function saveCategories(): Promise<void> {
  try {
    await setStorage({ categories });
  } catch (error) {
    console.error("Failed to save categories:", error);
  }
}

function showAddCategoryForm(): void {
  const container = document.getElementById("addCategoryForm") as HTMLDivElement;
  container.classList.toggle("open");
}

async function addCustomCategory(): Promise<void> {
  const nameInput = document.getElementById("newCatName") as HTMLInputElement;
  const iconInput = document.getElementById("newCatIcon") as HTMLInputElement;
  const name = nameInput.value.trim();
  const icon = iconInput.value.trim() || "\uD83D\uDCC1";

  if (!name) return;

  const newCat: Category = {
    id: crypto.randomUUID(),
    name,
    icon,
    websites: [],
    enabled: false,
    isBuiltIn: false,
  };

  categories.push(newCat);
  renderCategories();
  await saveCategories();

  nameInput.value = "";
  iconInput.value = "";
  showAddCategoryForm();
}

export async function initCategoriesTab(): Promise<void> {
  try {
    const data = await getStorage();
    categories = data.categories;

    // Populate default categories on first use
    if (categories.length === 0) {
      categories = DEFAULT_CATEGORIES.map((c) => ({ ...c }));
      await saveCategories();
    }
  } catch (error) {
    console.error("Failed to load categories:", error);
  }

  renderCategories();

  document.getElementById("addCategoryBtn")?.addEventListener("click", showAddCategoryForm);
  document.getElementById("saveCategoryBtn")?.addEventListener("click", addCustomCategory);
}
