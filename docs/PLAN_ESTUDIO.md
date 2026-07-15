# Plan de Estudio — Borrador

> Documento generado a partir del análisis de todo el material en `docs/`.
> **Objetivo:** que revises si falta algún tema o si hay cosas de más.
> Marca con ✅ lo dominado, ✏️ lo que quieras ajustar, y ❓ donde tengas dudas.

**Contexto de calendario:** las clases en la UCV se **reanudan en septiembre 2026** (recalendarizadas tras el terremoto). El período **jul–ago** es una ventana de **estudio anticipado y autónomo** para llegar adelantado. El "plazo de 2 meses" del README aplica a esta ventana de preparación previa.
Las materias 1–4 abajo están ordenadas por prioridad declarada.

---

## 1. Inglés — Examen de Suficiencia (UCV)

**Perfil actual:** nivel **A2**. **Meta:** eximir (20/20).
**Material disponible:** `docs/ingles/` — guía estratégica (`guia_estudio_estrategica.tex`), examen resuelto completo (`examen_ocr.txt`, `exam.pdf`), guía (`guia.pdf`), apuntes de maestría.

**Objetivo principal (confirmado):**
> **Poder responder el modelo de examen que ya tenemos** (el profesor suele repetirlo).
> El plan tiene dos capas:
> 1. **Memorizar el modelo** — dominar el examen resuelto de punta a punta (respuestas + por qué).
> 2. **Blindarse ante variantes** — aprender el vocabulario y la gramática *alrededor* de cada pregunta, de modo que si cambian un dato o reformulan, igual pueda contestar. (Partimos de A2, así que se refuerza base + se sube nivel sobre el propio examen.)

**Método sugerido:** trabajar sección por sección del modelo → para cada pregunta, entender la regla de fondo → generar 2–3 variantes propias y resolverlas.

### Gramática (núcleo — ~40% del examen)
- [ ] Partes de la oración (noun, verb, adjective, adverb, pronoun, preposition)
- [ ] Estructura Sujeto + Verbo + Predicado (sujetos largos en textos científicos)
- [ ] Verbo *to be*, pronombres, negación e interrogación
- [ ] Tiempos simples: presente / pasado / futuro (auxiliares do/does/did/will)
- [ ] Tiempos continuos (-ING)
- [ ] **Perfect tenses**: Present Perfect (have/has + participio, "since/for"), Past Perfect (had + participio)
- [ ] **Condicionales** (Zero, First, Second, Third) + trampa "were" en el 2do
- [ ] **Modal verbs** (can/could, may/might, should, must)
- [ ] Gerundios vs. infinitivos (según verbo previo; preposición → -ING)
- [ ] Voz pasiva / "se" impersonal para traducción

### Vocabulario y lectura
- [ ] Reading strategies: skimming, scanning, context clues
- [ ] Prefijos y sufijos (-tion, -ment, -ness, -ly, -ize, -ify)
- [ ] Phrasal verbs de alta frecuencia (work out, make up, take after, look after, look up to)
- [ ] Homófonos y palabras confusas (brake/break, pain/pane, beside/besides)
- [ ] Falsos amigos (actually, assist, library, success, realize)
- [ ] Fórmulas: "The [comp], the [comp]" / "There + to be"

### Secciones del examen (según modelo resuelto)
- [ ] A. Reading comprehension (opción múltiple + sinónimos)
- [ ] B. Fill in the blanks (texto científico)
- [ ] C. Best answer (50 ítems de gramática)
- [ ] D. Translate into Spanish (frases técnicas)
- [ ] E. Homophones (misma pronunciación, distinto significado)
- [ ] F. Complete con palabra apropiada (preposiciones fijas)
- [ ] G. Choose the correct answer (traducción, decimales, conectores, cultura general)
- [ ] Listening section (completar palabras)
- [ ] **Composition** (≥160 palabras, 4 párrafos: hook, 2 desarrollos, conclusión)

---

## 2. Cálculo Científico (UCV — código 6109, I-2026)

**Prof.:** Dr. Luis Manuel Hernández-Ramos. **Evaluación:** Teoría 70% (promedio de parciales) · Talleres y práctica 30%.
**Estado:** Parcial 1 (Temas 1–2) ya presentado. **Meta (confirmada):** estudiar **Temas 3, 4, 5, 6 (y 7)** = **Parciales 2 y 3**, aprenderlo **todo** en estas semanas.
**Material disponible:** `docs/calculo/` — **modelos que pasó el profesor** (exámenes/quices 2016–2025), **guías propias** hechas antes (resumen teórico-práctico y soluciones detalladas en LaTeX), prácticas, libros (Kincaid & Cheney, Watkins).

