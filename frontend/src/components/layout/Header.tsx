import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export function Header() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);

  function disabled() {
    showToast("В этом демо доступны только «Лента» и «Канбан»");
  }

  return (
    <header className="header">
      <div className="header__logo">
        <span className="logo-badge">VK</span>
        <span className="header__wordmark">education</span>
      </div>

      <div className="header__search">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M11.5 11.5L15 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input placeholder="Поиск" onFocus={disabled} readOnly />
      </div>

      <div className="header__icons">
        <button className="icon-btn" onClick={disabled} aria-label="Уведомления">
          🔔
        </button>
        <button className="icon-btn" onClick={disabled} aria-label="Музыка">
          🎵
        </button>

        <div className="header__user" onClick={() => setMenuOpen((v) => !v)}>
          <div className="avatar avatar--sm">{user?.display_name?.[0]?.toUpperCase() ?? "?"}</div>
          <span className="header__username">{user?.display_name}</span>
          <span className="header__chevron">▾</span>

          {menuOpen && (
            <div className="dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="dropdown__item dropdown__item--muted">@{user?.username}</div>
              <button className="dropdown__item" onClick={logout}>
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
