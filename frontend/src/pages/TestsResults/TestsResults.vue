<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import './TestsResults.css';

const resultados = ref([]);
const loading = ref(true);
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = [10, 50, 100];
const selectedMonth = ref('all');
const selectedSede = ref('all');

const fetchResultados = async () => {
  try {
    const response = await fetch('http://localhost:3000/resultados');
    const data = await response.json();
    resultados.value = data.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
  } catch (error) {
    console.error('Error fetching resultados:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchResultados();
});

watch(pageSize, () => {
  currentPage.value = 1;
});

watch(selectedMonth, () => {
  currentPage.value = 1;
});

watch(selectedSede, () => {
  currentPage.value = 1;
});

const getMonthKey = (fechaRaw) => {
  const fecha = new Date(String(fechaRaw).replace(' ', 'T'));
  if (isNaN(fecha.getTime())) return null;
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
};

const mesesDisponibles = computed(() => {
  const meses = new Set();
  resultados.value.forEach((r) => {
    const key = getMonthKey(r.fecha_hora);
    if (key) meses.add(key);
  });
  return Array.from(meses).sort().reverse();
});

const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split('-');
  const fecha = new Date(Number(year), Number(month) - 1, 1);
  const label = fecha.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const sedesDisponibles = computed(() => {
  const sedes = new Set();
  resultados.value.forEach((r) => {
    if (r.sede) sedes.add(r.sede);
  });
  return Array.from(sedes).sort();
});

const resultadosFiltrados = computed(() => {
  return resultados.value.filter((r) => {
    const matchMonth =
      selectedMonth.value === 'all' ||
      getMonthKey(r.fecha_hora) === selectedMonth.value;
    const matchSede =
      selectedSede.value === 'all' || r.sede === selectedSede.value;
    return matchMonth && matchSede;
  });
});

const promediosMes = computed(() => {
  const data = resultadosFiltrados.value;
  if (data.length === 0) return { velocidad: null, ping: null, nivel: null, count: 0 };

  const velocidades = data
    .map((r) => parseFloat(r.velocidad_bajada_mbps))
    .filter((v) => !isNaN(v));
  const pings = data
    .map((r) => parseFloat(r.ping_ms))
    .filter((v) => !isNaN(v));

  const promedio = (valores) =>
    valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;

  const velocidadPromedio = promedio(velocidades);

  return {
    velocidad: velocidadPromedio,
    ping: promedio(pings),
    nivel: getNivelFromVelocidad(velocidadPromedio),
    count: data.length,
  };
});

const summaryTitle = computed(() => {
  const parts = [];
  if (selectedMonth.value !== 'all') {
    parts.push(formatMonthLabel(selectedMonth.value));
  }
  if (selectedSede.value !== 'all') {
    parts.push(selectedSede.value);
  }
  if (parts.length === 0) return 'Resumen general (todos los meses y sedes)';
  return `Resumen de ${parts.join(' · ')}`;
});

const emptyFilterMessage = computed(() => {
  if (selectedMonth.value !== 'all' && selectedSede.value !== 'all') {
    return 'No hay resultados para el mes y la sede seleccionados.';
  }
  if (selectedMonth.value !== 'all') return 'No hay resultados para el mes seleccionado.';
  if (selectedSede.value !== 'all') return 'No hay resultados para la sede seleccionada.';
  return 'No hay resultados registrados.';
});

const isSedeHighlighted = (sede) =>
  selectedSede.value !== 'all' && sede === selectedSede.value;

const totalPages = computed(() =>
  Math.max(1, Math.ceil(resultadosFiltrados.value.length / pageSize.value))
);

const paginatedResultados = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return resultadosFiltrados.value.slice(start, start + pageSize.value);
});

const rangeStart = computed(() =>
  resultadosFiltrados.value.length === 0
    ? 0
    : (currentPage.value - 1) * pageSize.value + 1
);

const rangeEnd = computed(() =>
  Math.min(currentPage.value * pageSize.value, resultadosFiltrados.value.length)
);

const goToPage = (page) => {
  currentPage.value = Math.min(Math.max(1, page), totalPages.value);
};

const getNivelFromVelocidad = (velocidad) => {
  if (velocidad === null || isNaN(velocidad)) return 'N/A';
  if (velocidad < 20) return 'Baja';
  if (velocidad < 50) return 'Moderada';
  if (velocidad < 100) return 'Óptima';
  return 'Excelente';
};

const getStatusClass = (nivel) => {
  if (!nivel) return '';
  const n = nivel.toLowerCase();
  if (n.includes('excelente')) return 'status-excelent';
  if (n.includes('óptima') || n.includes('optima') || n.includes('buena')) return 'status-optime';
  if (n.includes('moderada') || n.includes('regular')) return 'status-moderate';
  if (n.includes('baja') || n.includes('mala')) return 'status-lower';
  return '';
};