**Parciales y temas:**
| Parcial | Temas |
|---------|-------|
| 1 (hecho) | 1, 2 |
| **2** | **3, 4** |
| **3** | **5, 6, 7** |

> ⚠️ **Fechas:** las de la nota informativa (may–ago 2026) **quedaron anuladas por el terremoto**. Las clases se reanudan en **septiembre 2026**, así que los parciales se recalendarizan a partir de ahí. → Este período (jul–ago) es tiempo de **estudio anticipado y autónomo** antes de que retomen. Actualizaré las fechas cuando el profe publique el nuevo cronograma.

### Temas 3 y 4 → Parcial 2 (bien documentados en tu resumen)
- [ ] **Preliminar — Matrices ortogonales** y de Householder (propiedades P1–P9)
- [ ] **Tema 3 · Factorizaciones de matrices**
  - [ ] LU (con/sin pivoteo parcial PA=LU, tridiagonales, unicidad)
  - [ ] Cholesky (por bloques, unicidad, algoritmo 3×3)
  - [ ] QR (Gram-Schmidt clásico/modificado, Householder)
  - [ ] SVD (Descomposición en Valores Singulares)
  - [ ] Mínimos Cuadrados (LSP): ecuaciones normales, vía QR, caso ‖y−αx‖, ajuste constante = media
- [ ] **Tema 4 · Métodos numéricos para sistemas lineales**
  - [ ] Número de condición y estabilidad; cota ‖δx‖/‖x‖ ≤ cond(A)·‖δb‖/‖b‖
  - [ ] Iterativos estacionarios: Jacobi, Gauss-Seidel, Richardson (convergencia ‖T‖<1, EDD)
  - [ ] No estacionarios (SPD): Mínimo Descenso (Cauchy), Gradientes Conjugados, precondicionamiento
  - [ ] Matrices de Hessenberg: LU y algoritmo eficiente (GaussH)

### Temas 5, 6 y 7 → Parcial 3 (5 ago 2026)
- [ ] **Tema 5 · Interpolación polinomial**
  - [ ] Planteamiento del problema
  - [ ] Polinomios de Lagrange
  - [ ] Fórmula de Newton (diferencias divididas)
  - [ ] Spline de interpolación y spline cúbico natural
  - [ ] Aplicaciones
- [ ] **Tema 6 · Ceros de funciones**
  - [ ] Método de Bisección
  - [ ] Iteraciones de punto fijo
  - [ ] Método de Newton y de la Secante
  - [ ] Cálculo multivariable: Newton y métodos tipo Secante (caso de estudio: Broyden)
  - [ ] Aplicaciones
- [ ] **Tema 7 · Algoritmos aleatorizados en Cálculo Científico**
  - [ ] Caso de estudio: Gradiente estocástico

> ℹ️ **Ojo:** mencionaste "temas 5 y 6", pero el **Tercer Parcial incluye también el Tema 7** (algoritmos aleatorizados / gradiente estocástico). Lo dejé dentro del alcance del Parcial 3. Si tu profe lo excluye este semestre, lo quito.

> 📌 **Talleres (30% de la nota):** SVD en compresión de imágenes · SVD+PCA en genética · Diferencias finitas (ec. del calor) · PageRank · Modelización de epidemias · RBF · red neuronal. No son "temas de parcial" pero pesan en la evaluación.

---

## 3. Seguridad en Redes de Computadoras (UCV — código 6022)

**Meta (confirmada):** estudiar **todos los conceptos de todas las unidades**, **en orden (Tema 1 → Tema 6)**. No hay prioridad especial: se avanza secuencialmente desde el principio.
**Material disponible:** `docs/seguridad/` — programa oficial (`Nota-Informativa-SRC.pdf`) y **Tareas 1–7 ya entregadas**.
**Evaluación:** Proyecto 25% · Parciales 40% · Exposición 20% · Tareas 15%.

