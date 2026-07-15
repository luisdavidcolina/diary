# Plan de Estudio — Borrador

> Documento generado a partir del análisis de todo el material en `docs/`.
> **Objetivo:** que revises si falta algún tema o si hay cosas de más.
> Marca con ✅ lo dominado, ✏️ lo que quieras ajustar, y ❓ donde tengas dudas.

**Plazo global (según README):** dominar todo el plan en **2 meses**.
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

## 2. Cálculo Científico I (UCV)

**Estado:** Parcial 1 ya presentado. **Meta:** preparar los **2 parciales restantes** (Parcial 2 y Parcial 3).
**Material disponible:** `docs/calculo/` — resumen teórico-práctico y soluciones detalladas en LaTeX (Parcial2), exámenes/quices históricos (2016–2025), prácticas, libros (Kincaid & Cheney, Watkins).

### Bloque Parcial 2 — Factorizaciones y sistemas lineales
- [ ] **Matrices ortogonales** y matrices de Householder (propiedades P1–P9)
- [ ] **Factorización LU** (con/sin pivoteo parcial PA=LU, tridiagonales, unicidad)
- [ ] **Factorización de Cholesky** (por bloques, unicidad, algoritmo 3×3)
- [ ] **Factorización QR** (Gram-Schmidt clásico/modificado, Householder)
- [ ] **SVD** (Descomposición en Valores Singulares — algoritmo y cálculo)
- [ ] **Mínimos Cuadrados (LSP)**: ecuaciones normales, resolución vía QR, caso ‖y−αx‖, ajuste constante = media
- [ ] **Número de condición** y estabilidad; cota ‖δx‖/‖x‖ ≤ cond(A)·‖δb‖/‖b‖
- [ ] **Métodos iterativos estacionarios**: Jacobi, Gauss-Seidel, Richardson (convergencia ‖T‖<1, EDD)
- [ ] **Métodos no estacionarios (SPD)**: Mínimo Descenso (Cauchy), Gradientes Conjugados, precondicionamiento
- [ ] Matrices de Hessenberg: LU y algoritmo eficiente (GaussH)

> ❓ **Duda para ti:** ¿el Parcial 2 y el Parcial 3 cubren temas distintos, o el "Parcial 3" es re-evaluación del mismo bloque? El material de `Parcial 3/` parece centrarse en SVD + iterativos. Confírmame el temario oficial de cada uno.

---

## 3. Seguridad en Redes de Computadoras (UCV — código 6022)

**Meta:** dominar conceptos fundamentales.
**Material disponible:** `docs/seguridad/` — programa oficial (`Nota-Informativa-SRC.pdf`) y **Tareas 1–7 ya entregadas**.
**Evaluación:** Proyecto 25% · Parciales 40% · Exposición 20% · Tareas 15%.

### Temario oficial (6 unidades)
- [ ] **1. Fundamentos:** servicios, mecanismos y ataques; características (Confidencialidad, Autenticación, Integridad, No repudio, Control de Acceso, Disponibilidad); arquitectura de seguridad OSI
- [ ] **2. Amenazas y Ataques:** interrupción/intercepción/modificación/fabricación; ataques pasivos y activos; intrusos y detección (auditoría, estadística, reglas); virus/gusanos; sistemas confiables
- [ ] **3. Criptología simétrica:** criptosistemas y criptoanálisis; técnicas clásicas (sustitución, transposición, rotación, esteganografía); criptoanálisis diferencial/lineal; distribución de claves
- [ ] **4. Criptología asimétrica (clave pública):** modelos, requerimientos y aplicaciones; criptoanálisis; distribución de claves públicas
- [ ] **5. Integridad, Autenticación y Firmas digitales:** MAC, funciones hash, firma digital directa/arbitrada, protocolos de autenticación, certificados digitales
- [ ] **6. Seguridad inalámbrica e IP:** 802.11x, WEP y sus vulnerabilidades; Bluetooth; IPsec (cabeceras de autenticación y encapsulación)

> ❓ **Duda para ti:** ¿en qué unidad(es) estás ahora y cuál es el estado del **Proyecto** (obligatorio para aprobar)? Las Tareas 1–7 cubren, presumiblemente, las primeras unidades — dime hasta dónde llegaron.

---

## 4. Computación en la Nube — AWS Solutions Architect Associate (SAA-C03)

**Meta:** dominar teoría y práctica (basado en el curso de Stéphane Maarek).
**Material disponible:** `docs/nube/` — guía de estudio propia (`GUIA_ESTUDIO_AWS_SAA.pdf`) + slides oficiales AWS SAA v4/v47.

### Cubierto en tu guía actual
- [ ] Cloud Computing: 5 pilares NIST, modelos de despliegue/servicio (IaaS/PaaS/SaaS), CAPEX→OPEX
- [ ] Infraestructura global: Regiones, AZs, Edge Locations
- [ ] **IAM**: usuarios/grupos/roles, políticas JSON, mínimo privilegio, MFA, CLI/SDK, buenas prácticas
- [ ] **EC2**: tipos de instancia, User Data, Security Groups, SSH, opciones de compra (On-Demand/Reserved/Spot/Savings/Dedicated/Capacity)
- [ ] EC2 redes: IP pública/privada/elástica, Placement Groups, ENI, hibernación
- [ ] **EBS**: snapshots, AMI, Instance Store, tipos de volumen (GP2/3, IO1/2, ST1, SC1), cifrado
- [ ] **ELB**: ALB / NLB / GWLB, sticky sessions, cross-zone, SSL/TLS + SNI, connection draining
- [ ] **ASG**: launch template, políticas de escalado (dynamic/scheduled/predictive), CloudWatch

### ⚠️ Temas del examen SAA-C03 que **NO** están en tu guía (posibles huecos)
El examen oficial abarca bastante más de lo cubierto. Si tu meta es certificarte, faltaría:
- [ ] **S3** (almacenamiento de objetos, versionado, cifrado, políticas) — *muy preguntado*
- [ ] **RDS / Aurora / DynamoDB / ElastiCache** (bases de datos)
- [ ] **VPC** (subnets, route tables, NAT, IGW, NACL, peering, endpoints) — *núcleo del examen*
- [ ] **Route 53** (DNS, routing policies)
- [ ] **CloudFront** (CDN)
- [ ] **Lambda / API Gateway / ECS / Fargate** (serverless y contenedores)
- [ ] **SQS / SNS / Kinesis** (mensajería y streaming)
- [ ] **CloudWatch / CloudTrail / Config** (monitoreo)
- [ ] **KMS / Secrets Manager / WAF / Shield** (seguridad)
- [ ] Storage: EFS, FSx, Storage Gateway
- [ ] Well-Architected Framework

> ❓ **Duda para ti:** ¿tu objetivo es **aprobar la materia de la universidad** o **sacar la certificación SAA-C03** oficial? Si es la certificación, hay que ampliar bastante la guía (sobre todo S3 y VPC). Dime y priorizo.

---

## Preguntas abiertas (para afinar el plan)

1. **Fechas concretas:** ¿tienes fechas de cada parcial/examen? El plazo de "2 meses" ¿arranca hoy (2026-07-15)?
2. **Cálculo:** temario oficial de Parcial 2 vs. Parcial 3.
3. **Seguridad:** unidad actual + estado del Proyecto obligatorio.
4. **Nube:** ¿materia universitaria o certificación oficial?
5. **Distribución de tiempo:** ¿cuántas horas/semana puedes dedicar y en qué orden prefieres atacarlas?

---

*Cuando me confirmes qué falta o qué sobra, refino este documento y lo convertimos en el modelo de datos de las SubjectCards del dashboard.*
