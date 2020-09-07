export const trimBy = (s: string, char: string) => {
	if (!s || s === "" || !char || char === "") return s;
    while (s.endsWith(char)) {
        s = s.substring(0, s.length - char.length)
    }
    while (s.startsWith(char)) {
        s = s.substring(char.length, s.length)
    }
	return s;
}