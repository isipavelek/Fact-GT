/**
 * Lógica de Calificaciones y Acreditación del Programa "Gen Técnico" (ETRR)
 * 
 * Reglas de negocio:
 * 1. Regla Teórica: 3 notas (Neumática, Electroneumática y PLC). Cada una debe ser >= 6
 *    Y el promedio de las tres debe ser >= 7. Si no se cumple, pasa a "Debe Recuperar".
 * 2. Regla Práctica: Solo si aprobó el teórico, puede rendir el práctico.
 *    Se requiere nota del práctico >= 7 para aprobar.
 * 3. Regla de Acreditación: Si aprobó teórico y práctico, marcar estado como "Acreditado".
 */

/**
 * Calcula el estado académico de un estudiante en base a sus notas.
 * 
 * @param {Object} notasTeorico - Objeto con las notas teóricas del estudiante
 * @param {number|null} notasTeorico.neumatica - Nota de examen de Neumática (1-10)
 * @param {number|null} notasTeorico.electroneumatica - Nota de examen de Electroneumática (1-10)
 * @param {number|null} notasTeorico.plc - Nota de examen de PLC (1-10)
 * @param {number|null} notaPractico - Nota del examen práctico final (1-10)
 * 
 * @returns {Object} Resultado del análisis académico del estudiante
 */
function calcularEstadoEstudiante(notasTeorico, notaPractico, recTeorico, recPractico) {
  const neumatica = notasTeorico ? notasTeorico.neumatica : null;
  const electroneumatica = notasTeorico ? notasTeorico.electroneumatica : null;
  const plc = notasTeorico ? notasTeorico.plc : null;

  const rNeu = recTeorico ? recTeorico.neumatica : null;
  const rEle = recTeorico ? recTeorico.electroneumatica : null;
  const rPlc = recTeorico ? recTeorico.plc : null;

  const nNeu = (rNeu !== null && rNeu !== undefined && rNeu !== '') ? parseFloat(rNeu) : (neumatica !== null && neumatica !== undefined ? parseFloat(neumatica) : null);
  const nEle = (rEle !== null && rEle !== undefined && rEle !== '') ? parseFloat(rEle) : (electroneumatica !== null && electroneumatica !== undefined ? parseFloat(electroneumatica) : null);
  const nPlc = (rPlc !== null && rPlc !== undefined && rPlc !== '') ? parseFloat(rPlc) : (plc !== null && plc !== undefined ? parseFloat(plc) : null);

  // 1. Verificar si faltan notas teóricas para iniciar la evaluación
  const tieneNotasTeoricas = (nNeu !== null && !isNaN(nNeu)) &&
                              (nEle !== null && !isNaN(nEle)) &&
                              (nPlc !== null && !isNaN(nPlc));

  if (!tieneNotasTeoricas) {
    return {
      promedioTeorico: null,
      teoricoAprobado: false,
      estado: "Pendiente",
      acreditado: false,
      detalle: "Faltan cargar notas teóricas para evaluar."
    };
  }

  const promedioTeorico = (nNeu + nEle + nPlc) / 3;
  const promedioTeoricoRedondeado = Math.round(promedioTeorico * 100) / 100;

  // Condición teórica: Cada examen >= 6 Y el promedio >= 7
  const cumpleNotasIndividuales = nNeu >= 6 && nEle >= 6 && nPlc >= 6;
  const teoricoAprobado = cumpleNotasIndividuales && promedioTeoricoRedondeado >= 7;

  // 2. Si no aprobó el teórico
  if (!teoricoAprobado) {
    const tieneRecCargado = (rNeu !== null && rNeu !== '') || (rEle !== null && rEle !== '') || (rPlc !== null && rPlc !== '');
    let detalle = "No cumple con los requisitos teóricos.";
    if (!cumpleNotasIndividuales) {
      detalle += " Tiene al menos una nota teórica menor a 6.";
    }
    if (promedioTeoricoRedondeado < 7) {
      detalle += " El promedio teórico es menor a 7.";
    }
    return {
      promedioTeorico: promedioTeoricoRedondeado,
      teoricoAprobado: false,
      estado: tieneRecCargado ? "No Aprobado (Rec. Agotado)" : "Debe Recuperar Teórico",
      acreditado: false,
      detalle: detalle
    };
  }

  // 3. Si aprobó el teórico, evaluar el práctico
  const activePrac = (recPractico !== null && recPractico !== undefined && recPractico !== '') ? parseFloat(recPractico) : (notaPractico !== null && notaPractico !== undefined ? parseFloat(notaPractico) : null);
  const tieneNotaPractico = (activePrac !== null && !isNaN(activePrac));

  if (!tieneNotaPractico) {
    return {
      promedioTeorico: promedioTeoricoRedondeado,
      teoricoAprobado: true,
      estado: "Pendiente Práctico",
      acreditado: false,
      detalle: "Teórico aprobado. Pendiente de realizar examen práctico."
    };
  }

  const practicoAprobado = activePrac >= 7;

  if (practicoAprobado) {
    return {
      promedioTeorico: promedioTeoricoRedondeado,
      teoricoAprobado: true,
      estado: "Acreditado",
      acreditado: true,
      detalle: "Estudiante acreditado exitosamente."
    };
  } else {
    const tieneRecPrac = (recPractico !== null && recPractico !== '');
    return {
      promedioTeorico: promedioTeoricoRedondeado,
      teoricoAprobado: true,
      estado: tieneRecPrac ? "No Aprobado (Rec. Agotado)" : "Debe Recuperar Práctico",
      acreditado: false,
      detalle: "Teórico aprobado, pero reprobó el examen práctico (nota menor a 7)."
    };
  }
}

// Exportar la función si se utiliza en entorno Node/ES Modules
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = { calcularEstadoEstudiante };
}
