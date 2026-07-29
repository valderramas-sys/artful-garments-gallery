import hoodie from "@/assets/product-hoodie.jpg";
import tee from "@/assets/product-tee.jpg";
import cargo from "@/assets/product-cargo.jpg";
import shell from "@/assets/product-shell.jpg";

export type Product = {
  id: string;
  name: string;
  index: string;
  material: string;
  /** Base price in BRL — all other currencies are converted from this value. */
  price: number;
  image: string;
  description: string;
  sizes: string[];
  specs: { label: string; value: string }[];
  composition: string;
  care: string[];
  shipping: string;
  stock: number;
};

export const products: Product[] = [
  {
    id: "hd-01",
    name: "Atmosphere Hoodie",
    index: "001",
    material: "600gsm loopback cotton",
    price: 2190,
    image: hoodie,
    description:
      "An oversized hoodie cut from dense loopback cotton, garment-washed for a soft, lived-in hand. Dropped shoulders and a boxy body hold their shape wear after wear.",
    sizes: ["XS", "S", "M", "L", "XL"],
    specs: [
      { label: "Fit", value: "Oversized, dropped shoulder" },
      { label: "Weight", value: "600 gsm" },
      { label: "Origin", value: "Made in Portugal" },
    ],
    composition: "100% organic cotton",
    care: ["Machine wash cold", "Do not tumble dry", "Iron inside out"],
    shipping: "Ships in 1–2 business days · Delivery 3–7 business days",
    stock: 12,
  },
  {
    id: "ts-02",
    name: "Vapour Tee",
    index: "002",
    material: "Boxy heavyweight jersey",
    price: 890,
    image: tee,
    description:
      "A heavyweight jersey tee with a squared silhouette and ribbed collar, finished with a tonal studio mark at the back neck.",
    sizes: ["XS", "S", "M", "L", "XL"],
    specs: [
      { label: "Fit", value: "Boxy, true to size" },
      { label: "Weight", value: "280 gsm" },
      { label: "Origin", value: "Made in Portugal" },
    ],
    composition: "95% cotton, 5% elastane",
    care: ["Machine wash cold", "Hang dry", "Do not bleach"],
    shipping: "Ships in 1–2 business days · Delivery 3–7 business days",
    stock: 24,
  },
  {
    id: "pt-03",
    name: "Drift Cargo",
    index: "003",
    material: "Crinkle technical nylon",
    price: 1740,
    image: cargo,
    description:
      "Relaxed cargo trousers in crinkled technical nylon with bonded seams, articulated knees and adjustable hems.",
    sizes: ["28", "30", "32", "34", "36"],
    specs: [
      { label: "Fit", value: "Relaxed, tapered hem" },
      { label: "Details", value: "Bonded seams, 6 pockets" },
      { label: "Origin", value: "Made in Italy" },
    ],
    composition: "100% recycled nylon",
    care: ["Machine wash cold", "Do not tumble dry", "Do not iron coating"],
    shipping: "Ships in 1–2 business days · Delivery 3–7 business days",
    stock: 7,
  },
  {
    id: "jk-04",
    name: "Prism Shell",
    index: "004",
    material: "Iridescent coated film",
    price: 2680,
    image: shell,
    description:
      "A weather-ready shell in iridescent coated film. Fully taped seams, storm placket and a packable body that folds into its own pocket.",
    sizes: ["S", "M", "L", "XL"],
    specs: [
      { label: "Fit", value: "Oversized, packable" },
      { label: "Waterproof", value: "10.000 mm" },
      { label: "Origin", value: "Made in Italy" },
    ],
    composition: "70% polyester, 30% polyurethane",
    care: ["Wipe clean with damp cloth", "Do not dry clean", "Store unfolded"],
    shipping: "Ships in 2–3 business days · Delivery 4–8 business days",
    stock: 4,
  },
];
