INSERT INTO users (username, email)
VALUES
    ('admin', 'admin@example.com'),
    ('guest', 'guest@example.com');

INSERT INTO posts (user_id, title, body)
VALUES
    (1, 'Hello World', 'First post content');

DELETE FROM posts WHERE user_id IN (1);
DELETE FROM users WHERE username IN ('admin', 'guest');