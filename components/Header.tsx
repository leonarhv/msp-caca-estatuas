import styles from "./Header.module.css";

interface Props {
  installedCount: number;
  totalCount: number;
  collectedCount: number;
}

export default function Header({
  installedCount,
  totalCount,
  collectedCount,
}: Props) {
  return (
    <header className={styles.top}>
      <div className={styles.row}>
        <h1 className={styles.title}>
          🐾 Caça Estátuas SP
          <span className={styles.sub}>
            mapa não-oficial • dados da promoção da Prefeitura
          </span>
        </h1>
        <div className={styles.actions}>
          <div className={styles.stats} aria-live="polite">
            <span className={styles.pill}>
              <span className={styles.dot} aria-hidden="true" />
              {installedCount}/{totalCount} instaladas
            </span>
            <span className={`${styles.pill} ${styles.pillYou}`}>
              ✓ {collectedCount}/{totalCount} coletadas por você
            </span>
          </div>
          <a
            className={styles.captureButton}
            href="https://cacaasestatuas.prefeitura.sp.gov.br/mapa"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Capturar estátua no site oficial (abre em nova aba)"
          >
            <span aria-hidden="true">📸</span>
            Capturar estátua
            <span className={styles.externalIcon} aria-hidden="true">
              ↗
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
