// Bancos de tests (opción múltiple) por item.
// Solo Inglés y Seguridad (Cálculo se practica con ejercicios de desarrollo).
// Inglés: preguntas reales del modelo de examen (docs/ingles/examen_ocr.txt).
// `answer` = índice de la opción correcta. Cortos a propósito (2–4 por tema).

export const QUIZZES = {
  // ─────────── Inglés (modelo de examen) ───────────
  'en-g6': [
    { q: '"The train ___ left."', options: ['Has', 'Have'], answer: 0 },
    { q: '"The movie ___ started when we got to the theater."', options: ['Have', 'Had'], answer: 1 },
    { q: '"We have finished the job. The job ___ been finished."', options: ['Have', 'Has'], answer: 1 }
  ],
  'en-g7': [
    { q: '"If I study English, I ___ pass the test."', options: ['Will', 'Would'], answer: 0 },
    { q: '"If I had a car, I ___ visit you."', options: ['Will', 'Would'], answer: 1 },
    { q: '"If I ___ you, I\'d be more careful."', options: ['Am', 'Were'], answer: 1 },
    { q: '"If I had arrived on time, I ___ not have missed the train."', options: ['Will', 'Would'], answer: 1 }
  ],
  'en-g9': [
    { q: '"People enjoy ___ in cities."', options: ['Living', 'To live'], answer: 0 },
    { q: '"I suggest ___ the bus instead of the subway."', options: ['To take', 'Taking'], answer: 1 },
    { q: '"Alejandro refused ___."', options: ['To leave', 'Leaving'], answer: 0 },
    { q: '"Francisco went back after ___ lunch."', options: ['To eat', 'Eating'], answer: 1 }
  ],
  'en-xa': [
    { q: 'Cobras and mongooses are animals who…', options: ['get along well', 'live peacefully side by side', 'wage war against each other'], answer: 2 },
    { q: 'A coward is a person…', options: ['who can control his fear', 'who is not courageous', 'who likes to fight'], answer: 1 },
    { q: 'The story and its moral…', options: ['are purely fictional', 'apply only to cobras & mongooses', 'reflect relationships among human beings'], answer: 2 }
  ],
  'en-xd': [
    { q: '"There may be excess of blood" →', options: ['Allí puede estar el exceso de sangre', 'Puede haber exceso de sangre', 'Puede estar allí el exceso'], answer: 1 },
    { q: '"The happier the better" →', options: ['Cuanto más feliz mejor', 'Cuanto mayor la felicidad mejor', 'El más feliz es el mejor'], answer: 0 },
    { q: '"They develop slowly" →', options: ['El desarrollo es lento', 'Lo desarrollan lentamente', 'Se desarrollan lentamente'], answer: 2 }
  ],
  'en-v4': [
    { q: '"He stopped the car safely using the hand ___."', options: ['brake', 'break'], answer: 0 },
    { q: '"If you have a ___ in the chest, see a doctor."', options: ['pane', 'pain'], answer: 1 },
    { q: '"Come and sit down ___ me."', options: ['beside', 'besides'], answer: 0 }
  ],
  'en-xg': [
    { q: 'An addition connector is:', options: ['If', 'First', 'Furthermore', 'For example'], answer: 2 },
    { q: 'A result connector is:', options: ['Therefore', 'Unlike', 'And', 'In short'], answer: 0 },
    { q: 'El phrasal verb de "Admirar" es:', options: ['Get Up To', 'Get Along Well', 'Looking Forward To', 'Look Up To'], answer: 3 }
  ],

  // ─────────── Seguridad en Redes (conceptos por unidad) ───────────
  'se-u1': [
    { q: '¿Cuál NO es una característica de seguridad de la información?', options: ['Confidencialidad', 'Integridad', 'Compresión', 'Disponibilidad'], answer: 2 },
    { q: 'El servicio que impide al emisor negar haber enviado un mensaje es:', options: ['Autenticación', 'No repudio', 'Control de acceso', 'Disponibilidad'], answer: 1 },
    { q: 'La arquitectura de seguridad se define sobre el modelo:', options: ['TCP/IP', 'OSI', 'Cliente-servidor', 'P2P'], answer: 1 }
  ],
  'se-u2': [
    { q: 'Un ataque que solo observa/escucha sin alterar el mensaje es:', options: ['Activo', 'Pasivo', 'De fabricación', 'De modificación'], answer: 1 },
    { q: 'La "Modificación" del mensaje atenta principalmente contra:', options: ['Confidencialidad', 'Integridad', 'Disponibilidad', 'Autenticación'], answer: 1 },
    { q: 'Un programa que se replica y propaga por la red por sí solo es un:', options: ['Virus', 'Troyano', 'Gusano', 'Rootkit'], answer: 2 }
  ],
  'se-u3': [
    { q: 'En el cifrado simétrico, emisor y receptor usan:', options: ['Claves distintas', 'La misma clave', 'Solo clave pública', 'Ninguna clave'], answer: 1 },
    { q: 'La técnica que reordena las posiciones de los caracteres es:', options: ['Sustitución', 'Transposición', 'Esteganografía', 'Hashing'], answer: 1 },
    { q: 'El cifrado César es un ejemplo de técnica de:', options: ['Sustitución', 'Transposición', 'Compresión', 'Firma'], answer: 0 }
  ],
  'se-u4': [
    { q: 'Para lograr confidencialidad con clave pública, se cifra con la clave:', options: ['Privada del emisor', 'Pública del receptor', 'Privada del receptor', 'Pública del emisor'], answer: 1 },
    { q: 'Para firmar un mensaje se cifra con la clave:', options: ['Pública del receptor', 'Privada del emisor', 'Pública del emisor', 'Simétrica compartida'], answer: 1 },
    { q: 'RSA es un ejemplo de criptosistema:', options: ['Simétrico', 'Asimétrico', 'De flujo', 'De bloque simétrico'], answer: 1 }
  ],
  'se-u5': [
    { q: 'Una función hash criptográfica produce:', options: ['Un resumen de longitud fija', 'Texto cifrado reversible', 'Una clave pública', 'Un certificado'], answer: 0 },
    { q: 'Un MAC (código de autenticación de mensaje) provee:', options: ['Solo confidencialidad', 'Autenticación e integridad', 'Solo compresión', 'No repudio por sí solo'], answer: 1 },
    { q: 'Un certificado digital es emitido por:', options: ['El propio usuario', 'Una Autoridad de Certificación (CA)', 'El ISP', 'El servidor DNS'], answer: 1 }
  ],
  'se-u6': [
    { q: 'El protocolo de cifrado original (e inseguro) de 802.11 es:', options: ['WPA2', 'WEP', 'TLS', 'IPsec'], answer: 1 },
    { q: 'En IPsec, la autenticación del origen se provee con la cabecera:', options: ['ESP', 'AH', 'TCP', 'GRE'], answer: 1 },
    { q: 'El estándar de referencia de redes inalámbricas (WiFi) es:', options: ['802.3', '802.11', '802.15', '802.1Q'], answer: 1 }
  ],

  // ─────────── Cálculo Científico (teoría estilo parcial) ───────────
  // Solo conceptuales/propiedades; los ejercicios numéricos van en la pestaña Ejercicios.
  'ca-t3-orto': [
    { q: 'La matriz de Householder H es:', options: ['Simétrica y ortogonal', 'Antisimétrica', 'Triangular superior', 'Diagonal'], answer: 0 },
    { q: 'Que H sea involutoria significa que:', options: ['H² = I (H⁻¹ = H)', 'H² = 0', 'H = I', 'det(H) = 0'], answer: 0 },
    { q: 'El producto de dos matrices ortogonales es:', options: ['Ortogonal', 'Singular', 'Triangular', 'Simétrica siempre'], answer: 0 }
  ],
  'ca-t3-lu': [
    { q: 'La factorización LU sin pivoteo puede fallar si:', options: ['Aparece un pivote nulo', 'La matriz es cuadrada', 'La matriz es densa', 'Siempre existe'], answer: 0 },
    { q: 'El producto de dos matrices triangulares inferiores es:', options: ['Triangular inferior', 'Triangular superior', 'Diagonal', 'Ortogonal'], answer: 0 }
  ],
  'ca-t3-chol': [
    { q: 'La factorización de Cholesky existe para matrices:', options: ['Simétricas definidas positivas (SPD)', 'Cualquier matriz cuadrada', 'Solo triangulares', 'Singulares'], answer: 0 },
    { q: 'Cholesky descompone A como:', options: ['A = LLᵀ', 'A = LU', 'A = QR', 'A = UΣVᵀ'], answer: 0 }
  ],
  'ca-t3-qr': [
    { q: 'Para mayor estabilidad numérica, QR se calcula preferentemente con:', options: ['Householder', 'Gram-Schmidt clásico', 'Eliminación gaussiana', 'Bisección'], answer: 0 },
    { q: 'En A = QR, la matriz Q es ___ y R es ___:', options: ['Q ortogonal, R triangular superior', 'Q triangular, R diagonal', 'Q simétrica, R ortogonal', 'Q diagonal, R inferior'], answer: 0 }
  ],
  'ca-t3-svd': [
    { q: 'En la SVD A = UΣVᵀ, los valores singulares son:', options: ['Reales no negativos', 'Negativos', 'Complejos', 'Siempre enteros'], answer: 0 },
    { q: 'Las columnas de U y de V son:', options: ['Ortonormales', 'Linealmente dependientes', 'Triangulares', 'Nulas'], answer: 0 }
  ],
  'ca-t3-lsp': [
    { q: 'En mínimos cuadrados, el residuo óptimo r = b − Ax es ___ al espacio columna de A:', options: ['Ortogonal', 'Paralelo', 'Igual', 'Proporcional'], answer: 0 },
    { q: 'Las ecuaciones normales del problema de mínimos cuadrados son:', options: ['AᵀA x = Aᵀb', 'A x = b', 'AAᵀ x = b', 'Aᵀx = b'], answer: 0 },
    { q: 'La constante α que minimiza ‖y − α·1‖₂ es:', options: ['La media aritmética de y', 'La mediana', 'El máximo', 'Cero'], answer: 0 }
  ],
  'ca-t4-cond': [
    { q: 'Un número de condición cond(A) muy grande indica que el sistema está:', options: ['Mal condicionado', 'Bien condicionado', 'Es singular seguro', 'Es ortogonal'], answer: 0 }
  ],
  'ca-t4-iter': [
    { q: 'El método de Jacobi converge si la matriz es:', options: ['Estrictamente diagonal dominante (EDD)', 'Singular', 'Triangular', 'Antisimétrica'], answer: 0 },
    { q: 'Un esquema iterativo x = Bx + d converge (para todo x₀) si:', options: ['‖B‖ < 1', '‖B‖ > 1', '‖B‖ = 1', 'B es singular'], answer: 0 }
  ],
  'ca-t4-noest': [
    { q: 'El método de Gradientes Conjugados se aplica a matrices:', options: ['Simétricas definidas positivas (SPD)', 'Cualquier matriz', 'Singulares', 'Triangulares'], answer: 0 },
    { q: 'En Mínimo Descenso, el residuo r_{k+1} es ___ a r_k:', options: ['Ortogonal', 'Paralelo', 'Igual', 'Opuesto en norma'], answer: 0 }
  ],
  'ca-t5-lagr': [
    { q: 'El polinomio de grado ≤ n que interpola n+1 puntos con abscisas distintas es:', options: ['Único', 'Infinitos posibles', 'Inexistente', 'Siempre de grado n exacto'], answer: 0 }
  ],
  'ca-t6-bisec': [
    { q: 'El método de bisección requiere que en el intervalo [a, b] se cumpla:', options: ['f(a)·f(b) < 0', 'f(a)·f(b) > 0', 'f(a) = f(b)', 'f\'(a) = 0'], answer: 0 }
  ],
  'ca-t6-newton': [
    { q: 'Cerca de una raíz simple, el método de Newton converge de forma:', options: ['Cuadrática', 'Lineal', 'Logarítmica', 'No converge'], answer: 0 }
  ]
};

export function getQuiz(itemId) {
  return QUIZZES[itemId] || null;
}
