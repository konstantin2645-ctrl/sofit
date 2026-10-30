/* eslint-disable @next/next/no-img-element */
/* next/image stand-in: serves an 800px WebP variant for bundled media via srcset. */
type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  sizes?: string;
};

export default function Image({ src, fill, priority, quality, sizes, style, loading, ...rest }: Props) {
  void quality;
  const m = src.match(/^(media\/[\w-]+)\.jpg$/);
  const full = src.startsWith("media/artist") ? 1000 : 1600;
  return (
    <img
      src={src}
      srcSet={m ? `${m[1]}-800.webp 800w, ${src} ${full}w` : undefined}
      sizes={m ? (sizes ?? "100vw") : undefined}
      loading={priority ? "eager" : (loading ?? "lazy")}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style}
      {...rest}
    />
  );
}