const formatFechaParts = (fechaRaw) => {
  if (!fechaRaw) return { fecha: 'N/A', hora: '' };

  const fecha = new Date(String(fechaRaw).replace(' ', 'T'));
  if (isNaN(fecha.getTime())) return { fecha: fechaRaw, hora: '' };

  return {
    fecha: fecha.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    hora: fecha.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  };
};

const formatPromedio = (valor) => (valor === null ? '—' : valor.toFixed(2));
</script>

<template>
  <div class="resultados-view">
    <header class="resultados-header">
      <h1 class="resultados-title">Resultados de los Test</h1>
      <p class="results-order">Ordenados por tiempo de registro, del más reciente al más antiguo</p>
    </header>

    <div v-if="loading" class="loading-wrapper">
      <div class="spinner"></div>
      <p>Cargando resultados...</p>
    </div>

    <div v-else-if="resultados.length === 0" class="empty-wrapper">
      <p>No hay resultados registrados aún.</p>
    </div>

    <div v-else class="resultados-content">
      <div class="table-toolbar">
        <div class="toolbar-filters">
          <label
            class="filter-control"
            :class="{ 'filter-active': selectedMonth !== 'all' }"
          >
            <span class="filter-label">Mes</span>
            <select v-model="selectedMonth" class="filter-select filter-select--wide">
              <option value="all">Todos los meses</option>
              <option v-for="mes in mesesDisponibles" :key="mes" :value="mes">
                {{ formatMonthLabel(mes) }}
              </option>
            </select>
          </label>
          <label
            class="filter-control"
            :class="{ 'filter-active': selectedSede !== 'all' }"
          >
            <span class="filter-label">Sede</span>
            <select v-model="selectedSede" class="filter-select filter-select--wide">
              <option value="all">Todas las sedes</option>
              <option v-for="sede in sedesDisponibles" :key="sede" :value="sede">
                {{ sede }}
              </option>
            </select>
          </label>
          <label class="filter-control">
            <span class="filter-label">Filas por página</span>
            <select v-model.number="pageSize" class="filter-select">
              <option v-for="size in pageSizeOptions" :key="size" :value="size">
                {{ size }}
              </option>
            </select>
          </label>
        </div>
        <span class="results-count">
          Mostrando {{ rangeStart }}–{{ rangeEnd }} de {{ resultadosFiltrados.length }}
        </span>
      </div>

      <div v-if="promediosMes.count > 0" class="month-summary">
        <h2 class="month-summary-title">{{ summaryTitle }}</h2>
        <div class="month-summary-grid">
          <div class="summary-card">
            <span class="summary-label">Velocidad promedio</span>
            <strong class="summary-value">{{ formatPromedio(promediosMes.velocidad) }} Mbps</strong>
          </div>
          <div class="summary-card">
            <span class="summary-label">Ping promedio</span>
            <strong class="summary-value">{{ formatPromedio(promediosMes.ping) }} ms</strong>
          </div>
          <div class="summary-card">
            <span class="summary-label">Nivel promedio</span>
            <span class="status-badge summary-badge" :class="getStatusClass(promediosMes.nivel)">
              {{ promediosMes.nivel }}
            </span>
          </div>
          <div class="summary-card">
            <span class="summary-label">Total registros</span>
            <strong class="summary-value">{{ promediosMes.count }}</strong>
          </div>
        </div>
      </div>

      <div v-if="resultadosFiltrados.length === 0" class="empty-wrapper">
        <p>{{ emptyFilterMessage }}</p>
      </div>

      <template v-else>
        <div class="table-wrapper">
          <table class="resultados-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Sede</th>
                <th>Velocidad (Mbps)</th>
                <th>Ping (ms)</th>
                <th>Nivel</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="res in paginatedResultados"
                :key="res.id_monitoreo"
                :class="{ 'row-sede-highlight': isSedeHighlighted(res.sede) }"
              >
                <td class="fecha-cell">
                  <span class="fecha-dia">{{ formatFechaParts(res.fecha_hora).fecha }}</span>
                  <span class="fecha-hora">{{ formatFechaParts(res.fecha_hora).hora }}</span>
                </td>
                <td>{{ res.nom_usuario }}</td>
                <td :class="{ 'sede-cell-highlight': isSedeHighlighted(res.sede) }">
                  {{ res.sede || 'N/A' }}
                </td>
                <td>{{ res.velocidad_bajada_mbps }}</td>
                <td>{{ res.ping_ms }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(res.nivel_conexion)">
                    {{ res.nivel_conexion }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <nav class="pagination" aria-label="Paginación de resultados">
          <button
            type="button"
            class="pagination-btn"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            Anterior
          </button>
          <span class="pagination-info">
            Página {{ currentPage }} de {{ totalPages }}
          </span>
          <button
            type="button"
            class="pagination-btn"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Siguiente
          </button>
        </nav>
      </template>
    </div>
  </div>
</template>
