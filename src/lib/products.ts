import hoodie from "@/assets/product-hoodie.jpg";
import tee from "@/assets/product-tee.jpg";
import cargo from "@/assets/product-cargo.jpg";
import shell from "@/assets/product-shell.jpg";

export type Product = {
  id: string;
  name: string;
  index: string;
  material: string;
  price: number;
  image: string;
};

export const products: Product[] = [
  {
    id: "hd-01",
    name: "Atmosphere Hoodie",
    index: "001",
    material: "600gsm loopback cotton",
    price: 420,
    image: hoodie,
  },
  {
    id: "ts-02",
    name: "Vapour Tee",
    index: "002",
    material: "Boxy heavyweight jersey",
    price: 180,
    image: tee,
  },
  {
    id: "pt-03",
    name: "Drift Cargo",
    index: "003",
    material: "Crinkle technical nylon",
    price: 340,
    image: cargo,
  },
  {
    id: "jk-04",
    name: "Prism Shell",
    index: "004",
    material: "Iridescent coated film",
    price: 520,
    image: shell,
  },
];

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(value);
