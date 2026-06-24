export interface Question {
  id: number;
  original: string;
  options: string[];
  correct: string;
  correctIndex: number;
  category: string;
  explanation: string;
}

export const CATEGORIES = [
  "Tú Afirmativo (Irregulares)",
  "Tú Negativo",
  "Usted (Afirm./Neg.)",
  "Vosotros (Afirm./Neg.)",
  "Ustedes (Afirm./Neg.)",
  "Verbos Reflexivos"
];

// Map categories to modern hex colors for the wheel segments (Vibrant Palette)
export const CATEGORY_COLORS: Record<string, string> = {
  "Tú Afirmativo (Irregulares)": "#f43f5e", // Rose
  "Tú Negativo": "#ec4899",                 // Pink
  "Usted (Afirm./Neg.)": "#8b5cf6",         // Violet
  "Vosotros (Afirm./Neg.)": "#3b82f6",      // Blue
  "Ustedes (Afirm./Neg.)": "#10b981",       // Emerald
  "Verbos Reflexivos": "#f59e0b"            // Amber
};

export const QUESTIONS: Question[] = [
  {
    id: 1,
    original: "Tú haces los deberes.",
    options: ["Hace los deberes.", "Haz los deberes.", "Haces los deberes.", "Haga los deberes."],
    correct: "Haz los deberes.",
    correctIndex: 1,
    category: "Tú Afirmativo (Irregulares)",
    explanation: "El imperativo afirmativo de 'tú' para el verbo 'hacer' es irregular: 'haz'."
  },
  {
    id: 2,
    original: "Tú dices la verdad.",
    options: ["Dice la verdad.", "Dices la verdad.", "Di la verdad.", "Diga la verdad."],
    correct: "Di la verdad.",
    correctIndex: 2,
    category: "Tú Afirmativo (Irregulares)",
    explanation: "El imperativo afirmativo de 'tú' para el verbo 'decir' es irregular: 'di'."
  },
  {
    id: 3,
    original: "Tú vas a clase.",
    options: ["Vas a clase.", "Va a clase.", "Vaya a clase.", "Ve a clase."],
    correct: "Ve a clase.",
    correctIndex: 3,
    category: "Tú Afirmativo (Irregulares)",
    explanation: "El imperativo afirmativo de 'tú' para el verbo 'ir' es irregular: 've'."
  },
  {
    id: 4,
    original: "Tú pones el libro en la mesa.",
    options: ["Pon el libro en la mesa.", "Pone el libro en la mesa.", "Pones el libro en la mesa.", "Ponga el libro en la mesa."],
    correct: "Pon el libro en la mesa.",
    correctIndex: 0,
    category: "Tú Afirmativo (Irregulares)",
    explanation: "El imperativo afirmativo de 'tú' para el verbo 'poner' es irregular: 'pon'."
  },
  {
    id: 5,
    original: "Tú sales de casa.",
    options: ["Sales de casa.", "Sal de casa.", "Sale de casa.", "Salga de casa."],
    correct: "Sal de casa.",
    correctIndex: 1,
    category: "Tú Afirmativo (Irregulares)",
    explanation: "El imperativo afirmativo de 'tú' para el verbo 'salir' es irregular: 'sal'."
  },
  {
    id: 6,
    original: "Tú tienes cuidado.",
    options: ["Tienes cuidado.", "Tenga cuidado.", "Ten cuidado.", "Tiene cuidado."],
    correct: "Ten cuidado.",
    correctIndex: 2,
    category: "Tú Afirmativo (Irregulares)",
    explanation: "El imperativo afirmativo de 'tú' para el verbo 'tener' es irregular: 'ten'."
  },
  {
    id: 7,
    original: "Tú vienes aquí.",
    options: ["Ven aquí.", "Viene aquí.", "Vienes aquí.", "Venga aquí."],
    correct: "Ven aquí.",
    correctIndex: 0,
    category: "Tú Afirmativo (Irregulares)",
    explanation: "El imperativo afirmativo de 'tú' para el verbo 'venir' es irregular: 'ven'."
  },
  {
    id: 8,
    original: "Tú eres amable.",
    options: ["Eres amable.", "Sé amable.", "Sea amable.", "Ser amable."],
    correct: "Sé amable.",
    correctIndex: 1,
    category: "Tú Afirmativo (Irregulares)",
    explanation: "El imperativo afirmativo de 'tú' para el verbo 'ser' es irregular: 'sé'."
  },
  {
    id: 9,
    original: "Tú no hablas en clase.",
    options: ["No habla en clase.", "No hables en clase.", "No hablar en clase.", "No hable en clase."],
    correct: "No hables en clase.",
    correctIndex: 1,
    category: "Tú Negativo",
    explanation: "El imperativo negativo de 'tú' se forma con el presente de subjuntivo: 'no hables'."
  },
  {
    id: 10,
    original: "Tú no comes mucho azúcar.",
    options: ["No come mucho azúcar.", "No comer mucho azúcar.", "No comas mucho azúcar.", "No coma mucho azúcar."],
    correct: "No comas mucho azúcar.",
    correctIndex: 2,
    category: "Tú Negativo",
    explanation: "El imperativo negativo de 'tú' se forma con el presente de subjuntivo: 'no comas'."
  },
  {
    id: 11,
    original: "Usted abre la ventana.",
    options: ["Abre la ventana.", "Abra la ventana.", "Abrid la ventana.", "Abren la ventana."],
    correct: "Abra la ventana.",
    correctIndex: 1,
    category: "Usted (Afirm./Neg.)",
    explanation: "Para la cortesía 'usted', el imperativo de verbos en -ir termina en -a: 'abra'."
  },
  {
    id: 12,
    original: "Usted escucha al profesor.",
    options: ["Escucha al profesor.", "Escuche al profesor.", "Escuchad al profesor.", "Escuchan al profesor."],
    correct: "Escuche al profesor.",
    correctIndex: 1,
    category: "Usted (Afirm./Neg.)",
    explanation: "Para la cortesía 'usted', el imperativo de verbos en -ar termina en -e: 'escuche'."
  },
  {
    id: 13,
    original: "Usted no hace ruido.",
    options: ["No haces ruido.", "No haga ruido.", "No hace ruido.", "No hagas ruido."],
    correct: "No haga ruido.",
    correctIndex: 1,
    category: "Usted (Afirm./Neg.)",
    explanation: "El imperativo de 'usted' (afirmativo y negativo) usa la tercera persona singular del subjuntivo: 'no haga'."
  },
  {
    id: 14,
    original: "Vosotros coméis fruta.",
    options: ["Come fruta.", "Coma fruta.", "Comed fruta.", "Comen fruta."],
    correct: "Comed fruta.",
    correctIndex: 2,
    category: "Vosotros (Afirm./Neg.)",
    explanation: "El imperativo afirmativo de 'vosotros' se forma quitando la -r del infinitivo y poniendo una -d: 'comer' -> 'comed'."
  },
  {
    id: 15,
    original: "Vosotros habláis más despacio.",
    options: ["Hablad más despacio.", "Habla más despacio.", "Hable más despacio.", "Hablan más despacio."],
    correct: "Hablad más despacio.",
    correctIndex: 0,
    category: "Vosotros (Afirm./Neg.)",
    explanation: "Cambiamos la -r final de 'hablar' por una -d: 'hablad'."
  },
  {
    id: 16,
    original: "Vosotros no llegáis tarde.",
    options: ["No llega tarde.", "No llegad tarde.", "No llegáis tarde.", "No lleguéis tarde."],
    correct: "No lleguéis tarde.",
    correctIndex: 3,
    category: "Vosotros (Afirm./Neg.)",
    explanation: "El imperativo negativo de 'vosotros' se forma con la segunda persona plural del subjuntivo: 'no lleguéis'."
  },
  {
    id: 17,
    original: "Ustedes leen el texto.",
    options: ["Lee el texto.", "Leed el texto.", "Lean el texto.", "Leen el texto."],
    correct: "Lean el texto.",
    correctIndex: 2,
    category: "Ustedes (Afirm./Neg.)",
    explanation: "El imperativo para 'ustedes' de verbos en -er termina en -an (presente de subjuntivo): 'lean'."
  },
  {
    id: 18,
    original: "Ustedes no miran el móvil.",
    options: ["No miran el móvil.", "No miren el móvil.", "No mirad el móvil.", "No mira el móvil."],
    correct: "No miren el móvil.",
    correctIndex: 1,
    category: "Ustedes (Afirm./Neg.)",
    explanation: "El imperativo negativo de 'ustedes' para verbos en -ar termina en -en: 'no miren'."
  },
  {
    id: 19,
    original: "Tú te levantas temprano.",
    options: ["Levanta temprano.", "Levántate temprano.", "Te levanta temprano.", "Levántese temprano."],
    correct: "Levántate temprano.",
    correctIndex: 1,
    category: "Verbos Reflexivos",
    explanation: "En el imperativo afirmativo de 'tú', los pronombres reflexivos se unen al final del verbo formando una sola palabra con tilde: 'levanta' + 'te' = 'levántate'."
  },
  {
    id: 20,
    original: "Ustedes se sientan aquí.",
    options: ["Siéntate aquí.", "Siéntense aquí.", "Sentaos aquí.", "Se sientan aquí."],
    correct: "Siéntense aquí.",
    correctIndex: 1,
    category: "Verbos Reflexivos",
    explanation: "En el imperativo afirmativo de 'ustedes', el pronombre reflexivo 'se' se añade al final del verbo: 'sienten' + 'se' = 'siéntense'."
  }
];
