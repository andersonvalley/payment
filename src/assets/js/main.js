import { lazyLoadInstance } from "./modules/lazy";
import { isWebp } from "./modules/webp";
import changeCardBG from "./modules/changeCardBG";

isWebp();
document.addEventListener("DOMContentLoaded", () => {
  lazyLoadInstance.update();
  changeCardBG();
});
