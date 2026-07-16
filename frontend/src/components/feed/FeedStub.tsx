import { useToast } from "../../context/ToastContext";
import { PostCardStub } from "./PostCardStub";

const STORIES = ["Иван", "Мария", "Кирилл", "Алина", "Тимур"];

const POSTS = [
  {
    authorInitial: "А",
    authorName: "Алгоритмы и Структуры Данных",
    text: "Сегодня разбираем оптимистичные блокировки в реляционных БД: почему они дешевле, чем SELECT ... FOR UPDATE, и когда от них лучше отказаться.",
    timeAgo: "2 ч назад",
  },
  {
    authorInitial: "Р",
    authorName: "Разработка на практике",
    text: "Небольшой чек-лист перед код-ревью: убедитесь, что миграции применяются идемпотентно, а API не даёт лишних прав пользователю без роли.",
    timeAgo: "5 ч назад",
  },
  {
    authorInitial: "К",
    authorName: "Kanban Клуб",
    text: "Это демо-лента — здесь ничего не публикуется по-настоящему. Загляните в «Канбан» слева, там всё по-честному работает.",
    timeAgo: "вчера",
  },
];

export function FeedStub() {
  const { showToast } = useToast();

  return (
    <div className="feed">
      <div className="feed__stories">
        <div className="story story--add" onClick={() => showToast("Загрузка историй недоступна в демо")}>
          <div className="story__plus">+</div>
          <span>История</span>
        </div>
        {STORIES.map((name) => (
          <div
            key={name}
            className="story"
            onClick={() => showToast("Просмотр историй недоступен в демо")}
          >
            <div className="story__circle">{name[0]}</div>
            <span>{name}</span>
          </div>
        ))}
      </div>

      <div
        className="feed__composer"
        onClick={() => showToast("Публикация постов недоступна в демо")}
      >
        <div className="avatar avatar--sm">?</div>
        <div className="feed__composer-input">Что у вас нового?</div>
      </div>

      <div className="feed__posts">
        {POSTS.map((post) => (
          <PostCardStub key={post.authorName} {...post} />
        ))}
      </div>
    </div>
  );
}
