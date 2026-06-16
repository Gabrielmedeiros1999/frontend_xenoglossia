
export function registrarIdioma(nome: string) {
    const key = "idiomas_usados";
    const dados: Record<string, number> = JSON.parse(localStorage.getItem(key) || "{}");
    dados[nome] = (dados[nome] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(dados));
}

export function getIdiomaFavorito(): string {
    const dados: Record<string, number> = JSON.parse(localStorage.getItem("idiomas_usados") || "{}");
    if (Object.keys(dados).length === 0) return "Português";

    return Object.entries(dados).sort((a, b) => b[1] - a[1])[0][0];
}