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
async function cargarUsados() {
	const contenedor = document.getElementById("usados-list");
	if (!contenedor) return;

	try {
		const respuesta = await fetch(SHEETS_CSV_URL);
		if (!respuesta.ok) throw new Error("No se pudo cargar la hoja");
		const textoCSV = await respuesta.text();
		const filas = parseCSV(textoCSV);

		if (filas.length === 0) {
			contenedor.innerHTML = '<p class="usados-empty">No hay equipos disponibles por ahora.</p>';
			return;
		}

		contenedor.innerHTML = filas.map((producto) => {
			const colores = (producto.colores || "")
				.split(",")
				.map((c) => c.trim())
				.filter(Boolean)
				.map((color) => `<i class="color-dot" style="background:${color}"></i>`)
				.join("");

			const estadoClass = (producto.estado || "").toLowerCase().replace(/\s+/g, "-");
			const disponibilidad = (producto.disponibilidad || "disponible").toLowerCase().trim();
			const estaVendido = disponibilidad === "vendido";

			return `
				<div class="usado-item ${estaVendido ? "usado-item--vendido" : ""}">
					<div class="usado-info">
						<strong class="usado-nombre">${producto.nombre}</strong>
						<span class="usado-almacenamiento">${producto.almacenamiento}</span>
						<span class="usado-estado usado-estado--${estadoClass}">${producto.estado}</span>
						<span class="usado-disponibilidad usado-disponibilidad--${estaVendido ? "vendido" : "disponible"}">${estaVendido ? "Vendido" : "Disponible"}</span>
						<p class="usado-descripcion">${producto.descripcion || ""}</p>
						${colores ? `<div class="usado-colores">${colores}</div>` : ""}
					</div>
					<div class="usado-precio">
						<span class="usado-precio-valor">${producto.precio}</span>
						${!estaVendido ? `<a class="consult-link" href="https://wa.me/5493518149127?text=Hola%2C%20quiero%20consultar%20por%20el%20${encodeURIComponent(producto.nombre + " " + producto.almacenamiento + " (" + producto.estado + ")")}%20en%20iTel." target="_blank" rel="noopener noreferrer">Consultar <span aria-hidden="true">↗</span></a>` : '<span class="usado-vendido-badge">Vendido</span>'}
					</div>
				</div>
			`;
		}).join("");
	} catch (error) {
		contenedor.innerHTML = '<p class="usados-error">No se pudo cargar el listado. Verificá que la hoja sea pública.</p>';
		console.error("Error cargando Google Sheets:", error);
	}
}

cargarUsados();
