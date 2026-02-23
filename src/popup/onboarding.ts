import { getStorage, setStorage } from "../storage";
import { t } from "../i18n-utils";

interface OnboardingStep {
  titleKey: string;
  descKey: string;
  icon: string;
}

const STEPS: OnboardingStep[] = [
  { titleKey: "onboardingWelcomeTitle", descKey: "onboardingWelcomeDesc", icon: "\uD83D\uDC4B" },
  { titleKey: "onboardingBlockTitle", descKey: "onboardingBlockDesc", icon: "\uD83D\uDEE1\uFE0F" },
  { titleKey: "onboardingToggleTitle", descKey: "onboardingToggleDesc", icon: "\uD83D\uDD04" },
  { titleKey: "onboardingMoreTitle", descKey: "onboardingMoreDesc", icon: "\u2728" },
];

let currentStep = 0;

function renderStep(): void {
  const step = STEPS[currentStep];

  const stepIcon = document.getElementById("onboardingIcon") as HTMLDivElement;
  const stepTitle = document.getElementById("onboardingTitle") as HTMLHeadingElement;
  const stepDesc = document.getElementById("onboardingDesc") as HTMLParagraphElement;
  const stepIndicator = document.getElementById("onboardingIndicator") as HTMLDivElement;
  const prevBtn = document.getElementById("onboardingPrev") as HTMLButtonElement;
  const nextBtn = document.getElementById("onboardingNext") as HTMLButtonElement;

  stepIcon.textContent = step.icon;
  stepTitle.textContent = t(step.titleKey);
  stepDesc.textContent = t(step.descKey);

  // Step dots
  stepIndicator.innerHTML = "";
  for (let i = 0; i < STEPS.length; i++) {
    const dot = document.createElement("span");
    dot.className = "onboarding-dot" + (i === currentStep ? " active" : "");
    stepIndicator.appendChild(dot);
  }

  prevBtn.classList.toggle("hidden", currentStep === 0);
  nextBtn.textContent = currentStep === STEPS.length - 1 ? t("onboardingGetStarted") : t("onboardingNext");
}

function nextStep(): void {
  if (currentStep < STEPS.length - 1) {
    currentStep++;
    renderStep();
  } else {
    completeOnboarding();
  }
}

function prevStep(): void {
  if (currentStep > 0) {
    currentStep--;
    renderStep();
  }
}

async function completeOnboarding(): Promise<void> {
  await setStorage({ onboardingCompleted: true });
  const overlay = document.getElementById("onboardingOverlay") as HTMLDivElement;
  overlay.classList.add("hidden");
}

export async function checkOnboarding(): Promise<void> {
  const data = await getStorage();

  document.getElementById("onboardingNext")!.addEventListener("click", nextStep);
  document.getElementById("onboardingPrev")!.addEventListener("click", prevStep);
  document.getElementById("onboardingSkip")!.addEventListener("click", completeOnboarding);

  if (data.onboardingCompleted) return;

  currentStep = 0;
  const overlay = document.getElementById("onboardingOverlay") as HTMLDivElement;
  overlay.classList.remove("hidden");
  renderStep();
}

export function showOnboarding(): void {
  currentStep = 0;
  const overlay = document.getElementById("onboardingOverlay") as HTMLDivElement;
  overlay.classList.remove("hidden");
  renderStep();
}
