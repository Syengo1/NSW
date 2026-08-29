export interface GalleryItem {
  id: string;
  title: string;
  size: string;
  description: string;
  year: string;
  image: { src: string; width: number; height: number };
  layout: { width: number; top: string; left: string; parallaxEase: number };
}

export const galleryItems: GalleryItem[] = [
  {
    id: "house-fun-fact",
    title: "House Fun fact", //
    size: "12 x 6 inch C type hand print", //
    description: "Edition of 1 Plus and additional artist Proof", //
    year: "2024", //[cite: 7]
    image: { src: "https://framerusercontent.com/images/o02r0VlCbajYGWj3Rgyuj8cjDM.jpeg", width: 960, height: 1200 }, //[cite: 7]
    layout: { width: 244, top: "46%", left: "59%", parallaxEase: 0.6 }, //[cite: 7]
  },
  {
    id: "flower-power",
    title: "Flower Power", //[cite: 7]
    size: "12 x 6 inch C type hand print", //[cite: 7]
    description: "Edition of 1 Plus and additional artist Proof", //[cite: 7]
    year: "2024", //[cite: 7]
    image: { src: "https://framerusercontent.com/images/YgHjYbj1lO3sJbTMUIQ0eM6w.jpg", width: 1080, height: 1349 }, //[cite: 7]
    layout: { width: 212, top: "2%", left: "50%", parallaxEase: 0.8 }, //[cite: 7]
  },
  {
    id: "love-makes-you-crazy",
    title: "Love Makes Your Crazy", //[cite: 7]
    size: "12 x 6 inch C type hand print", //[cite: 7]
    description: "Edition of 1 Plus and additional artist Proof", //[cite: 7]
    year: "2024", //[cite: 7]
    image: { src: "https://framerusercontent.com/images/k5IzpaB0cZs1Fikmxi0SwvSMCA.jpg", width: 1080, height: 1350 }, //[cite: 7]
    layout: { width: 273, top: "61%", left: "72%", parallaxEase: 0.5 }, //[cite: 7]
  },
  {
    id: "blue-is-the-sky-color",
    title: "Blue Is The Sky Color", //[cite: 7]
    size: "12 x 6 inch C type hand print", //[cite: 7]
    description: "Edition of 1 Plus and additional artist Proof", //[cite: 7]
    year: "2024", //[cite: 7]
    image: { src: "https://framerusercontent.com/images/u1kPUKaC2qqQ2wIHuJ1XUGZkW9A.jpg", width: 5120, height: 5120 }, //[cite: 7]
    layout: { width: 238, top: "52%", left: "91%", parallaxEase: 0.9 }, //[cite: 7]
  },
  {
    id: "white-peace",
    title: "White Peace", //[cite: 7]
    size: "12 x 6 inch C type hand print", //[cite: 7]
    description: "Edition of 1 Plus and additional artist Proof", //[cite: 7]
    year: "2024", //[cite: 7]
    image: { src: "https://framerusercontent.com/images/rIH80XKFatVRxDAnttub9zDGBk.jpeg", width: 864, height: 802 }, //[cite: 7]
    layout: { width: 162, top: "12%", left: "21%", parallaxEase: 0.7 }, //[cite: 7]
  },
  {
    id: "lotus-flower-bnw",
    title: "Lotus Flower Bnw", //[cite: 7]
    size: "12 x 6 inch C type hand print", //[cite: 7]
    description: "Edition of 1 Plus and additional artist Proof", //[cite: 7]
    year: "2024", //[cite: 7]
    image: { src: "https://framerusercontent.com/images/lLWSt9aYqdDbVCMwisRBlpfXAz4.jpg", width: 3738, height: 3948 }, //[cite: 7]
    layout: { width: 143, top: "65%", left: "31%", parallaxEase: 0.4 }, //[cite: 7]
  },
  {
    id: "orange-is-the-new-black",
    title: "Orange Is The New Black", //[cite: 7]
    size: "12 x 6 inch C type hand print", //[cite: 7]
    description: "Edition of 1 Plus and additional artist Proof", //[cite: 7]
    year: "2024", //[cite: 7]
    image: { src: "https://framerusercontent.com/images/u3F21zAhsNEOjCugJhBXDTPkqk.jpg", width: 1125, height: 1401 }, //[cite: 7]
    layout: { width: 256, top: "81%", left: "19%", parallaxEase: 0.85 }, //[cite: 7]
  },
  {
    id: "bloom",
    title: "Bloom", //[cite: 7]
    size: "12 x 6 inch C type hand print", //[cite: 7]
    description: "Edition of 1 Plus and additional artist Proof", //[cite: 7]
    year: "2024", //[cite: 7]
    image: { src: "https://framerusercontent.com/images/uKOZxYCTM3hTbAVlnprVIjFo.jpeg", width: 736, height: 1041 }, //[cite: 7]
    layout: { width: 174, top: "34%", left: "3%", parallaxEase: 0.55 }, //[cite: 7]
  },
  {
    id: "pneumatici-pirelli",
    title: "Pneumatici Pirelli", //[cite: 7]
    size: "12 x 6 inch C type hand print", //[cite: 7]
    description: "Edition of 1 Plus", //[cite: 7]
    year: "2024", //[cite: 7]
    image: { src: "https://framerusercontent.com/images/5E4ljzKJKsZSJ5n9OoG57MtWZ5E.jpg", width: 766, height: 1067 }, //[cite: 7]
    layout: { width: 114, top: "24%", left: "83%", parallaxEase: 0.75 }, //[cite: 7]
  },
];