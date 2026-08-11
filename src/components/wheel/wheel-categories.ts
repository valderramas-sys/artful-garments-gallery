import type { ComponentType, SVGProps } from "react";
import { HomeIcon, BagIcon, InfoIcon, InstagramIcon, PinterestIcon } from "./WheelIcons";

export type WheelCategory = {
  id: string;
  label: string;
  /** Internal TanStack route path, when the target lives inside the site. */
  to?: string;
  /** External destination already linked from the site footer. */
  href?: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/**
 * Only destinations that already exist on the site.
 * Nothing new is invented here.
 */
export const WHEEL_CATEGORIES: WheelCategory[] = [
  { id: "home", label: "Home", to: "/", Icon: HomeIcon },
  { id: "shop", label: "Shop", to: "/shop", Icon: BagIcon },
  { id: "info", label: "Info", to: "/info", Icon: InfoIcon },
  
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/rhytmo__/",
    Icon: InstagramIcon,
  },
  {
    id: "pinterest",
    label: "Pinterest",
    href: "https://br.pinterest.com/rhytmob/_profile/",
    Icon: PinterestIcon,
  },
];
