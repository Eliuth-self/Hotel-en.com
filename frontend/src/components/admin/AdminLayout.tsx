import { Building2, DoorOpen, ExternalLink, LayoutDashboard, LogOut, Package, Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import { Brand } from '../Brand';

export type AdminTab = 'dashboard' | 'rooms' | 'operations' | 'settings';

interface AdminLayoutProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  hotelName: string;
  hotelId: string;
  onLogout: () => void;
  userRoles: string[];
  children: ReactNode;
}

const navigation: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Panel general', icon: LayoutDashboard },
  { id: 'rooms', label: 'Habitaciones', icon: DoorOpen },
  { id: 'operations', label: 'Operaciones', icon: Package },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

export function AdminLayout({ activeTab, onTabChange, hotelName, hotelId, onLogout, userRoles, children }: AdminLayoutProps) {
  const initials = hotelName.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toLocaleUpperCase();
  const visibleNavigation = navigation.filter((item) => (
    item.id !== 'operations'
      || userRoles.some((role) => ['administrador', 'recepcionista', 'cajero', 'inventario', 'supervisor'].includes(role))
  ));
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Brand light />
        <p className="sidebar-hotel-name">{hotelName}</p>
        <nav className="admin-nav" aria-label="Administración">
          {visibleNavigation.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`admin-nav-item${activeTab === id ? ' selected' : ''}`} onClick={() => onTabChange(id)}>
              <Icon size={17} aria-hidden="true" /><span>{label}</span>
            </button>
          ))}
        </nav>
        <a className="admin-preview-link" href={`#/hotel/${encodeURIComponent(hotelId)}`}><ExternalLink size={15} /> Ver sitio público</a>
        <div className="sidebar-profile">
          <span className="avatar">{initials || 'H'}</span>
          <span><b>{hotelName}</b><small>Administrador</small></span>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="breadcrumbs">Panel <span>/</span> {navigation.find((item) => item.id === activeTab)?.label}</div>
          <div className="topbar-actions">
            <span className="avatar avatar-small"><Building2 size={13} /></span>
            <button type="button" className="topbar-logout" onClick={onLogout}><LogOut size={14} /><span>Cerrar sesión</span></button>
          </div>
        </header>
        <div className="admin-content">{children}</div>
        <nav className="mobile-admin-nav" aria-label="Administración móvil">
          {visibleNavigation.map(({ id, label, icon: Icon }) => (
            <button key={id} className={activeTab === id ? 'selected' : ''} onClick={() => onTabChange(id)}>
              <Icon size={18} aria-hidden="true" />
              <span>{id === 'dashboard' ? 'Panel' : id === 'settings' ? 'Ajustes' : label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
