const { dashboardRepository } = require('./repository');
const { createError } = require('../middleware/errorHandler');
const debug = require('debug')('app:dashboard-service');

// Una sola llamada arma toda la portada de la intranet
const resumen = async usuarioId => {
  try {
    const [
      indicadores,
      comunicados,
      eventos,
      documentos,
      porDepartamento,
    ] = await Promise.all([
      dashboardRepository.indicadores(usuarioId),
      dashboardRepository.ultimosComunicados(usuarioId, 5),
      dashboardRepository.proximosEventos(5),
      dashboardRepository.documentosRecientes(5),
      dashboardRepository.colaboradoresPorDepartamento(),
    ]);

    return {
      indicadores,
      ultimosComunicados: comunicados,
      proximosEventos: eventos,
      documentosRecientes: documentos,
      colaboradoresPorDepartamento: porDepartamento,
    };
  } catch (error) {
    debug('Error armando el resumen:', error);
    throw createError('Error al obtener el resumen de la intranet', 500);
  }
};

const indicadores = async usuarioId => {
  try {
    return await dashboardRepository.indicadores(usuarioId);
  } catch (error) {
    debug('Error obteniendo indicadores:', error);
    throw createError('Error al obtener los indicadores', 500);
  }
};

module.exports.dashboardService = {
  resumen,
  indicadores,
};
