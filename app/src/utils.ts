const N_IMGS = 20;
export const loadSvg = async (): Promise<HTMLImageElement[]> => {
  return new Promise((res) => {
    const htmlImageElements: HTMLImageElement[] = [];

    for (let x = 0; x < N_IMGS; x++) {
      const url = `/explosion_sprites/tile${String(x).padStart(3, "0")}.png`;
      const img = new Image();
      img.src = url;
      img.onload = () => {
        htmlImageElements.push(img);
        if (htmlImageElements.length === N_IMGS) res(htmlImageElements);
      };
    }
  });
};
