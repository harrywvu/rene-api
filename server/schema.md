| id | name      |
| -- | --------- |
| 1  | Plato     |
| 2  | Aristotle |
| 3  | Kant      |

| id | name         | low_label   | high_label  |
| -- | ------------ | ----------- | ----------- |
| 1  | epistemology | Rationalism | Empiricism  |
| 2  | metaphysics  | Idealism    | Materialism |
| 3  | ethics       | Realism     | Relativism  |


| philosopher_id | axis_id | score | justification               |
| -------------- | ------- | ----- | --------------------------- |
| 1              | 1       | 0.15  | Plato epistemology text     |
| 1              | 2       | 0.08  | Plato metaphysics text      |
| 1              | 3       | 0.12  | Plato ethics text           |
| 2              | 1       | 0.42  | Aristotle epistemology text |
| 2              | 2       | 0.58  | Aristotle metaphysics text  |