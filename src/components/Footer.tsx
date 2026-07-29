import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border px-5 py-10 sm:px-8">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <Logo className="h-3.5 w-20 text-muted-foreground" />
        <p className="label-xs text-muted-foreground">
          © {new Date().getFullYear()} — <span className="text-blue">Studio</span>
        </p>
      </div>
    </footer>
  );
}
