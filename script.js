const filterButtons = document.querySelectorAll(".filter-button");
const productCards = document.querySelectorAll(".product-card");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav-links");

filterButtons.forEach((button) => {
	button.addEventListener("click", () => {
		const selectedFilter = button.dataset.filter;
		filterButtons.forEach((filterButton) => {
			filterButton.setAttribute("aria-pressed", String(filterButton === button));
		});
		productCards.forEach((card) => {
			card.hidden = selectedFilter !== "todos" && card.dataset.category !== selectedFilter;
		});
	});
});

menuToggle.addEventListener("click", () => {
	const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
	menuToggle.setAttribute("aria-expanded", String(!isExpanded));
	menuToggle.setAttribute("aria-label", isExpanded ? "Abrir menú" : "Cerrar menú");
	navigation.classList.toggle("is-open", !isExpanded);
});

navigation.querySelectorAll("a").forEach((link) => {
	link.addEventListener("click", () => {
		navigation.classList.remove("is-open");
		menuToggle.setAttribute("aria-expanded", "false");
		menuToggle.setAttribute("aria-label", "Abrir menú");
	});
});

// ── Configuración ──
const SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS6hTGenHEZmisbCwHhr1r1kDPmazvKMWHmbs9rUDfd_Y-uA_f8zLvn8ahe1IVraqWXhqBcGGsTf9Sb/pub?gid=0&single=true&output=csv";

// Mapeo de fotos por modelo (editar según corresponda)
// FOTOS_EXACTOS: nombre exacto de la hoja → foto
// FOTOS: búsqueda parcial (si el modelo contiene la clave)
const FOTOS_EXACTOS = {};
const FOTOS = {
	"17 pro": "img/WhatsApp Image 2026-10-09 at 14.41.30.jpeg",
	"17": "img/WhatsApp Image 2026-10-09 at 14.41.30 (1).jpeg",
	"16 pro": "img/WhatsApp Image 2026-10-09 at 14.41.31.jpeg",
	"16": "img/WhatsApp Image 2026-10-09 at 14.41.30 (1).jpeg",
	"15 pro": "img/WhatsApp Image 2026-10-09 at 14.41.31.jpeg",
	"14 pro": "img/WhatsApp Image 2026-10-09 at 14.41.30.jpeg",
	"13 pro": "img/WhatsApp Image 2026-10-09 at 14.41.30 (1).jpeg",
	"13": "img/WhatsApp Image 2026-10-09 at 14.41.31.jpeg"
};

// ── Parser de CSV ──
function parseCSV(texto) {
	const lineas = texto.trim().split("\n");
	if (lineas.length < 2) return [];

	const headers = lineas[0].split(",").map((h) => h.trim().toLowerCase());
	return lineas.slice(1).map((linea) => {
		// Parser CSV simple que maneja comillas
		const valores = [];
		let actual = "";
		let enComillas = false;

		for (let i = 0; i < linea.length; i++) {
			const char = linea[i];
			if (char === '"') {
				enComillas = !enComillas;
			} else if (char === "," && !enComillas) {
				valores.push(actual.trim());
				actual = "";
			} else {
				actual += char;
			}
		}
		valores.push(actual.trim());

		const obj = {};
		headers.forEach((h, i) => {
			obj[h] = valores[i] || "";
		});
		return obj;
	}).filter((row) => row.nombre); // Filtrar filas vacías
}

// ── Cargar y renderizar productos usados desde Google Sheets ──
let usadosData = [];
let usadosFiltro = "todos";

