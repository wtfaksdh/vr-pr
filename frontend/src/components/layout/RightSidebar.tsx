export function RightSidebar() {
  return (
    <aside className="right-sidebar">
      <div className="widget">
        <div className="widget__title">Лента</div>
        <div className="widget__link">Фотографии</div>
        <div className="widget__link">Друзья</div>
        <div className="widget__divider" />
        <div className="widget__link">Поиск</div>
        <div className="widget__link">Реакции</div>
      </div>

      <div className="widget widget--promo">
        <div className="widget__promo-icon">🧊</div>
        <div className="widget__title">Демо-практика</div>
        <div className="widget__text">
          Это учебный проект: интерфейс стилизован под VK, но большая часть кнопок здесь —
          декоративные заглушки. Рабочая часть — «Лента» и «Канбан» в меню слева.
        </div>
      </div>
    </aside>
  );
}
