import { academyController } from "./academy.controller";
import { inventoryController } from "./inventory.controller";
import { missionsController } from "./missions.controller";
import { npcController } from "./npc.controller";
import { profileController } from "./profile.controller";

export class ModalsController {
  public readonly menuStatus = document.querySelector<HTMLButtonElement>("#menu-status");
  public readonly menuInventory = document.querySelector<HTMLButtonElement>("#menu-inventory");
  public readonly menuMissions = document.querySelector<HTMLButtonElement>("#menu-missions");
  public readonly menuMap = document.querySelector<HTMLButtonElement>("#menu-map");
  public readonly menuAcademy = document.querySelector<HTMLButtonElement>("#menu-academy");

  constructor() {
    this.bindEvents();
  }

  public setActiveNav(activeBtn: HTMLButtonElement | null) {
    [this.menuStatus, this.menuInventory, this.menuMissions, this.menuMap, this.menuAcademy].forEach((b) =>
      b?.classList.remove("active")
    );
    activeBtn?.classList.add("active");
  }

  public closeAllModals() {
    missionsController.missionsModal?.classList.add("hidden");
    profileController.profileModal?.classList.add("hidden");
    academyController.academyModal?.classList.add("hidden");
    inventoryController.close();
    npcController.close();
    this.setActiveNav(this.menuMap);
  }

  private bindEvents() {
    this.menuStatus?.addEventListener("click", () => {
      const isHidden = profileController.profileModal?.classList.contains("hidden");
      this.closeAllModals();
      if (isHidden) {
        profileController.updateProfileModal();
        profileController.profileModal?.classList.remove("hidden");
        this.setActiveNav(this.menuStatus);
      }
    });

    profileController.btnProfileClose?.addEventListener("click", () => {
      profileController.profileModal?.classList.add("hidden");
      this.setActiveNav(this.menuMap);
    });

    this.menuInventory?.addEventListener("click", () => {
      const isOpen = inventoryController.isOpen();
      this.closeAllModals();
      if (!isOpen) {
        inventoryController.open();
        this.setActiveNav(this.menuInventory);
      }
    });

    inventoryController.btnInventoryClose?.addEventListener("click", () => {
      inventoryController.close();
      this.setActiveNav(this.menuMap);
    });

    this.menuMissions?.addEventListener("click", () => {
      const isHidden = missionsController.missionsModal?.classList.contains("hidden");
      this.closeAllModals();
      if (isHidden) {
        missionsController.missionsModal?.classList.remove("hidden");
        this.setActiveNav(this.menuMissions);
      }
    });

    missionsController.btnMissionsClose?.addEventListener("click", () => {
      missionsController.missionsModal?.classList.add("hidden");
      this.setActiveNav(this.menuMap);
    });

    missionsController.btnMissionsToggle?.addEventListener("click", () => {
      const isHidden = missionsController.missionsModal?.classList.contains("hidden");
      this.closeAllModals();
      if (isHidden) {
        missionsController.missionsModal?.classList.remove("hidden");
        this.setActiveNav(this.menuMissions);
      }
    });

    this.menuMap?.addEventListener("click", () => {
      this.closeAllModals();
    });

    this.menuAcademy?.addEventListener("click", () => {
      const isHidden = academyController.academyModal?.classList.contains("hidden");
      this.closeAllModals();
      if (isHidden) {
        academyController.open();
        this.setActiveNav(this.menuAcademy);
      }
    });

    academyController.btnAcademyClose?.addEventListener("click", () => {
      academyController.close();
      this.setActiveNav(this.menuMap);
    });

    academyController.btnCalcToggle?.addEventListener("click", () => {
      this.closeAllModals();
      academyController.open();
      this.setActiveNav(this.menuAcademy);
    });
  }
}

export const modalsController = new ModalsController();
