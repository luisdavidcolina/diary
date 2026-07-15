// Temario real derivado de docs/PLAN_ESTUDIO.md.
// Cada item es una unidad de trabajo que entra en la planificación diaria.
// `details` = sub-puntos del tema (desglose fino, no rompe el progreso ni los tests).
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
  { id: 'en-g1', subject: 'english', unit: 'Gramática', title: 'Partes de la oración', details: ['Sustantivo (noun) y verbo (verb)', 'Adjetivo: va antes del sustantivo', 'Adverbio (-ly)', 'Pronombres y preposiciones (on/in/at)'] },
  { id: 'en-g2', subject: 'english', unit: 'Gramática', title: 'Estructura Sujeto + Verbo + Predicado', details: ['El sujeto NUNCA se omite en inglés', 'Sujetos largos en textos científicos', 'Identificar el verbo real de la oración'] },
  { id: 'en-g3', subject: 'english', unit: 'Gramática', title: 'Verbo to be y pronombres', details: ['am / is / are', 'Negación: + not', 'Interrogación: inversión verbo-sujeto'] },
  { id: 'en-g4', subject: 'english', unit: 'Gramática', title: 'Tiempos simples', details: ['Presente: do/does (+s en 3ª persona)', 'Pasado: did (verbo en -ed)', 'Futuro: will', 'Regla: tras did/will el verbo no cambia'] },
  { id: 'en-g5', subject: 'english', unit: 'Gramática', title: 'Tiempos continuos (-ING)', details: ['to be + verbo-ING', 'Presente continuo (ahora)', 'Pasado continuo (acción interrumpida)'] },
  { id: 'en-g6', subject: 'english', unit: 'Gramática', title: 'Perfect tenses', details: ['Present Perfect: have/has + participio (since/for)', 'Past Perfect: had + participio (pasado del pasado)'] },
  { id: 'en-g7', subject: 'english', unit: 'Gramática', title: 'Condicionales', details: ['Zero: If + presente, presente', 'First: If + presente, will', 'Second: If + pasado, would ("were")', 'Third: If + had+part., would have + part.'] },
  { id: 'en-g8', subject: 'english', unit: 'Gramática', title: 'Modal verbs', details: ['can/could, may/might, should, must', 'El verbo tras un modal no lleva "to" ni -s/-ed/-ing'] },
  { id: 'en-g9', subject: 'english', unit: 'Gramática', title: 'Gerundios vs. infinitivos', details: ['enjoy/suggest/dislike → -ING', 'want/need/refuse/ask → to + verbo', 'Tras preposición (on/after/by) → -ING'] },
  { id: 'en-g10', subject: 'english', unit: 'Gramática', title: 'Voz pasiva / "se" impersonal', details: ['"It is said that…" → "Se dice que…"', '"They were known to…" → "Se conocía que…"'] },
  // Vocabulario y lectura
  { id: 'en-v1', subject: 'english', unit: 'Vocabulario', title: 'Reading strategies', details: ['Skimming (idea general)', 'Scanning (buscar dato)', 'Context clues (deducir por contexto)'] },
  { id: 'en-v2', subject: 'english', unit: 'Vocabulario', title: 'Prefijos y sufijos', details: ['-tion/-ment/-ness → sustantivos', '-ly → adverbios', '-ize/-ify → verbos'] },
  { id: 'en-v3', subject: 'english', unit: 'Vocabulario', title: 'Phrasal verbs de alta frecuencia', details: ['work out, make up', 'take after, look after', 'look up to (admirar)'] },
  { id: 'en-v4', subject: 'english', unit: 'Vocabulario', title: 'Homófonos y palabras confusas', details: ['brake / break', 'pain / pane', 'beside / besides'] },
  { id: 'en-v5', subject: 'english', unit: 'Vocabulario', title: 'Falsos amigos', details: ['actually = en realidad', 'assist = ayudar', 'library = biblioteca', 'realize = darse cuenta'] },
  { id: 'en-v6', subject: 'english', unit: 'Vocabulario', title: 'Fórmulas intraducibles', details: ['"The…the…" = cuanto más… más…', '"There + be" = haber (existencia)'] },
  // Secciones del modelo de examen (memorizar + variantes)
  { id: 'en-xa', subject: 'english', unit: 'Examen', title: 'A · Reading comprehension', details: ['Texto + opción múltiple', 'Emparejar sinónimos'] },
  { id: 'en-xb', subject: 'english', unit: 'Examen', title: 'B · Fill in the blanks', details: ['Completar texto científico (HIV breakthrough)'] },
  { id: 'en-xc', subject: 'english', unit: 'Examen', title: 'C · Best answer (50 ítems)', details: ['Gramática aplicada: tiempos, condicionales, gerundios, preposiciones'] },
  { id: 'en-xd', subject: 'english', unit: 'Examen', title: 'D · Translate into Spanish', details: ['Frases técnicas médicas', 'Español natural (evitar traducción literal)'] },
  { id: 'en-xe', subject: 'english', unit: 'Examen', title: 'E · Homophones', details: ['Elegir según contexto (misma pronunciación)'] },
  { id: 'en-xf', subject: 'english', unit: 'Examen', title: 'F · Complete con palabra apropiada', details: ['Preposiciones fijas: afraid of, worried about'] },
  { id: 'en-xg', subject: 'english', unit: 'Examen', title: 'G · Choose the correct answer', details: ['Traducción, decimales, conectores, cultura general'] },
  { id: 'en-xl', subject: 'english', unit: 'Examen', title: 'Listening section', details: ['Completar palabras según el audio'] },
  { id: 'en-xcomp', subject: 'english', unit: 'Examen', title: 'Composition (≥160 palabras)', details: ['4 párrafos: hook + 2 desarrollos + conclusión', 'Conectores y cierre en futuro/condicional'] },

  // ─────────── Cálculo Científico ───────────
  // Tema 3 · Factorizaciones (Parcial 2)
  { id: 'ca-t3-orto', subject: 'calculus', unit: 'Tema 3', title: 'Matrices ortogonales y de Householder', details: ['Definición y propiedades de matrices ortogonales', 'Householder: simétrica, ortogonal, involutoria (P1–P9)', 'Propiedad de aniquilación (para QR)'] },
  { id: 'ca-t3-lu', subject: 'calculus', unit: 'Tema 3', title: 'Factorización LU', details: ['A = LU sin pivoteo', 'PA = LU con pivoteo parcial', 'Caso tridiagonal', 'Unicidad de la factorización'] },
  { id: 'ca-t3-chol', subject: 'calculus', unit: 'Tema 3', title: 'Factorización de Cholesky', details: ['Requiere matriz SPD', 'A = LLᵀ', 'Cholesky por bloques', 'Algoritmo 3×3'] },
  { id: 'ca-t3-qr', subject: 'calculus', unit: 'Tema 3', title: 'Factorización QR', details: ['Gram-Schmidt clásico y modificado', 'Householder (preferido por estabilidad)', 'Q ortogonal, R triangular superior'] },
  { id: 'ca-t3-svd', subject: 'calculus', unit: 'Tema 3', title: 'SVD (Valores Singulares)', details: ['A = UΣVᵀ', 'Valores singulares (reales ≥ 0)', 'Algoritmo para hallar la SVD'] },
  { id: 'ca-t3-lsp', subject: 'calculus', unit: 'Tema 3', title: 'Mínimos Cuadrados (LSP)', details: ['Ecuaciones normales AᵀAx = Aᵀb', 'Resolución estable vía QR', 'Caso ‖y − αx‖; ajuste constante = media', 'Residuo ⊥ espacio columna'] },
  // Tema 4 · Sistemas lineales (Parcial 2)
  { id: 'ca-t4-cond', subject: 'calculus', unit: 'Tema 4', title: 'Número de condición y estabilidad', details: ['cond(A) y mal condicionamiento', 'Cota ‖δx‖/‖x‖ ≤ cond(A)·‖δb‖/‖b‖'] },
  { id: 'ca-t4-iter', subject: 'calculus', unit: 'Tema 4', title: 'Iterativos estacionarios', details: ['Método de Jacobi', 'Método de Gauss-Seidel', 'Richardson', 'Convergencia: EDD, ‖T‖ < 1'] },
  { id: 'ca-t4-noest', subject: 'calculus', unit: 'Tema 4', title: 'No estacionarios (SPD)', details: ['Mínimo Descenso (Cauchy): r_{k+1} ⊥ r_k', 'Gradientes Conjugados', 'Precondicionamiento'] },
  { id: 'ca-t4-hess', subject: 'calculus', unit: 'Tema 4', title: 'Matrices de Hessenberg', details: ['LU de una matriz de Hessenberg', 'Algoritmo eficiente GaussH'] },
  // Tema 5 · Interpolación (Parcial 3)
  { id: 'ca-t5-plant', subject: 'calculus', unit: 'Tema 5', title: 'Planteamiento del problema', details: ['Existencia y unicidad del interpolador', 'n+1 puntos → polinomio de grado ≤ n'] },
  { id: 'ca-t5-lagr', subject: 'calculus', unit: 'Tema 5', title: 'Polinomios de Lagrange', details: ['Base de Lagrange', 'Construcción del interpolador'] },
  { id: 'ca-t5-newton', subject: 'calculus', unit: 'Tema 5', title: 'Fórmula de Newton', details: ['Diferencias divididas', 'Forma incremental del interpolador'] },
  { id: 'ca-t5-spline', subject: 'calculus', unit: 'Tema 5', title: 'Splines', details: ['Spline de interpolación', 'Spline cúbico natural', 'Aplicaciones'] },
  // Tema 6 · Ceros de funciones (Parcial 3)
  { id: 'ca-t6-bisec', subject: 'calculus', unit: 'Tema 6', title: 'Método de Bisección', details: ['Requiere f(a)·f(b) < 0', 'Convergencia lineal garantizada'] },
  { id: 'ca-t6-fijo', subject: 'calculus', unit: 'Tema 6', title: 'Iteraciones de punto fijo', details: ['x = g(x)', 'Condición de convergencia |g\'(x)| < 1'] },
  { id: 'ca-t6-newton', subject: 'calculus', unit: 'Tema 6', title: 'Newton y Secante', details: ['Newton: convergencia cuadrática', 'Secante: sin derivada'] },
  { id: 'ca-t6-multi', subject: 'calculus', unit: 'Tema 6', title: 'Multivariable', details: ['Newton multivariable (Jacobiano)', 'Métodos tipo Secante: Broyden'] },
  // Tema 7 · Aleatorizados (Parcial 3)
  { id: 'ca-t7-rand', subject: 'calculus', unit: 'Tema 7', title: 'Algoritmos aleatorizados', details: ['Caso de estudio: gradiente estocástico'] },

  // ─────────── Seguridad en Redes ───────────
  { id: 'se-u1', subject: 'security', unit: 'Unidad 1', title: 'Fundamentos de seguridad', details: ['Servicios, mecanismos y ataques', 'Confidencialidad, Integridad, Disponibilidad', 'Autenticación, No repudio, Control de acceso', 'Arquitectura de seguridad OSI (X.800)'] },
  { id: 'se-u2', subject: 'security', unit: 'Unidad 2', title: 'Amenazas y ataques', details: ['Interrupción, intercepción, modificación, fabricación', 'Ataques pasivos vs. activos', 'Intrusos y técnicas de detección', 'Virus, gusanos y sistemas confiables'] },
  { id: 'se-u3', subject: 'security', unit: 'Unidad 3', title: 'Criptología simétrica', details: ['Criptosistemas y criptoanálisis', 'Sustitución, transposición, rotación, esteganografía', 'Criptoanálisis diferencial y lineal', 'Distribución de claves'] },
  { id: 'se-u4', subject: 'security', unit: 'Unidad 4', title: 'Criptología asimétrica', details: ['Modelos de clave pública', 'Requerimientos y aplicaciones (RSA)', 'Distribución de claves públicas'] },
  { id: 'se-u5', subject: 'security', unit: 'Unidad 5', title: 'Integridad, autenticación y firmas', details: ['MAC y funciones hash', 'Firma digital directa y arbitrada', 'Certificados digitales y CA', 'Protocolos de autenticación'] },
  { id: 'se-u6', subject: 'security', unit: 'Unidad 6', title: 'Seguridad inalámbrica e IP', details: ['802.11x y WEP (vulnerabilidades)', 'Seguridad en Bluetooth', 'IPsec: cabeceras AH y ESP'] },

  // ─────────── Computación en la Nube (AWS SAA-C03) ───────────
  { id: 'cl-cc', subject: 'cloud', unit: 'Fundamentos', title: 'Cloud Computing', details: ['5 pilares NIST', 'IaaS / PaaS / SaaS', 'CAPEX → OPEX'] },
  { id: 'cl-infra', subject: 'cloud', unit: 'Fundamentos', title: 'Infraestructura global', details: ['Regiones', 'Zonas de Disponibilidad (AZ)', 'Edge Locations'] },
  { id: 'cl-iam', subject: 'cloud', unit: 'IAM', title: 'IAM', details: ['Usuarios, grupos y roles', 'Políticas JSON (Deny gana)', 'MFA y mínimo privilegio'] },
  { id: 'cl-ec2', subject: 'cloud', unit: 'EC2', title: 'EC2', details: ['Tipos y familias de instancias', 'Security Groups (firewall)', 'Opciones de compra (On-Demand/Reserved/Spot/…)'] },
  { id: 'cl-ec2net', subject: 'cloud', unit: 'EC2', title: 'EC2 redes', details: ['IP pública / privada / elástica', 'Placement Groups', 'ENI e hibernación'] },
  { id: 'cl-ebs', subject: 'cloud', unit: 'Almacenamiento', title: 'EBS', details: ['Volúmenes, snapshots, AMI', 'Tipos: GP2/3, IO1/2, ST1, SC1', 'Cifrado (KMS)'] },
  { id: 'cl-s3', subject: 'cloud', unit: 'Almacenamiento', title: 'S3', details: ['Buckets y objetos', 'Versionado y cifrado', 'Políticas de bucket, static hosting'] },
  { id: 'cl-efs', subject: 'cloud', unit: 'Almacenamiento', title: 'EFS', details: ['Sistema de archivos compartido', 'EBS vs. EFS vs. Instance Store'] },
  { id: 'cl-elb', subject: 'cloud', unit: 'Redes', title: 'ELB', details: ['ALB (capa 7) / NLB (capa 4) / GWLB', 'Sticky sessions y cross-zone', 'SSL/TLS y SNI'] },
  { id: 'cl-asg', subject: 'cloud', unit: 'Redes', title: 'ASG', details: ['Launch template y capacidad', 'Escalado: target/step/scheduled/predictive', 'Cooldown y CloudWatch'] }
];

export const ITEMS_BY_SUBJECT = SUBJECT_ORDER.reduce((acc, sid) => {
  acc[sid] = ITEMS.filter((it) => it.subject === sid);
  return acc;
}, {});
