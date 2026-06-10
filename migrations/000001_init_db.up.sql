CREATE TABLE philosophers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE axes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    low_label TEXT NOT NULL,
    high_label TEXT NOT NULL
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL UNIQUE,
    weight FLOAT NOT NULL,
    axis_id INT NOT NULL,
    FOREIGN KEY (axis_id) REFERENCES axes(id)
);

CREATE TABLE philosopher_scores(
    philosopher_id INT NOT NULL,
    axis_id INT NOT NULL,
    score FLOAT NOT NULL,
    justification TEXT NOT NULL,
    PRIMARY KEY (philosopher_id, axis_id),
    FOREIGN KEY (philosopher_id) REFERENCES philosophers(id),
    FOREIGN KEY (axis_id) REFERENCES axes(id)
);