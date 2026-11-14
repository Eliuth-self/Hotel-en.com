interface BrandProps {
  light?: boolean;
}

export function Brand({ light = false }: BrandProps) {
  return (
    <a className={`brand${light ? ' brand-light' : ''}`} href="#/" aria-label="Hotel En.com, inicio">
      <span className="brand-mark">H</span>
      <span>HOTEL EN.COM</span>
    </a>
  );
}
