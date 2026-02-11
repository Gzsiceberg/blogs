CREATE TABLE IF NOT EXISTS blogs (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  author TEXT,
  url TEXT NOT NULL CHECK (char_length(trim(url)) > 0),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  likes INTEGER NOT NULL DEFAULT 0
);

INSERT INTO blogs (author, url, title, likes)
VALUES
  ('Robert C. Martin', 'https://blog.cleancoder.com', 'Clean Code in Practice', 12),
  ('Martin Fowler', 'https://martinfowler.com', 'Refactoring and Design', DEFAULT);
