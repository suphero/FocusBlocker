import { getStorage, setStorage } from "../storage";
import { hashPassword } from "../crypto-utils";

export const UNLOCK_DURATION = 5 * 60 * 1000; // 5 minutes

export async function requirePassword(): Promise<boolean> {
  const data = await getStorage();
  if (!data.password.isEnabled || !data.password.hash) return true;

  if (
    data.password.lastUnlockedAt &&
    Date.now() - data.password.lastUnlockedAt < UNLOCK_DURATION
  ) {
    return true;
  }

  return showPasswordModal();
}

function showPasswordModal(): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = document.getElementById("passwordModal") as HTMLDivElement;
    const input = document.getElementById("passwordInput") as HTMLInputElement;
    const error = document.getElementById("passwordError") as HTMLDivElement;
    const submit = document.getElementById("passwordSubmit") as HTMLButtonElement;

    modal.classList.remove("hidden");
    input.value = "";
    error.classList.add("hidden");
    input.focus();

    const cleanup = () => {
      modal.classList.add("hidden");
      submit.removeEventListener("click", onSubmit);
      input.removeEventListener("keydown", onKeydown);
    };

    const onSubmit = async () => {
      const password = input.value;
      if (!password) return;

      const data = await getStorage();
      if (!data.password.salt || !data.password.hash) {
        cleanup();
        resolve(true);
        return;
      }

      const hash = await hashPassword(password, data.password.salt);
      if (hash === data.password.hash) {
        await setStorage({
          password: { ...data.password, lastUnlockedAt: Date.now() },
        });
        cleanup();
        resolve(true);
      } else {
        error.classList.remove("hidden");
        input.classList.add("shake");
        setTimeout(() => input.classList.remove("shake"), 300);
        input.value = "";
        input.focus();
      }
    };

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit();
      } else if (e.key === "Escape") {
        cleanup();
        resolve(false);
      }
    };

    submit.addEventListener("click", onSubmit);
    input.addEventListener("keydown", onKeydown);
  });
}
