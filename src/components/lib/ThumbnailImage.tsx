import styles from "./ThumbnailImage.module.css";

export function ThumbnailImage({
	src,
	alt,
	placeholder,
	size = 6,
	aspectRatio = "1 / 1",
}: {
	src: string | null;
	alt: string;
	placeholder?: React.ReactNode;
	size?: number;
	aspectRatio?: `${number} / ${number}`;
}) {
	return (
		<div
			className={styles.thumbnail}
			style={{ width: `${size}rem`, aspectRatio }}
		>
			{src ? (
				<img src={src} alt={alt} />
			) : (
				<div className={styles.placeholder}>{placeholder}</div>
			)}
		</div>
	);
}
