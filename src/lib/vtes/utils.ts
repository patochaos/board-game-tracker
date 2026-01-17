export function sortDisciplines(disciplines: string[]): string[] {
    if (!disciplines) return [];
    return disciplines.slice().sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}
