import { Market } from '../types/market';

export const markets: Market[] = [
  // ECONOMÍA ARGENTINA (8 mercados)
  {
    id: '1',
    title: '¿El dólar blue superará $1,500 antes de julio 2026?',
    description: `El mercado del dólar paralelo o "blue" en Argentina ha sido históricamente volátil. Con las recientes medidas económicas del gobierno y las expectativas de inflación, los analistas debaten si la brecha cambiaria se ampliará nuevamente.

Este mercado se resolverá como SÍ si en cualquier momento antes del 1 de julio de 2026, el precio de venta del dólar blue alcanza o supera los $1,500 ARS según la cotización promedio reportada por al menos 3 fuentes confiables (ámbito.com, dolarblue.net, infodolar.com).

Factores a considerar: política monetaria del BCRA, acuerdos con el FMI, estacionalidad de la demanda, y el contexto electoral de 2025.`,
    category: 'economia',
    probability: 68,
    volume: '$15.1K',
    participants: 234,
    endDate: '2026-07-01',
    status: 'active',
    history: [
      { date: '2026-02-15', probability: 45 },
      { date: '2026-02-22', probability: 52 },
      { date: '2026-03-01', probability: 58 },
      { date: '2026-03-08', probability: 63 },
      { date: '2026-03-15', probability: 68 },
    ],
    relatedMarkets: ['2', '3'],
  },
  {
    id: '2',
    title: 'Inflación de Argentina en marzo 2026 será mayor al 10%',
    description: `La inflación mensual en Argentina ha mostrado señales de desaceleración tras el shock inicial de la gestión Milei. Sin embargo, presiones estacionales y ajustes de tarifas podrían generar un rebote inflacionario en el primer trimestre de 2026.

Este mercado se resolverá según el dato oficial del INDEC para la inflación mensual de marzo 2026. Se considerará SÍ si el índice es 10.0% o superior.

Variables clave: dinámica salarial, estacionalidad educativa, tarifas de servicios públicos, y tipo de cambio.`,
    category: 'economia',
    probability: 34,
    volume: '$8.7K',
    participants: 187,
    endDate: '2026-04-10',
    status: 'active',
    history: [
      { date: '2026-02-20', probability: 28 },
      { date: '2026-02-27', probability: 30 },
      { date: '2026-03-06', probability: 32 },
      { date: '2026-03-13', probability: 34 },
    ],
    relatedMarkets: ['1', '4'],
  },
  {
    id: '3',
    title: 'Reservas del BCRA superarán U$S 35.000M en junio 2026',
    description: `Las reservas internacionales del Banco Central son un indicador crucial de la salud económica argentina. Después de años de caída, la actual gestión apunta a reconstruirlas mediante superávit comercial y acuerdos internacionales.

Resolución: Este mercado se resolverá como SÍ si al 30 de junio de 2026, las reservas internacionales brutas del BCRA son iguales o superiores a U$S 35.000 millones según el balance oficial publicado.

Factores: liquidación de agro, acuerdo con FMI, vencimientos de deuda, y política cambiaria.`,
    category: 'economia',
    probability: 52,
    volume: '$12.3K',
    participants: 156,
    endDate: '2026-06-30',
    status: 'active',
    history: [
      { date: '2026-02-10', probability: 45 },
      { date: '2026-02-24', probability: 48 },
      { date: '2026-03-10', probability: 50 },
      { date: '2026-03-17', probability: 52 },
    ],
    relatedMarkets: ['1', '5'],
  },
  {
    id: '4',
    title: 'Argentina cumplirá metas fiscales del FMI en Q1 2026',
    description: `El acuerdo con el Fondo Monetario Internacional establece metas trimestrales de déficit fiscal primario. El cumplimiento de estas metas es crucial para mantener el flujo de desembolsos y la credibilidad externa.

Este mercado se resolverá como SÍ si Argentina cumple con todas las metas fiscales establecidas en el acuerdo con el FMI para el primer trimestre de 2026, según el informe oficial del organismo.

Consideraciones: recaudación tributaria, gasto público, subsidios energéticos, y transferencias a provincias.`,
    category: 'economia',
    probability: 71,
    volume: '$9.4K',
    participants: 143,
    endDate: '2026-05-15',
    status: 'active',
    history: [
      { date: '2026-02-05', probability: 65 },
      { date: '2026-02-19', probability: 68 },
      { date: '2026-03-05', probability: 70 },
      { date: '2026-03-18', probability: 71 },
    ],
    relatedMarkets: ['3', '5'],
  },
  {
    id: '5',
    title: 'Riesgo país de Argentina caerá por debajo de 700 puntos',
    description: `El riesgo país es un indicador clave de la confianza internacional en Argentina. Tras el pico de 2020, ha mostrado mejoras pero se mantiene en niveles históricamente altos.

Resolución: Se considera SÍ si el índice EMBI+ Argentina (Riesgo País) cierra por debajo de 700 puntos básicos en cualquier día antes del 31 de agosto de 2026, según datos de JP Morgan.

Variables relevantes: relación con FMI, acceso a mercados, política económica, y contexto regional.`,
    category: 'economia',
    probability: 46,
    volume: '$7.8K',
    participants: 129,
    endDate: '2026-08-31',
    status: 'active',
    history: [
      { date: '2026-02-12', probability: 38 },
      { date: '2026-02-26', probability: 41 },
      { date: '2026-03-12', probability: 44 },
      { date: '2026-03-18', probability: 46 },
    ],
    relatedMarkets: ['3', '4'],
  },
  {
    id: '6',
    title: 'Precio del petróleo Brent superará U$S 100 en 2026',
    description: `El precio internacional del petróleo impacta directamente en la economía argentina, tanto por el costo de importación de combustibles como por las exportaciones de Vaca Muerta.

Este mercado se resolverá como SÍ si el precio del barril de petróleo Brent supera los U$S 100 en cualquier cierre diario durante 2026, según datos de ICE Futures Europe.

Factores: geopolítica en Medio Oriente, decisiones de OPEP+, demanda china, y transición energética global.`,
    category: 'economia',
    probability: 29,
    volume: '$11.2K',
    participants: 198,
    endDate: '2026-12-31',
    status: 'active',
    history: [
      { date: '2026-01-20', probability: 25 },
      { date: '2026-02-10', probability: 26 },
      { date: '2026-02-25', probability: 28 },
      { date: '2026-03-15', probability: 29 },
    ],
    relatedMarkets: ['7'],
  },
  {
    id: '7',
    title: 'Exportaciones argentinas de energía superarán U$S 15B en 2026',
    description: `El desarrollo de Vaca Muerta y la infraestructura de exportación posicionan a Argentina como potencial exportador energético regional. Este mercado evalúa si las exportaciones consolidadas alcanzarán el objetivo.

Resolución: SÍ si las exportaciones totales de energía (gas, petróleo, derivados) de Argentina en 2026 suman U$S 15.000 millones o más según datos del INDEC.

Consideraciones: producción de Vaca Muerta, gasoductos, plantas de GNL, y precios internacionales.`,
    category: 'economia',
    probability: 58,
    volume: '$6.9K',
    participants: 112,
    endDate: '2027-02-28',
    status: 'active',
    history: [
      { date: '2026-02-01', probability: 50 },
      { date: '2026-02-15', probability: 53 },
      { date: '2026-03-01', probability: 56 },
      { date: '2026-03-18', probability: 58 },
    ],
    relatedMarkets: ['6'],
  },
  {
    id: '8',
    title: 'Salario real en Argentina crecerá más de 5% interanual en 2026',
    description: `Tras años de pérdida de poder adquisitivo, existe debate sobre si 2026 marcará una recuperación significativa del salario real, considerando la dinámica de salarios nominales e inflación.

Este mercado se resolverá como SÍ si el índice de salarios reales del INDEC muestra un incremento interanual mayor al 5% en el promedio de 2026 vs 2025.

Variables: paritarias, inflación, formalización laboral, y crecimiento económico.`,
    category: 'economia',
    probability: 41,
    volume: '$5.6K',
    participants: 94,
    endDate: '2027-03-15',
    status: 'active',
    history: [
      { date: '2026-02-18', probability: 35 },
      { date: '2026-03-04', probability: 38 },
      { date: '2026-03-18', probability: 41 },
    ],
    relatedMarkets: ['2'],
  },

  // POLÍTICA LATAM (8 mercados)
  {
    id: '9',
    title: 'Milei mantendrá aprobación superior al 50% hasta junio 2026',
    description: `La aprobación presidencial es un indicador clave de capital político. Javier Milei inició su gestión con alta popularidad, pero enfrenta desafíos de implementación de reformas que podrían erosionar su apoyo.

Resolución: SÍ si el promedio de encuestas de imagen positiva de Milei se mantiene en 50% o más en cada mes desde marzo hasta junio 2026 (promedio de al menos 3 consultoras reconocidas).

Factores: situación económica, efectividad de políticas, unidad del oficialismo, y contexto electoral 2025.`,
    category: 'politica',
    probability: 48,
    volume: '$13.5K',
    participants: 267,
    endDate: '2026-07-05',
    status: 'active',
    history: [
      { date: '2026-02-08', probability: 55 },
      { date: '2026-02-22', probability: 52 },
      { date: '2026-03-08', probability: 50 },
      { date: '2026-03-18', probability: 48 },
    ],
    relatedMarkets: ['10', '11'],
  },
  {
    id: '10',
    title: 'La Ley de Bases será aprobada en el Congreso antes de mayo 2026',
    description: `La llamada "Ley Ómnibus" o Ley de Bases es la principal reforma legislativa del gobierno de Milei. Su aprobación depende de negociaciones con bloques provinciales y moderados.

Este mercado se resolverá como SÍ si la Ley de Bases (o una versión con más del 60% del articulado original) es aprobada por ambas cámaras antes del 1 de mayo de 2026.

Variables: negociación con gobernadores, unidad opositora, presión social, y urgencia económica.`,
    category: 'politica',
    probability: 62,
    volume: '$10.8K',
    participants: 189,
    endDate: '2026-05-01',
    status: 'active',
    history: [
      { date: '2026-02-10', probability: 58 },
      { date: '2026-02-24', probability: 60 },
      { date: '2026-03-10', probability: 61 },
      { date: '2026-03-18', probability: 62 },
    ],
    relatedMarkets: ['9', '12'],
  },
  {
    id: '11',
    title: 'Elecciones México 2024: Claudia Sheinbaum ganará presidencia',
    description: `México celebra elecciones presidenciales en 2024. Claudia Sheinbaum, candidata oficialista de Morena, lidera las encuestas pero enfrenta desafíos de seguridad y economía.

Resolución: SÍ si Claudia Sheinbaum es oficialmente declarada ganadora de las elecciones presidenciales de México 2024 por el Instituto Nacional Electoral (INE).

Nota: Este mercado ya se resolvió históricamente - ejemplo de mercado cerrado.`,
    category: 'politica',
    probability: 95,
    volume: '$28.4K',
    participants: 512,
    endDate: '2024-06-03',
    status: 'resolved',
    history: [
      { date: '2024-03-01', probability: 72 },
      { date: '2024-04-01', probability: 78 },
      { date: '2024-05-01', probability: 85 },
      { date: '2024-06-01', probability: 92 },
      { date: '2024-06-03', probability: 95 },
    ],
    relatedMarkets: ['12'],
  },
  {
    id: '12',
    title: 'Brasil aprobará reforma tributaria completa antes de julio 2026',
    description: `Brasil está en proceso de aprobar una reforma tributaria histórica que simplificaría el complejo sistema de impuestos indirectos. La implementación total requiere consenso federal y estatal.

Este mercado se resolverá como SÍ si la reforma tributaria brasileña (unificación de IVA) es completamente aprobada por el Congreso y estados antes del 1 de julio de 2026.

Consideraciones: negociación con estados, lobby sectorial, plazos de transición, y voluntad política.`,
    category: 'politica',
    probability: 54,
    volume: '$9.1K',
    participants: 147,
    endDate: '2026-07-01',
    status: 'active',
    history: [
      { date: '2026-02-05', probability: 48 },
      { date: '2026-02-20', probability: 51 },
      { date: '2026-03-10', probability: 53 },
      { date: '2026-03-18', probability: 54 },
    ],
    relatedMarkets: ['13'],
  },
  {
    id: '13',
    title: 'Chile: Aprobación de Boric caerá bajo 25% antes de agosto 2026',
    description: `El presidente chileno Gabriel Boric enfrenta desafíos de seguridad pública, economía y fracaso del proceso constituyente. Su aprobación ha mostrado tendencia a la baja.

Resolución: SÍ si el promedio de encuestas de aprobación de Boric cae por debajo del 25% en cualquier mes antes de agosto 2026 (promedio de Cadem, Criteria y Activa).

Factores clave: seguridad, crecimiento económico, crisis migratoria, y resultados electorales municipales.`,
    category: 'politica',
    probability: 67,
    volume: '$7.3K',
    participants: 134,
    endDate: '2026-08-01',
    status: 'active',
    history: [
      { date: '2026-02-12', probability: 58 },
      { date: '2026-02-26', probability: 62 },
      { date: '2026-03-12', probability: 65 },
      { date: '2026-03-18', probability: 67 },
    ],
    relatedMarkets: ['14'],
  },
  {
    id: '14',
    title: 'Perú tendrá elecciones anticipadas antes de diciembre 2026',
    description: `Perú enfrenta inestabilidad política crónica con múltiples presidentes en pocos años. Existe presión social y política para adelantar elecciones presidenciales.

Este mercado se resolverá como SÍ si se convocan y realizan elecciones presidenciales en Perú antes del 31 de diciembre de 2026, ya sea por renuncia, vacancia, o reforma constitucional.

Variables: presión social, estabilidad del Congreso, escándalos de corrupción, y voluntad de reforma.`,
    category: 'politica',
    probability: 38,
    volume: '$6.8K',
    participants: 118,
    endDate: '2026-12-31',
    status: 'active',
    history: [
      { date: '2026-02-01', probability: 32 },
      { date: '2026-02-15', probability: 34 },
      { date: '2026-03-01', probability: 36 },
      { date: '2026-03-18', probability: 38 },
    ],
    relatedMarkets: ['13'],
  },
  {
    id: '15',
    title: 'Venezuela: Maduro seguirá en el poder hasta diciembre 2026',
    description: `La situación política en Venezuela es altamente polarizada. A pesar de presión internacional y oposición interna, el chavismo ha mantenido el control del ejecutivo.

Resolución: SÍ si Nicolás Maduro permanece como presidente de Venezuela (reconocido o de facto) hasta el 31 de diciembre de 2026.

Factores: presión internacional, situación económica, migración, apoyo militar, y proceso electoral 2024.`,
    category: 'politica',
    probability: 78,
    volume: '$11.7K',
    participants: 203,
    endDate: '2026-12-31',
    status: 'active',
    history: [
      { date: '2026-01-15', probability: 75 },
      { date: '2026-02-15', probability: 76 },
      { date: '2026-03-01', probability: 77 },
      { date: '2026-03-18', probability: 78 },
    ],
    relatedMarkets: [],
  },
  {
    id: '16',
    title: 'Colombia aprobará reforma pensional antes de junio 2026',
    description: `El gobierno de Petro propone una reforma estructural al sistema pensional colombiano, buscando mayor equidad pero enfrentando oposición del sector privado.

Este mercado se resolverá como SÍ si la reforma pensional propuesta por el gobierno Petro es aprobada por el Congreso de Colombia antes del 1 de junio de 2026.

Variables: apoyo en Congreso, movilización social, impacto en AFPs, y negociación política.`,
    category: 'politica',
    probability: 44,
    volume: '$5.9K',
    participants: 101,
    endDate: '2026-06-01',
    status: 'active',
    history: [
      { date: '2026-02-20', probability: 38 },
      { date: '2026-03-05', probability: 41 },
      { date: '2026-03-18', probability: 44 },
    ],
    relatedMarkets: ['12'],
  },

  // DEPORTES (5 mercados)
  {
    id: '17',
    title: 'Boca Juniors ganará el torneo argentino apertura 2026',
    description: `El fútbol argentino mantiene su pasión y competitividad. Boca Juniors, uno de los clubes más grandes, busca volver a la gloria tras años irregulares.

Resolución: SÍ si Boca Juniors es campeón del Torneo Apertura 2026 de la Liga Profesional de Fútbol Argentino (primera división).

Factores: refuerzos, continuidad de DT, lesiones, calendario, y rendimiento de rivales directos.`,
    category: 'deportes',
    probability: 22,
    volume: '$14.6K',
    participants: 289,
    endDate: '2026-06-30',
    status: 'active',
    history: [
      { date: '2026-02-01', probability: 20 },
      { date: '2026-02-15', probability: 20 },
      { date: '2026-03-01', probability: 21 },
      { date: '2026-03-18', probability: 22 },
    ],
    relatedMarkets: ['18'],
  },
  {
    id: '18',
    title: 'River Plate clasificará a cuartos de Libertadores 2026',
    description: `La Copa Libertadores es el torneo más prestigioso de Sudamérica. River Plate históricamente ha sido protagonista y busca extender su racha de clasificaciones.

Este mercado se resolverá como SÍ si River Plate clasifica a la fase de cuartos de final de la Copa Libertadores 2026.

Consideraciones: sorteo de grupos, lesiones clave, fixture local, y forma competitiva del equipo.`,
    category: 'deportes',
    probability: 64,
    volume: '$18.2K',
    participants: 341,
    endDate: '2026-08-15',
    status: 'active',
    history: [
      { date: '2026-02-10', probability: 60 },
      { date: '2026-02-24', probability: 62 },
      { date: '2026-03-10', probability: 63 },
      { date: '2026-03-18', probability: 64 },
    ],
    relatedMarkets: ['17', '19'],
  },
  {
    id: '19',
    title: 'Selección Argentina ganará Copa América 2024',
    description: `Argentina es la actual campeona del mundo y favorita para la Copa América 2024 que se disputa en Estados Unidos.

Resolución: SÍ si la Selección Argentina gana la final de la Copa América 2024.

Nota: Mercado histórico resuelto - ejemplo de evento pasado con alta probabilidad final.`,
    category: 'deportes',
    probability: 92,
    volume: '$45.7K',
    participants: 687,
    endDate: '2024-07-15',
    status: 'resolved',
    history: [
      { date: '2024-05-01', probability: 65 },
      { date: '2024-06-01', probability: 70 },
      { date: '2024-06-20', probability: 75 },
      { date: '2024-07-01', probability: 82 },
      { date: '2024-07-14', probability: 92 },
    ],
    relatedMarkets: ['18'],
  },
  {
    id: '20',
    title: 'Argentina clasificará al Mundial 2026 en top 3 de Sudamérica',
    description: `Las Eliminatorias Sudamericanas para el Mundial 2026 están en curso. Argentina, como campeona del mundo, busca clasificar con comodidad.

Resolución: SÍ si Argentina termina en las primeras 3 posiciones de la tabla de Eliminatorias CONMEBOL para el Mundial 2026.

Factores: rendimiento de Scaloni, lesiones, calendario, altura de La Paz, y forma de Brasil.`,
    category: 'deportes',
    probability: 85,
    volume: '$22.4K',
    participants: 398,
    endDate: '2025-11-20',
    status: 'active',
    history: [
      { date: '2026-01-10', probability: 82 },
      { date: '2026-02-01', probability: 83 },
      { date: '2026-03-01', probability: 84 },
      { date: '2026-03-18', probability: 85 },
    ],
    relatedMarkets: ['19'],
  },
  {
    id: '21',
    title: 'Brasileño ganará el Balón de Oro 2026',
    description: `Brasil, históricamente potencia futbolística, no tiene un ganador del Balón de Oro desde Kaká en 2007. Vinicius Jr y otros talentos buscan romper la sequía.

Este mercado se resolverá como SÍ si un jugador de nacionalidad brasileña gana el Balón de Oro 2026 (entregado en octubre/noviembre 2026).

Candidatos principales: Vinicius Jr, Rodrygo, y emergentes. Factores: Champions League, Mundial clubes, estadísticas individuales.`,
    category: 'deportes',
    probability: 31,
    volume: '$16.8K',
    participants: 245,
    endDate: '2026-11-30',
    status: 'active',
    history: [
      { date: '2026-01-20', probability: 28 },
      { date: '2026-02-15', probability: 29 },
      { date: '2026-03-05', probability: 30 },
      { date: '2026-03-18', probability: 31 },
    ],
    relatedMarkets: [],
  },

  // TECNOLOGÍA (4 mercados)
  {
    id: '22',
    title: 'Mercado Libre superará capitalización de U$S 100B en 2026',
    description: `Mercado Libre es el gigante tech de América Latina. Su capitalización bursátil ha crecido exponencialmente, compitiendo con grandes del e-commerce global.

Resolución: SÍ si la capitalización de mercado de Mercado Libre (MELI) alcanza o supera los U$S 100 mil millones en cualquier cierre de mercado durante 2026.

Factores: expansión regional, fintech (Mercado Pago), logística, competencia, y condiciones macro de LatAm.`,
    category: 'tecnologia',
    probability: 56,
    volume: '$19.3K',
    participants: 276,
    endDate: '2026-12-31',
    status: 'active',
    history: [
      { date: '2026-01-15', probability: 48 },
      { date: '2026-02-01', probability: 51 },
      { date: '2026-02-20', probability: 53 },
      { date: '2026-03-15', probability: 56 },
    ],
    relatedMarkets: ['23'],
  },
  {
    id: '23',
    title: 'Habrá IPO de unicornio tech latinoamericano en 2026',
    description: `América Latina tiene varios unicornios tech (startups valuadas en +$1B). El mercado espera que alguno salga a bolsa en 2026, siguiendo los pasos de Mercado Libre y otros.

Este mercado se resolverá como SÍ si al menos un unicornio tech latinoamericano (con sede o fundación en LatAm) realiza su IPO en cualquier bolsa durante 2026.

Candidatos: Kavak, Nubank (si hace segunda oferta), Rappi, Ualá, otros. Factores: condiciones de mercado y valuaciones.`,
    category: 'tecnologia',
    probability: 38,
    volume: '$8.7K',
    participants: 162,
    endDate: '2026-12-31',
    status: 'active',
    history: [
      { date: '2026-01-20', probability: 32 },
      { date: '2026-02-10', probability: 34 },
      { date: '2026-03-01', probability: 36 },
      { date: '2026-03-18', probability: 38 },
    ],
    relatedMarkets: ['22', '24'],
  },
  {
    id: '24',
    title: 'Argentina lanzará satélite propio al espacio antes de 2027',
    description: `Argentina tiene tradición en tecnología espacial con CONAE y la empresa satelital INVAP. Existen proyectos de nuevos satélites de observación y comunicaciones.

Resolución: SÍ si Argentina (CONAE, INVAP u organismo estatal) lanza exitosamente al espacio un satélite de diseño y fabricación nacional antes del 1 de enero de 2027.

Proyectos en desarrollo: SAOCOM 2, satélites de comunicación, y proyectos de nanosatélites.`,
    category: 'tecnologia',
    probability: 42,
    volume: '$5.4K',
    participants: 98,
    endDate: '2026-12-31',
    status: 'active',
    history: [
      { date: '2026-02-01', probability: 38 },
      { date: '2026-02-20', probability: 40 },
      { date: '2026-03-10', probability: 41 },
      { date: '2026-03-18', probability: 42 },
    ],
    relatedMarkets: [],
  },
  {
    id: '25',
    title: 'Adopción de IA generativa en empresas LATAM superará 40%',
    description: `La inteligencia artificial generativa (ChatGPT, Claude, etc.) está transformando el trabajo. Este mercado evalúa la velocidad de adopción corporativa en América Latina.

Resolución: SÍ si según encuestas de consultoras reconocidas (McKinsey, Gartner, IDC), más del 40% de empresas medianas y grandes de LATAM reportan uso regular de IA generativa para Q4 2026.

Factores: costos, conectividad, capacitación, regulación, y casos de uso efectivos.`,
    category: 'tecnologia',
    probability: 61,
    volume: '$12.8K',
    participants: 217,
    endDate: '2027-01-31',
    status: 'active',
    history: [
      { date: '2026-01-10', probability: 52 },
      { date: '2026-02-05', probability: 55 },
      { date: '2026-03-01', probability: 58 },
      { date: '2026-03-18', probability: 61 },
    ],
    relatedMarkets: [],
  },

  // CRYPTO (3 mercados)
  {
    id: '26',
    title: 'Bitcoin superará U$S 100,000 antes de julio 2026',
    description: `Bitcoin ha mostrado ciclos alcistas cada 4 años coincidiendo con halvings. El halving 2024 generó expectativas de nuevo rally hacia máximos históricos.

Resolución: SÍ si el precio de Bitcoin (BTC/USD) alcanza o supera los U$S 100,000 en cualquier exchange mayor (promedio de Coinbase, Binance, Kraken) antes del 1 de julio de 2026.

Factores: halving 2024, adopción institucional, ETFs, regulación, macroeconomía global, y halving cycles.`,
    category: 'crypto',
    probability: 47,
    volume: '$31.5K',
    participants: 489,
    endDate: '2026-07-01',
    status: 'active',
    history: [
      { date: '2026-01-15', probability: 38 },
      { date: '2026-02-01', probability: 41 },
      { date: '2026-02-20', probability: 44 },
      { date: '2026-03-10', probability: 46 },
      { date: '2026-03-18', probability: 47 },
    ],
    relatedMarkets: ['27'],
  },
  {
    id: '27',
    title: 'Argentina regulará oficialmente el uso de criptomonedas en 2026',
    description: `Argentina tiene alta adopción cripto debido a inestabilidad económica, pero carece de marco regulatorio claro. El gobierno debate regulación específica.

Este mercado se resolverá como SÍ si Argentina aprueba y promulga una ley específica de regulación de criptoactivos antes del 31 de diciembre de 2026.

Variables: presión de organismos internacionales (GAFI), prevención de lavado, recaudación fiscal, y lobby sectorial.`,
    category: 'crypto',
    probability: 53,
    volume: '$9.6K',
    participants: 178,
    endDate: '2026-12-31',
    status: 'active',
    history: [
      { date: '2026-01-25', probability: 45 },
      { date: '2026-02-15', probability: 48 },
      { date: '2026-03-05', probability: 51 },
      { date: '2026-03-18', probability: 53 },
    ],
    relatedMarkets: ['26', '28'],
  },
  {
    id: '28',
    title: 'Ethereum completará transición completa a proof-of-stake 2.0',
    description: `Ethereum completó "The Merge" en 2022, pero el roadmap incluye mejoras adicionales (sharding, danksharding) para escalabilidad y eficiencia.

Resolución: SÍ si Ethereum implementa exitosamente la siguiente fase mayor de upgrades (proto-danksharding o danksharding completo) antes de diciembre 2026.

Factores técnicos: desarrollo de EIPs, testing en testnets, consenso de comunidad, y complejidad de implementación.`,
    category: 'crypto',
    probability: 34,
    volume: '$14.2K',
    participants: 234,
    endDate: '2026-12-31',
    status: 'active',
    history: [
      { date: '2026-01-10', probability: 28 },
      { date: '2026-02-01', probability: 30 },
      { date: '2026-02-25', probability: 32 },
      { date: '2026-03-18', probability: 34 },
    ],
    relatedMarkets: ['26'],
  },
];

// Utility functions
export const getMarketById = (id: string): Market | undefined => {
  return markets.find((market) => market.id === id);
};

export const getMarketsByCategory = (category: string): Market[] => {
  return markets.filter((market) => market.category === category);
};

export const getActiveMarkets = (): Market[] => {
  return markets.filter((market) => market.status === 'active');
};

export const getResolvedMarkets = (): Market[] => {
  return markets.filter((market) => market.status === 'resolved');
};

export const getRelatedMarkets = (marketId: string): Market[] => {
  const market = getMarketById(marketId);
  if (!market) return [];

  return market.relatedMarkets
    .map((id) => getMarketById(id))
    .filter((m): m is Market => m !== undefined);
};

export const getTrendingMarkets = (limit: number = 6): Market[] => {
  return [...markets]
    .filter((m) => m.status === 'active')
    .sort((a, b) => parseInt(b.volume.replace(/[$K]/g, '')) - parseInt(a.volume.replace(/[$K]/g, '')))
    .slice(0, limit);
};