### Temario oficial (6 unidades)
- [ ] **1. Fundamentos:** servicios, mecanismos y ataques; características (Confidencialidad, Autenticación, Integridad, No repudio, Control de Acceso, Disponibilidad); arquitectura de seguridad OSI
- [ ] **2. Amenazas y Ataques:** interrupción/intercepción/modificación/fabricación; ataques pasivos y activos; intrusos y detección (auditoría, estadística, reglas); virus/gusanos; sistemas confiables
- [ ] **3. Criptología simétrica:** criptosistemas y criptoanálisis; técnicas clásicas (sustitución, transposición, rotación, esteganografía); criptoanálisis diferencial/lineal; distribución de claves
- [ ] **4. Criptología asimétrica (clave pública):** modelos, requerimientos y aplicaciones; criptoanálisis; distribución de claves públicas
- [ ] **5. Integridad, Autenticación y Firmas digitales:** MAC, funciones hash, firma digital directa/arbitrada, protocolos de autenticación, certificados digitales
- [ ] **6. Seguridad inalámbrica e IP:** 802.11x, WEP y sus vulnerabilidades; Bluetooth; IPsec (cabeceras de autenticación y encapsulación)

> **Orden de estudio:** 1 → 2 → 3 → 4 → 5 → 6 (secuencial, empezando desde abajo).
> ❓ **Recordatorio, no bloqueante:** el **Proyecto** es obligatorio para aprobar (25%). Cuando sepas el tema, lo agregamos como hito aparte.

---

## 4. Computación en la Nube — AWS Solutions Architect Associate (SAA-C03)

**Meta (confirmada):** estudiar **los temas de la certificación SAA-C03, en el orden del curso, hasta *antes* de entrar con las bases de datos en la nube**. Todo lo que viene desde bases de datos en adelante queda **fuera de alcance por ahora**.
**Material disponible:** `docs/nube/` — guía de estudio propia (`GUIA_ESTUDIO_AWS_SAA.pdf`) + slides oficiales AWS SAA v4/v47.

### En alcance — antes de bases de datos

**Ya cubierto en tu guía actual:**
- [ ] Cloud Computing: 5 pilares NIST, modelos de despliegue/servicio (IaaS/PaaS/SaaS), CAPEX→OPEX
- [ ] Infraestructura global: Regiones, AZs, Edge Locations
- [ ] **IAM**: usuarios/grupos/roles, políticas JSON, mínimo privilegio, MFA, CLI/SDK, buenas prácticas
- [ ] **EC2**: tipos de instancia, User Data, Security Groups, SSH, opciones de compra (On-Demand/Reserved/Spot/Savings/Dedicated/Capacity)
- [ ] EC2 redes: IP pública/privada/elástica, Placement Groups, ENI, hibernación
- [ ] **EBS**: snapshots, AMI, Instance Store, tipos de volumen (GP2/3, IO1/2, ST1, SC1), cifrado
- [ ] **ELB**: ALB / NLB / GWLB, sticky sessions, cross-zone, SSL/TLS + SNI, connection draining
- [ ] **ASG**: launch template, políticas de escalado (dynamic/scheduled/predictive), CloudWatch

**Falta agregar — SÍ están en alcance (hay que ampliar la guía):**
- [ ] **S3** — almacenamiento de objetos: buckets, versionado, cifrado, políticas de bucket, static hosting, replicación — *muy preguntado en el examen*
- [ ] **EFS** y comparativa de almacenamiento (EBS vs. EFS vs. Instance Store)
- [ ] *(Frontera confirmada):* el estudio se detiene justo al llegar a la sección de **bases de datos** (RDS/Aurora/etc.).

### Fuera de alcance por ahora (desde bases de datos en adelante)
_No estudiar todavía — anotados solo para referencia:_
RDS / Aurora / ElastiCache / DynamoDB · Route 53 · CloudFront · VPC (avanzado) · Lambda / API Gateway / ECS / Fargate · SQS / SNS / Kinesis · KMS / WAF / Shield · Well-Architected Framework.

---

## Preguntas abiertas (lo que aún falta para cerrar el plan)

1. **Fechas nuevas:** cuando el profe publique el cronograma de septiembre, actualizamos los hitos de cada materia.
2. **Seguridad:** tema del **Proyecto** obligatorio (25%), cuando lo tengas.
3. **Distribución de tiempo:** ¿cuántas horas/semana por materia y en qué orden semanal prefieres atacarlas?

### Ya confirmado ✅
- **Inglés (A2):** dominar el modelo de examen de memoria + poder resolver variantes.
- **Cálculo (6109):** Temas 3-4 (Parcial 2) y 5-6-7 (Parcial 3), aprender todo en la ventana jul–ago.
- **Seguridad:** todas las unidades, en orden 1→6.
- **Nube:** certificación SAA-C03 hasta antes de bases de datos (incluye S3 y EFS).
- **Calendario:** clases se reanudan en septiembre 2026 (post-terremoto); jul–ago = estudio anticipado.

---

*Plan de contenidos cerrado. Próximo paso: convertir este temario en el modelo de datos de las SubjectCards del dashboard (con progreso por checkbox).*
