import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Brand } from './Brand';

interface SiteHeaderProps {
  admin?: boolean;
}

export function SiteHeader({ admin = false }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={`site-header${admin ? ' admin-header' : ''}`}>
      <Brand light={admin} />
      <nav className={`desktop-nav${menuOpen ? ' mobile-nav-open' : ''}`} aria-label="Navegación principal">
        <a href="#/">Explorar hoteles</a>
        <a href="#/search">Destinos</a>
        <a href="#/register">Registra tu hotel</a>
        <a href="#/login" className={`nav-admin${admin ? ' nav-current' : ''}`}>Panel del hotel</a>
      </nav>
      <button
        className="icon-button mobile-menu"
        type="button"
        aria-label={menuOpen ? 'Cerrar navegación' : 'Abrir navegación'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X size={19} /> : <Menu size={19} />}
      </button>
    </header>
  );
}
