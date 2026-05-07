import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const RANKS = [
  { name: "NHÀ KHOA HỌC NHÍ", min: 0, max: 250 },
  { name: "SỨ GIẢ CHÂN LÝ", min: 251, max: 500 },
  { name: "BẬC THẦY THỰC NGHIỆM", min: 501, max: 1000 },
  { name: "HÀN LÂM HỌC SĨ", min: 1001, max: 1500 },
  { name: "NHÀ KIẾN TẠO TINH HOA", min: 1501, max: 2000 },
  { name: "Học Giả Tinh Anh", min: 2001, max: 2500 },
  { name: "Vị Thần Tri Thức", min: 2501, max: Infinity }
];

export function getRank(xp: number) {
  return RANKS.find(r => xp >= r.min && xp <= r.max) || RANKS[0];
}

export const formatXP = (xp: number) => {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return xp.toString();
};

export const getLevel = (xp: number) => {
  const rank = getRank(xp);
  return { title: rank.name, color: "text-orange-600", bg: "bg-orange-100" };
};

export const processLaTeX = (text: string) => {
  if (!text) return "";
  
  // 1. Chuyển đổi các dấu bao công thức phổ biến về chuẩn $ và $$
  let processed = text
    .replace(/\\\[(.*?)\\\]/gs, '$$$$$1$$$$') // \[ ... \] -> $$...$$
    .replace(/\\\((.*?)\\\)/gs, '$$$1$$')     // \( ... \) -> $...$
    .replace(/\\begin\{equation\}(.*?)\\end\{equation\}/gs, '$$$$$1$$$$')
    .replace(/\\begin\{align\}(.*?)\\end\{align\}/gs, '$$$$$1$$$$');

  // 2. Xử lý các ký tự vật lý phổ biến thường bị AI viết thiếu dấu bao $
  // Ví dụ: \lambda, \mu, \Omega, \Delta, \pi, \rho, \phi, \sigma, \omega
  const greekLetters = ['lambda', 'mu', 'Omega', 'Delta', 'pi', 'rho', 'phi', 'sigma', 'omega', 'alpha', 'beta', 'gamma', 'theta'];
  greekLetters.forEach(letter => {
    // Chỉ bao lại nếu chưa có dấu $ bao quanh
    const regex = new RegExp(`(?<![\\$])\\\\${letter}(?![\\$])`, 'g');
    processed = processed.replace(regex, `$\\${letter}$`);
  });

  // 3. Xử lý các ký hiệu đơn vị vật lý có số mũ
  // m/s^2, kg.m/s, ...
  processed = processed.replace(/(\d+)\s*m\/s\^2(?![^\$]*\$)/g, '$1 $m/s^2$');
  processed = processed.replace(/(\d+)\s*m\/s(?![^\$]*\$)/g, '$1 $m/s$');

  // 4. Đảm bảo các dấu so sánh không bị Markdown hiểu lầm là tag HTML
  // (Nhưng phải cẩn thận không làm hỏng LaTeX)
  // Cách tốt nhất là bọc chúng trong $ $ nếu chúng ở giữa các số
  processed = processed.replace(/(\d+)\s*<\s*(\d+)/g, '$1 $<$ $2');
  processed = processed.replace(/(\d+)\s*>\s*(\d+)/g, '$1 $>$ $2');

  return processed;
};
