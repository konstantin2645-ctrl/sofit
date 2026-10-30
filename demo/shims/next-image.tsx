/* eslint-disable @next/next/no-img-element */
type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  sizes?: string;
};

export default function Image({ src, fill, priority, quality, sizes, style, loading, ...rest }: Props) {
  void quality;
  void sizes;
  return (
    <img
      src={src}
      loading={priority ? "eager" : (loading ?? "lazy")}
      decoding="async"
      style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style}
      {...rest}
    />
  );
}
