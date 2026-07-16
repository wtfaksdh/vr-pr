interface PostCardStubProps {
  authorInitial: string;
  authorName: string;
  text: string;
  timeAgo: string;
}

export function PostCardStub({ authorInitial, authorName, text, timeAgo }: PostCardStubProps) {
  return (
    <article className="post-card">
      <div className="post-card__header">
        <div className="avatar avatar--md">{authorInitial}</div>
        <div>
          <div className="post-card__author">{authorName}</div>
          <div className="post-card__time">{timeAgo}</div>
        </div>
      </div>
      <p className="post-card__text">{text}</p>
      <div className="post-card__actions">
        <span className="post-card__action">🤍 Нравится</span>
        <span className="post-card__action">💬 Комментировать</span>
        <span className="post-card__action">↗ Поделиться</span>
      </div>
    </article>
  );
}
