import { NavLink } from "react-router-dom";
import { useToast } from "../../context/ToastContext";

interface NavItemProps {
  icon: string;
  label: string;
  to?: string;
  badge?: string;
}

function NavItem({ icon, label, to, badge }: NavItemProps) {
  const { showToast } = useToast();

  const content = (
    <>
      <span className="nav-item__icon">{icon}</span>
      <span className="nav-item__label">{label}</span>
      {badge && <span className="nav-item__badge">{badge}</span>}
    </>
  );

  if (to) {
    return (
      <NavLink to={to} className={({ isActive }) => `nav-item${isActive ? " nav-item--active" : ""}`}>
        {content}
      </NavLink>
    );
  }

  return (
    <button
      className="nav-item nav-item--disabled"
      onClick={() => showToast("В этом демо доступны только «Лента» и «Канбан»")}
    >
      {content}
    </button>
  );
}

export function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        <NavItem icon="👤" label="Профиль" />
        <NavItem icon="📰" label="Лента" to="/" />
        <NavItem icon="📋" label="Канбан" to="/boards" badge="практика" />
        <NavItem icon="💬" label="Мессенджер" />
        <NavItem icon="📞" label="Звонки" />
        <NavItem icon="🧑‍🤝‍🧑" label="Друзья" />
        <NavItem icon="🏘️" label="Сообщества" />
        <NavItem icon="🖼️" label="Фото" />
        <NavItem icon="🎵" label="Музыка" />
        <NavItem icon="🎬" label="Видео" />
        <NavItem icon="🎞️" label="Клипы" />
        <NavItem icon="🎮" label="Игры" />
        <NavItem icon="🙂" label="Стикеры" />
        <NavItem icon="🛍️" label="Маркет" />
      </nav>

      <div className="sidebar__divider" />

      <nav className="sidebar__nav">
        <NavItem icon="🧩" label="Сервисы" />
        <NavItem icon="🎙️" label="Голоса" />
      </nav>

      <div className="sidebar__divider" />

      <nav className="sidebar__nav">
        <NavItem icon="🔖" label="Закладки" />
        <NavItem icon="📁" label="Файлы" />
        <NavItem icon="📣" label="Реклама" />
        <NavItem icon="❓" label="Помощь" />
      </nav>
    </aside>
  );
}
