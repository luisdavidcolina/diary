// Temario real derivado de docs/PLAN_ESTUDIO.md.
// Cada item es una unidad de trabajo que entra en la planificación diaria.
// id estable = usado como clave de progreso (no cambiar a la ligera).

export const SUBJECTS = {
  english: {
    id: 'english',
    title: 'Inglés (Suficiencia)',
    icon: '🇬🇧',
    color: 'var(--color-english)',
    goal: 'Dominar el modelo de examen y resolver variantes (nivel A2 → eximir)',
    material: 'docs/ingles/ — examen resuelto + guía estratégica'
  },
  calculus: {
    id: 'calculus',
    title: 'Cálculo Científico',
    icon: '🧮',
    color: 'var(--color-calculus)',
    goal: 'Temas 3–7 (Parciales 2 y 3): factorizaciones, iterativos, interpolación, ceros',
    material: 'docs/calculo/ — resúmenes, modelos y prácticas'
  },
  security: {
    id: 'security',
    title: 'Seguridad en Redes',
    icon: '🛡️',
    color: 'var(--color-security)',
    goal: 'Las 6 unidades en orden (1 → 6)',
    material: 'docs/seguridad/ — programa + tareas 1–7'
  },
  cloud: {
    id: 'cloud',
    title: 'Computación en la Nube',
    icon: '☁️',
    color: 'var(--color-cloud)',
    goal: 'AWS SAA-C03 hasta antes de bases de datos (incluye S3 y EFS)',
    material: 'docs/nube/ — guía SAA + slides oficiales'
  }
};

// Orden en que se intercalan las materias al repartir el plan diario.
export const SUBJECT_ORDER = ['english', 'calculus', 'security', 'cloud'];

