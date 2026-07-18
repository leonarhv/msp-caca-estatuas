const CHARACTER_IMAGE_BY_NAME: Record<string, string> = {
  "Astronauta": "/characters/astronauta.webp",
  "Bidu (Biduzidos)": "/characters/bidu.webp",
  "Cascão": "/characters/cascao.webp",
  "Cascão Toy": "/characters/cascao-toy.webp",
  "Cebolinha": "/characters/cebolinha.webp",
  "Cebolinha Toy": "/characters/cebolinha-toy.webp",
  "Chico Bento": "/characters/chico-bento.webp",
  "Do Contra": "/characters/do-contra.webp",
  "Dorinha": "/characters/dorinha.webp",
  "Floquinho (Biduzidos)": "/characters/floquinho.webp",
  "Franjinha": "/characters/franjinha.webp",
  "Horácio": "/characters/horacio.webp",
  "Jeremias": "/characters/jeremias.webp",
  "Jeremias Toy": "/characters/jeremias-toy.webp",
  "Jotalhão": "/characters/jotalhao.webp",
  "Louco": "/characters/louco.webp",
  "Magali": "/characters/magali.webp",
  "Magali Toy": "/characters/magali-toy.webp",
  "Marina": "/characters/marina.webp",
  "Milena": "/characters/milena.webp",
  "Milena Toy": "/characters/milena-toy.webp",
  "Mônica": "/characters/monica.webp",
  "Mônica Toy": "/characters/monica-toy.webp",
  "Nimbus": "/characters/nimbus.webp",
  "Paulistinha": "/characters/paulistinha.webp",
  "Penadinho": "/characters/penadinho.webp",
  "Rosinha": "/characters/rosinha.webp",
  "Zé Lelé": "/characters/ze-lele.webp",
};

export function characterImage(name: string): string | undefined {
  return CHARACTER_IMAGE_BY_NAME[name];
}
