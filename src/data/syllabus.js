// Temario real derivado de las notas informativas oficiales (docs/) y PLAN_ESTUDIO.md.
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
  { id: 'en-g1', subject: 'english', unit: 'Gramática', title: 'Partes de la oración', details: ['Sustantivo (noun) y verbo (verb)', 'Adjetivo: va ANTES del sustantivo', 'Adverbio (termina en -ly)', 'Pronombres (he/she/it/they)', 'Preposiciones (on / in / at)'] },
  { id: 'en-g2', subject: 'english', unit: 'Gramática', title: 'Estructura Sujeto + Verbo + Predicado', details: ['El sujeto NUNCA se omite en inglés', 'Sujetos largos en textos científicos', 'Identificar el verbo real de la oración', 'Orden fijo [Sujeto][Verbo][Predicado]'] },
  { id: 'en-g3', subject: 'english', unit: 'Gramática', title: 'Verbo to be y pronombres', details: ['am / is / are (presente)', 'Negación: sujeto + verbo + not', 'Interrogación: inversión verbo–sujeto', '"It" para enfermedades/procesos'] },
  { id: 'en-g4', subject: 'english', unit: 'Gramática', title: 'Tiempos simples', details: ['Presente: do/does (+s en 3ª persona)', 'Pasado: did (verbo -ed)', 'Futuro: will', 'Regla de oro: tras do/did/will el verbo no cambia'] },
  { id: 'en-g5', subject: 'english', unit: 'Gramática', title: 'Tiempos continuos (-ING)', details: ['Fórmula: to be + verbo-ING', 'Presente continuo (acción ahora / tendencias)', 'Pasado continuo (acción interrumpida)'] },
  { id: 'en-g6', subject: 'english', unit: 'Gramática', title: 'Perfect tenses', details: ['Present Perfect: have/has + participio', 'Pistas: since / for → Present Perfect', 'Past Perfect: had + participio (pasado del pasado)', 'Acción 1 (had+part.) antes de Acción 2 (pasado simple)'] },
  { id: 'en-g7', subject: 'english', unit: 'Gramática', title: 'Condicionales', details: ['Zero: If + presente, presente (hechos)', 'First: If + presente, will (posible)', 'Second: If + pasado, would ("were" siempre)', 'Third: If + had+part., would have + part. (lamento)'] },
  { id: 'en-g8', subject: 'english', unit: 'Gramática', title: 'Modal verbs', details: ['can/could (habilidad)', 'may/might (probabilidad baja)', 'should (consejo)', 'must (obligación/deducción)', 'El verbo tras un modal no lleva "to" ni -s/-ed/-ing'] },
  { id: 'en-g9', subject: 'english', unit: 'Gramática', title: 'Gerundios vs. infinitivos', details: ['enjoy/suggest/dislike/feel like → -ING', 'want/need/refuse/ask → to + verbo', 'Tras preposición (on/after/by/in) → -ING'] },
  { id: 'en-g10', subject: 'english', unit: 'Gramática', title: 'Voz pasiva / "se" impersonal', details: ['"It is said that…" → "Se dice que…"', '"They were known to…" → "Se conocía que…"', '"The nodes are found to be…" → "Se encuentra que…"'] },
  // Vocabulario y lectura
  { id: 'en-v1', subject: 'english', unit: 'Vocabulario', title: 'Reading strategies', details: ['Skimming: 1ª y última línea de cada párrafo', 'Scanning: buscar dato/palabra clave', 'Context clues: deducir por contexto'] },
  { id: 'en-v2', subject: 'english', unit: 'Vocabulario', title: 'Prefijos y sufijos', details: ['-tion / -ment / -ness → sustantivos', '-ly → adverbios', '-ize / -ify → verbos'] },
  { id: 'en-v3', subject: 'english', unit: 'Vocabulario', title: 'Phrasal verbs de alta frecuencia', details: ['work out (resolver / ejercitarse)', 'make up (decidirse / inventar)', 'take after (parecerse) / look after (cuidar)', 'look up to (admirar)'] },
  { id: 'en-v4', subject: 'english', unit: 'Vocabulario', title: 'Homófonos y palabras confusas', details: ['brake / break', 'pain / pane', 'naval / navel', 'beside / besides'] },
  { id: 'en-v5', subject: 'english', unit: 'Vocabulario', title: 'Falsos amigos', details: ['actually = en realidad (no "actualmente")', 'assist = ayudar (no "asistir")', 'library = biblioteca (no "librería")', 'success = éxito; realize = darse cuenta'] },
  { id: 'en-v6', subject: 'english', unit: 'Vocabulario', title: 'Fórmulas intraducibles', details: ['"The…the…" = cuanto más… más…', '"There + be/modal" = haber (existencia)'] },
  // Secciones del modelo de examen (memorizar + variantes)
  { id: 'en-xa', subject: 'english', unit: 'Examen', title: 'A · Reading comprehension', details: ['Texto "The Peacelike Mongoose"', 'Opción múltiple (11 preguntas)', 'Emparejar sinónimos (paw, sting, banishment…)'] },
  { id: 'en-xb', subject: 'english', unit: 'Examen', title: 'B · Fill in the blanks', details: ['Texto científico "HIV Breakthrough"', 'Completar con la mejor opción'] },
  { id: 'en-xc', subject: 'english', unit: 'Examen', title: 'C · Best answer (50 ítems)', details: ['Tiempos verbales y perfectos', 'Condicionales y modales', 'Gerundios/infinitivos y preposiciones', 'Reported speech, wish, tag questions'] },
  { id: 'en-xd', subject: 'english', unit: 'Examen', title: 'D · Translate into Spanish', details: ['Frases técnicas médicas', 'Uso del "se" impersonal', 'Español natural (evitar traducción literal)'] },
  { id: 'en-xe', subject: 'english', unit: 'Examen', title: 'E · Homophones', details: ['Elegir la forma correcta por contexto', 'brake/grate/naval/pain/paced'] },
  { id: 'en-xf', subject: 'english', unit: 'Examen', title: 'F · Complete con palabra apropiada', details: ['Preposiciones fijas: afraid of, worried about', 'beside/besides, chauffeur/driver, yet/already, now/actually'] },
  { id: 'en-xg', subject: 'english', unit: 'Examen', title: 'G · Choose the correct answer', details: ['Traducción de sintagmas', 'Números/decimales y equivalencias', 'Conectores (addition/result)', 'Cultura general y phrasal verbs'] },
  { id: 'en-xl', subject: 'english', unit: 'Examen', title: 'Listening section', details: ['Escuchar y completar 10 palabras', 'Texto "Historic letters get responses"'] },
  { id: 'en-xcomp', subject: 'english', unit: 'Examen', title: 'Composition (≥160 palabras)', details: ['4 párrafos: hook + 2 desarrollos + conclusión', 'Conectores (Furthermore, However, Therefore)', 'Cierre en futuro/condicional', 'Temas: inglés global / bilingüismo'] },

  // ─────────── Cálculo Científico ───────────
  // Tema 3 · Factorizaciones matriciales (Parcial 2)
  { id: 'ca-t3-orto', subject: 'calculus', unit: 'Tema 3', title: 'Matrices ortogonales y de Householder', details: ['Definición y propiedades de matrices ortogonales', 'Matriz de Householder: simétrica y ortogonal', 'Involutoria (H² = I), det(H) = −1', 'Propiedad de aniquilación (para QR)'] },
  { id: 'ca-t3-lu', subject: 'calculus', unit: 'Tema 3', title: 'Factorización LU', details: ['A = LU sin pivoteo', 'PA = LU con pivoteo parcial', 'Caso de matrices tridiagonales', 'Unicidad de la factorización', 'Sistemas transpuestos con PA=LU'] },
  { id: 'ca-t3-chol', subject: 'calculus', unit: 'Tema 3', title: 'Factorización de Cholesky', details: ['Requiere matriz simétrica definida positiva (SPD)', 'A = LLᵀ', 'Cholesky por bloques', 'Algoritmo 3×3', 'Unicidad de la factorización'] },
  { id: 'ca-t3-qr', subject: 'calculus', unit: 'Tema 3', title: 'Factorización QR', details: ['Gram-Schmidt clásico y modificado', 'Householder (preferido por estabilidad)', 'Q ortogonal, R triangular superior', '‖A‖_F = ‖R‖_F'] },
  { id: 'ca-t3-svd', subject: 'calculus', unit: 'Tema 3', title: 'Descomposición en Valores Singulares (SVD)', details: ['A = UΣVᵀ', 'Valores singulares reales ≥ 0', 'Columnas de U y V ortonormales', 'Algoritmo para hallar la SVD', 'Relación con Cholesky de AᵀA'] },
  { id: 'ca-t3-lsp', subject: 'calculus', unit: 'Tema 3', title: 'Problema de Mínimos Cuadrados (LSP)', details: ['Ecuaciones normales AᵀAx = Aᵀb', 'Resolución estable vía QR', 'Residuo r = b−Ax ⊥ espacio columna', 'Caso ‖y − αx‖₂ (escalar óptimo)', 'Ajuste constante = media aritmética'] },
  // Tema 4 · Resolución numérica de sistemas lineales (Parcial 2)
  { id: 'ca-t4-cond', subject: 'calculus', unit: 'Tema 4', title: 'Número de condición y estabilidad', details: ['cond(A) y mal condicionamiento', 'Cota ‖δx‖/‖x‖ ≤ cond(A)·‖δb‖/‖b‖', 'Métodos directos: uso de las factorizaciones'] },
  { id: 'ca-t4-iter', subject: 'calculus', unit: 'Tema 4', title: 'Métodos iterativos estacionarios', details: ['Esquema x = Bx + d; convergencia ‖B‖<1', 'Método de Jacobi (caso de estudio)', 'Método de Gauss-Seidel', 'Método de Richardson', 'Convergencia para matrices EDD'] },
  { id: 'ca-t4-noest', subject: 'calculus', unit: 'Tema 4', title: 'Métodos no estacionarios (caso SPD)', details: ['Mínimo Descenso (Cauchy): r_{k+1} ⊥ r_k', 'Gradientes Conjugados: r_{k+1} ⊥ r_j ∀ j≤k', 'Formas de t_k y β_k', 'Precondicionamiento'] },
  { id: 'ca-t4-hess', subject: 'calculus', unit: 'Tema 4', title: 'Matrices de Hessenberg', details: ['Cálculo de LU para matriz de Hessenberg', 'Algoritmo eficiente GaussH', 'Demostración QᵀL triangular superior'] },
  // Tema 5 · Interpolación polinomial (Parcial 3)
  { id: 'ca-t5-plant', subject: 'calculus', unit: 'Tema 5', title: 'Planteamiento del problema', details: ['Existencia y unicidad del interpolador', 'n+1 puntos distintos → polinomio de grado ≤ n'] },
  { id: 'ca-t5-lagr', subject: 'calculus', unit: 'Tema 5', title: 'Polinomios de Lagrange', details: ['Base de Lagrange', 'Construcción del interpolador'] },
  { id: 'ca-t5-newton', subject: 'calculus', unit: 'Tema 5', title: 'Fórmula de Newton', details: ['Diferencias divididas', 'Forma incremental del interpolador'] },
  { id: 'ca-t5-spline', subject: 'calculus', unit: 'Tema 5', title: 'Splines', details: ['Spline de interpolación', 'Spline cúbico natural', 'Aplicaciones'] },
  // Tema 6 · Ceros de funciones (Parcial 3)
  { id: 'ca-t6-bisec', subject: 'calculus', unit: 'Tema 6', title: 'Método de Bisección', details: ['Requiere f(a)·f(b) < 0 (cambio de signo)', 'Convergencia lineal garantizada'] },
  { id: 'ca-t6-fijo', subject: 'calculus', unit: 'Tema 6', title: 'Iteraciones de punto fijo', details: ['x = g(x)', 'Condición de convergencia |g′(x)| < 1'] },
  { id: 'ca-t6-newton', subject: 'calculus', unit: 'Tema 6', title: 'Método de Newton y de la Secante', details: ['Newton: convergencia cuadrática', 'Secante: sin derivada'] },
  { id: 'ca-t6-multi', subject: 'calculus', unit: 'Tema 6', title: 'Cálculo multivariable', details: ['Método de Newton (Jacobiano)', 'Métodos tipo Secante: Broyden (caso de estudio)', 'Aplicaciones'] },
  // Tema 7 · Algoritmos aleatorizados (Parcial 3)
  { id: 'ca-t7-rand', subject: 'calculus', unit: 'Tema 7', title: 'Algoritmos aleatorizados en Cálculo Científico', details: ['Caso de estudio: Gradiente estocástico'] },

  // ─────────── Seguridad en Redes (nota informativa oficial, 6 unidades) ───────────
  { id: 'se-u1', subject: 'security', unit: 'Unidad 1', title: 'Fundamentos básicos de la Seguridad de redes', details: ['Seguridad de la Información: mecanismos, servicios y ataques', 'Confidencialidad, Autenticación, Integridad', 'No repudiación, Control de Acceso, Disponibilidad', 'Arquitectura de seguridad en el modelo OSI', 'Modelo básico de Seguridad en redes'] },
  { id: 'se-u2', subject: 'security', unit: 'Unidad 2', title: 'Amenazas y Ataques', details: ['Categorías: Interrupción, Intercepción, Modificación, Fabricación', 'Ataques pasivos: por contenido y análisis de tráfico', 'Ataques activos: impersonalización, retransmisión, modificación, DoS', 'Intrusos: clases, técnicas de intrusión y defensa', 'Detección de intrusos: auditoría, estadísticas, reglas', 'Virus: taxonomía, estructura, tipos y antivirus', 'Gusanos: propagación y contramedidas', 'Sistemas confiables y seguridad multinivel'] },
  { id: 'se-u3', subject: 'security', unit: 'Unidad 3', title: 'Criptología Convencional o Simétrica', details: ['Criptografía, criptosistemas y criptoanálisis', 'Modelo de encriptación convencional/simétrico', 'Técnicas clásicas: sustitución, transposición, rotación, esteganografía', 'Criptoanálisis diferencial y lineal', 'Distribución de claves y generación de números aleatorios', 'Casos de estudio de cifrado simétrico'] },
  { id: 'se-u4', subject: 'security', unit: 'Unidad 4', title: 'Criptología de clave pública o asimétrica', details: ['Modelos de criptosistemas de clave pública', 'Requerimientos y aplicaciones', 'Criptoanálisis en sistemas de clave pública', 'Distribución de claves públicas', 'Distribución de claves secretas de cifrado convencional', 'Casos de estudio de cifrado asimétrico'] },
  { id: 'se-u5', subject: 'security', unit: 'Unidad 5', title: 'Integridad, Autenticación y Firmas digitales', details: ['Requerimientos de la autenticación', 'Funciones: encriptación del mensaje, MAC y funciones hash', 'Requerimientos del MAC y caso de estudio', 'Funciones hash: encadenamiento de bloques', 'Firmas digitales: directa y arbitrada', 'Protocolos de autenticación: mutua y en una dirección', 'Certificados digitales: obtención/revocación'] },
  { id: 'se-u6', subject: 'security', unit: 'Unidad 6', title: 'Seguridad en redes Inalámbricas y en IP', details: ['El problema de las redes inalámbricas y el espectro', 'Seguridad en redes 802.11x', 'Protocolo WEP: vulnerabilidad y ataques', 'Seguridad en Bluetooth y sus ataques', 'Seguridad en IP: arquitectura', 'Cabeceras de autenticación (AH) y encapsulación (ESP)'] },

  // ─────────── Computación en la Nube (AWS SAA-C03) ───────────
  { id: 'cl-cc', subject: 'cloud', unit: 'Fundamentos', title: 'Cloud Computing', details: ['5 pilares NIST (autoservicio, elasticidad, servicio medido…)', 'Modelos de despliegue: privado/público/híbrido', 'Modelos de servicio: IaaS / PaaS / SaaS', 'Ventajas: CAPEX → OPEX, economías de escala'] },
  { id: 'cl-infra', subject: 'cloud', unit: 'Fundamentos', title: 'Infraestructura Global de AWS', details: ['Regiones (cómo elegir: compliance, latencia, precio)', 'Zonas de Disponibilidad (AZs)', 'Edge Locations / Puntos de Presencia', 'Alcance: global / regional / zonal'] },
  { id: 'cl-iam', subject: 'cloud', unit: 'IAM', title: 'IAM — Identidades y Accesos', details: ['Usuarios, grupos y roles', 'Políticas JSON (Effect, Action, Resource; Deny gana)', 'Principio de mínimo privilegio', 'MFA (virtual, U2F, hardware)', 'Consola / CLI / SDK y Access Keys', 'IAM Credentials Report y Access Advisor'] },
  { id: 'cl-ec2', subject: 'cloud', unit: 'EC2', title: 'EC2 — Elastic Compute Cloud', details: ['Tipos y familias de instancias (t2.micro Free Tier)', 'User Data (bootstrap)', 'Security Groups (firewall, stateful)', 'Conexión por SSH / EC2 Instance Connect', 'Opciones de compra: On-Demand, Reserved, Spot', 'Savings Plans, Dedicated Host/Instance, Capacity Reservations'] },
  { id: 'cl-ec2net', subject: 'cloud', unit: 'EC2', title: 'EC2 — Redes y Direcciones IP', details: ['IP pública / privada / elástica', 'Placement Groups (cluster / spread / partition)', 'ENI — Elastic Network Interface', 'Hibernación de EC2'] },
  { id: 'cl-ebs', subject: 'cloud', unit: 'Almacenamiento', title: 'EBS — Elastic Block Store', details: ['Volúmenes de red ligados a una AZ', 'Snapshots (incrementales, archive, recycle bin)', 'AMI — Amazon Machine Image', 'EC2 Instance Store (efímero, alto IOPS)', 'Tipos: GP2/GP3, IO1/IO2, ST1, SC1', 'Multi-Attach y cifrado (KMS)'] },
  { id: 'cl-s3', subject: 'cloud', unit: 'Almacenamiento', title: 'S3 — Simple Storage Service', details: ['Buckets y objetos', 'Versionado', 'Cifrado (SSE-S3/KMS)', 'Políticas de bucket y ACL', 'Static website hosting', 'Replicación (CRR/SRR)'] },
  { id: 'cl-efs', subject: 'cloud', unit: 'Almacenamiento', title: 'EFS y comparativa de almacenamiento', details: ['EFS: sistema de archivos compartido (multi-AZ)', 'EBS vs. EFS vs. Instance Store', 'Cuándo usar cada uno'] },
  { id: 'cl-elb', subject: 'cloud', unit: 'Redes', title: 'ELB — Elastic Load Balancer', details: ['ALB (capa 7), NLB (capa 4), GWLB (capa 3)', 'Health checks y target groups', 'Sticky sessions (cookies)', 'Cross-Zone load balancing', 'SSL/TLS, ACM y SNI', 'Connection draining'] },
  { id: 'cl-asg', subject: 'cloud', unit: 'Redes', title: 'ASG — Auto Scaling Groups', details: ['Capacidad: mínimo / deseado / máximo', 'Launch Template', 'ASG con Load Balancer', 'Escalado: dynamic (target/step/simple), scheduled, predictive', 'Métricas CloudWatch y cooldown'] }
];

export const ITEMS_BY_SUBJECT = SUBJECT_ORDER.reduce((acc, sid) => {
  acc[sid] = ITEMS.filter((it) => it.subject === sid);
  return acc;
}, {});