export const ITEMS = [
  // ─────────── Inglés ───────────
  // Gramática (núcleo, ~40% del examen)
  { id: 'en-g1', subject: 'english', unit: 'Gramática', title: 'Partes de la oración (noun/verb/adj/adv/pron/prep)' },
  { id: 'en-g2', subject: 'english', unit: 'Gramática', title: 'Estructura Sujeto + Verbo + Predicado' },
  { id: 'en-g3', subject: 'english', unit: 'Gramática', title: 'Verbo to be, pronombres, negación/interrogación' },
  { id: 'en-g4', subject: 'english', unit: 'Gramática', title: 'Tiempos simples (do/does/did/will)' },
  { id: 'en-g5', subject: 'english', unit: 'Gramática', title: 'Tiempos continuos (-ING)' },
  { id: 'en-g6', subject: 'english', unit: 'Gramática', title: 'Perfect tenses (present & past)' },
  { id: 'en-g7', subject: 'english', unit: 'Gramática', title: 'Condicionales (0, 1, 2, 3)' },
  { id: 'en-g8', subject: 'english', unit: 'Gramática', title: 'Modal verbs' },
  { id: 'en-g9', subject: 'english', unit: 'Gramática', title: 'Gerundios vs. infinitivos' },
  { id: 'en-g10', subject: 'english', unit: 'Gramática', title: 'Voz pasiva / "se" impersonal' },
  // Vocabulario y lectura
  { id: 'en-v1', subject: 'english', unit: 'Vocabulario', title: 'Reading strategies (skimming/scanning/context)' },
  { id: 'en-v2', subject: 'english', unit: 'Vocabulario', title: 'Prefijos y sufijos' },
  { id: 'en-v3', subject: 'english', unit: 'Vocabulario', title: 'Phrasal verbs de alta frecuencia' },
  { id: 'en-v4', subject: 'english', unit: 'Vocabulario', title: 'Homófonos y palabras confusas' },
  { id: 'en-v5', subject: 'english', unit: 'Vocabulario', title: 'Falsos amigos' },
  { id: 'en-v6', subject: 'english', unit: 'Vocabulario', title: 'Fórmulas (the…the / there + be)' },
  // Secciones del modelo de examen (memorizar + variantes)
  { id: 'en-xa', subject: 'english', unit: 'Examen', title: 'A · Reading comprehension' },
  { id: 'en-xb', subject: 'english', unit: 'Examen', title: 'B · Fill in the blanks' },
  { id: 'en-xc', subject: 'english', unit: 'Examen', title: 'C · Best answer (50 ítems)' },
  { id: 'en-xd', subject: 'english', unit: 'Examen', title: 'D · Translate into Spanish' },
  { id: 'en-xe', subject: 'english', unit: 'Examen', title: 'E · Homophones' },
  { id: 'en-xf', subject: 'english', unit: 'Examen', title: 'F · Complete con palabra apropiada' },
  { id: 'en-xg', subject: 'english', unit: 'Examen', title: 'G · Choose the correct answer' },
  { id: 'en-xl', subject: 'english', unit: 'Examen', title: 'Listening section' },
  { id: 'en-xcomp', subject: 'english', unit: 'Examen', title: 'Composition (≥160 palabras)' },

  // ─────────── Cálculo Científico ───────────
  // Tema 3 · Factorizaciones (Parcial 2)
  { id: 'ca-t3-orto', subject: 'calculus', unit: 'Tema 3', title: 'Matrices ortogonales y de Householder' },
  { id: 'ca-t3-lu', subject: 'calculus', unit: 'Tema 3', title: 'Factorización LU (pivoteo, tridiagonales, unicidad)' },
  { id: 'ca-t3-chol', subject: 'calculus', unit: 'Tema 3', title: 'Factorización de Cholesky' },
  { id: 'ca-t3-qr', subject: 'calculus', unit: 'Tema 3', title: 'Factorización QR (Gram-Schmidt, Householder)' },
  { id: 'ca-t3-svd', subject: 'calculus', unit: 'Tema 3', title: 'SVD (Valores Singulares)' },
  { id: 'ca-t3-lsp', subject: 'calculus', unit: 'Tema 3', title: 'Mínimos Cuadrados (ecuaciones normales, vía QR)' },
  // Tema 4 · Sistemas lineales (Parcial 2)
  { id: 'ca-t4-cond', subject: 'calculus', unit: 'Tema 4', title: 'Número de condición y estabilidad' },
  { id: 'ca-t4-iter', subject: 'calculus', unit: 'Tema 4', title: 'Iterativos estacionarios (Jacobi, Gauss-Seidel)' },
  { id: 'ca-t4-noest', subject: 'calculus', unit: 'Tema 4', title: 'No estacionarios SPD (Mín. Descenso, Grad. Conjugados)' },
  { id: 'ca-t4-hess', subject: 'calculus', unit: 'Tema 4', title: 'Matrices de Hessenberg (LU, GaussH)' },
  // Tema 5 · Interpolación (Parcial 3)
  { id: 'ca-t5-plant', subject: 'calculus', unit: 'Tema 5', title: 'Planteamiento del problema de interpolación' },
  { id: 'ca-t5-lagr', subject: 'calculus', unit: 'Tema 5', title: 'Polinomios de Lagrange' },
  { id: 'ca-t5-newton', subject: 'calculus', unit: 'Tema 5', title: 'Fórmula de Newton (diferencias divididas)' },
  { id: 'ca-t5-spline', subject: 'calculus', unit: 'Tema 5', title: 'Splines (cúbico natural)' },
  // Tema 6 · Ceros de funciones (Parcial 3)
  { id: 'ca-t6-bisec', subject: 'calculus', unit: 'Tema 6', title: 'Método de Bisección' },
  { id: 'ca-t6-fijo', subject: 'calculus', unit: 'Tema 6', title: 'Iteraciones de punto fijo' },
  { id: 'ca-t6-newton', subject: 'calculus', unit: 'Tema 6', title: 'Newton y Secante' },
  { id: 'ca-t6-multi', subject: 'calculus', unit: 'Tema 6', title: 'Multivariable (Newton, Broyden)' },
  // Tema 7 · Aleatorizados (Parcial 3)
  { id: 'ca-t7-rand', subject: 'calculus', unit: 'Tema 7', title: 'Algoritmos aleatorizados (gradiente estocástico)' },

  // ─────────── Seguridad en Redes ───────────
  { id: 'se-u1', subject: 'security', unit: 'Unidad 1', title: 'Fundamentos (servicios, mecanismos, OSI, CIA)' },
  { id: 'se-u2', subject: 'security', unit: 'Unidad 2', title: 'Amenazas y ataques (pasivos/activos, virus, intrusos)' },
  { id: 'se-u3', subject: 'security', unit: 'Unidad 3', title: 'Criptología simétrica (clásicas, criptoanálisis)' },
  { id: 'se-u4', subject: 'security', unit: 'Unidad 4', title: 'Criptología asimétrica (clave pública)' },
  { id: 'se-u5', subject: 'security', unit: 'Unidad 5', title: 'Integridad, autenticación y firmas digitales' },
  { id: 'se-u6', subject: 'security', unit: 'Unidad 6', title: 'Seguridad inalámbrica e IP (802.11x, WEP, IPsec)' },

  // ─────────── Computación en la Nube (AWS SAA-C03) ───────────
  { id: 'cl-cc', subject: 'cloud', unit: 'Fundamentos', title: 'Cloud Computing (NIST, IaaS/PaaS/SaaS)' },
  { id: 'cl-infra', subject: 'cloud', unit: 'Fundamentos', title: 'Infraestructura global (Regiones, AZ, Edge)' },
  { id: 'cl-iam', subject: 'cloud', unit: 'IAM', title: 'IAM (usuarios/roles, políticas, MFA)' },
  { id: 'cl-ec2', subject: 'cloud', unit: 'EC2', title: 'EC2 (instancias, Security Groups, opciones de compra)' },
  { id: 'cl-ec2net', subject: 'cloud', unit: 'EC2', title: 'EC2 redes (IP, Placement Groups, ENI, hibernación)' },
  { id: 'cl-ebs', subject: 'cloud', unit: 'Almacenamiento', title: 'EBS (snapshots, AMI, tipos de volumen, cifrado)' },
  { id: 'cl-s3', subject: 'cloud', unit: 'Almacenamiento', title: 'S3 (buckets, versionado, cifrado, políticas)' },
  { id: 'cl-efs', subject: 'cloud', unit: 'Almacenamiento', title: 'EFS y comparativa EBS/EFS/Instance Store' },
  { id: 'cl-elb', subject: 'cloud', unit: 'Redes', title: 'ELB (ALB/NLB/GWLB, SNI, cross-zone)' },
  { id: 'cl-asg', subject: 'cloud', unit: 'Redes', title: 'ASG (launch template, políticas de escalado)' }
];

export const ITEMS_BY_SUBJECT = SUBJECT_ORDER.reduce((acc, sid) => {
  acc[sid] = ITEMS.filter((it) => it.subject === sid);
  return acc;
}, {});