function renderUsados() {
	const contenedor = document.getElementById("usados-list");
	if (!contenedor) return;

	const filtrados = usadosFiltro === "todos"
		? usadosData
		: usadosData.filter((p) => p.nombre === usadosFiltro);

	if (filtrados.length === 0) {
		contenedor.innerHTML = '<p class="usados-empty">No hay equipos con ese modelo.</p>';
		return;
	}

	contenedor.innerHTML = filtrados.map((producto) => {
		// Mapeo de nombres de color en español a hex
		const COLORES = {
			"naranja": "#ff8c00", "rojo": "#e74c3c", "azul": "#3498db",
			"verde": "#2ecc71", "amarillo": "#f1c40f", "negro": "#252525",
			"blanco": "#f1f0eb", "gris": "#95a5a6", "rosa": "#e5c9c6",
			"morado": "#9b59b6", "violeta": "#8e44ad", "celeste": "#a8d8ea",
			"turquesa": "#1abc9c", "dorado": "#e6c619", "plateado": "#c9c9c4",
			"beige": "#f5f5dc", "marron": "#8b5a2b", "borgona": "#792b42",
			"burdeos": "#792b42", "azul cielo": "#b5cddd", "azul noche": "#2a3040",
			"lavanda": "#c6bbd7", "salvia": "#a3ad9a", "coral": "#ff795b",
			"menta": "#98ff98", "arena": "#e6d9c0"
		};

		const resolverColor = (valor) => {
			const v = valor.trim().toLowerCase();
			if (COLORES[v]) return COLORES[v];
			return valor.trim();
		};

		const colores = (producto.colores || "")
			.split(",")
			.map((c) => c.trim())
			.filter(Boolean)
			.map((color) => `<i class="color-dot" style="background:${resolverColor(color)}" title="${color}"></i>`)
			.join("");

		const foto = (() => {
			const nombre = (producto.nombre || "").toLowerCase();
			if (FOTOS_EXACTOS[nombre]) return FOTOS_EXACTOS[nombre];
			// Búsqueda parcial: si el modelo contiene alguna clave del mapeo
			for (const [clave, path] of Object.entries(FOTOS)) {
				if (nombre.includes(clave.toLowerCase())) return path;
			}
			return "";
		})();
		const estadoClass = (producto.estado || "").toLowerCase().replace(/\s+/g, "-");
		const disponibilidad = (producto.disponibilidad || "disponible").toLowerCase().trim();
		const estaVendido = disponibilidad === "vendido";

		return `
			<div class="usado-item ${estaVendido ? "usado-item--vendido" : ""}">
				${foto ? `<img class="usado-img" src="${foto}" alt="${producto.nombre} ${producto.almacenamiento}" loading="lazy">` : ""}
				<div class="usado-info">
					<strong class="usado-nombre">${producto.nombre}</strong>
					<span class="usado-almacenamiento">${producto.almacenamiento}</span>
					<span class="usado-estado usado-estado--${estadoClass}">${producto.estado}</span>
					<span class="usado-disponibilidad usado-disponibilidad--${estaVendido ? "vendido" : "disponible"}">${estaVendido ? "Vendido" : "Disponible"}</span>
					<p class="usado-descripcion"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" class="battery-icon ${(producto.descripcion || "").includes("100%") ? "battery-icon--green" : ""}"><rect x="2" y="7" width="17" height="10" rx="2"/><path d="M21 10v4"/><rect x="4" y="9" width="5" height="6" rx="1" fill="currentColor" stroke="none"/></svg>${producto.descripcion || ""}</p>
					${colores ? `<div class="usado-colores">${colores}</div>` : ""}
				</div>
				<div class="usado-precio">
					<span class="usado-precio-valor">${producto.precio}</span>
					${!estaVendido ? `<a class="consult-link" href="https://wa.me/5493518149127?text=Hola%2C%20quiero%20consultar%20por%20el%20${encodeURIComponent(producto.nombre + " " + producto.almacenamiento + " (" + producto.estado + ")")}%20en%20Púlsar." target="_blank" rel="noopener noreferrer">Consultar <span aria-hidden="true">↗</span></a>` : '<span class="usado-vendido-badge">Vendido</span>'}
				</div>
			</div>
		`;
	}).join("");
}

function poblarFiltro() {
	const select = document.getElementById("usados-select");
	if (!select) return;

	// Modelos únicos sin repetir
	const modelos = [...new Set(usadosData.map((p) => p.nombre))];

	// Limpiar opciones (dejar solo "Todos")
	select.innerHTML = '<option value="todos">Todos los modelos</option>';
	modelos.forEach((modelo) => {
		const opt = document.createElement("option");
		opt.value = modelo;
		opt.textContent = modelo;
		select.appendChild(opt);
	});

	// Escuchar cambios
	select.addEventListener("change", () => {
		usadosFiltro = select.value;
		renderUsados();
	});
}

// ── Carrusel de precios (primeros 10 de la hoja) ──
function renderTicker() {
	const track = document.querySelector(".price-ticker-track");
	if (!track || usadosData.length === 0) return;

	const items = usadosData.slice(0, 10);
	// Duplicamos para que el loop sea fluido
	const html = [...items, ...items].map((p) =>
		`<span class="price-ticker-item">💰 <strong>${p.nombre} ${p.almacenamiento}</strong> ${p.precio}</span>`
	).join("");
	track.innerHTML = html;
}

async function cargarUsados() {
	const contenedor = document.getElementById("usados-list");
	if (!contenedor) return;

	try {
		const respuesta = await fetch(SHEETS_CSV_URL);
		if (!respuesta.ok) throw new Error("No se pudo cargar la hoja");
		const textoCSV = await respuesta.text();
		usadosData = parseCSV(textoCSV);

		if (usadosData.length === 0) {
			contenedor.innerHTML = '<p class="usados-empty">No hay equipos disponibles por ahora.</p>';
			return;
		}

		poblarFiltro();
		renderUsados();
		renderTicker();
	} catch (error) {
		contenedor.innerHTML = '<p class="usados-error">No se pudo cargar el listado. Verificá que la hoja sea pública.</p>';
		console.error("Error cargando Google Sheets:", error);
	}
}

cargarUsados();
