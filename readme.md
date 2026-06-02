
main resource:
GET /assess
return a JSON object of the philosopher closest to you. example:

    "name": "Plato",
    "scores": {
      "epistemology": 0.15,
      "metaphysics": 0.08,
      "ethics": 0.12,
      "free_will": 0.5,
      "politics": 0.18,
      "theology": 0.22
    },
    "justifications": {
      "epistemology": "In the Meno and Phaedo, Plato argues knowledge is recovered by reason through recollection of the Forms, independent of sensory experience.",
      "metaphysics": "The Theory of Forms in the Republic posits that true reality consists of immaterial, intelligible Forms of which the physical world is merely a shadow.",
      "ethics": "In the Republic, the Form of the Good is an objective, eternal moral order discoverable by philosophical reason, independent of human opinion.",
      "free_will": "Plato does not systematically address free will versus determinism; his focus on the rational soul's choice suggests agency, but the issue is genuinely ambiguous across the dialogues.",
      "politics": "The Republic advocates rule by philosopher-kings with a rigid hierarchical class structure, centralized control of education, property, and reproduction.",
      "theology": "In the Timaeus, the cosmos is ordered by a divine Demiurge who fashions the world according to eternal paradigms, placing divinity at the center of cosmology."
    }

