import type { Mission } from "@/types/mission";
import styles from "./MissionList.module.css";

interface Props {
  missions: Mission[];
}

const MISSION_ICON: Record<string, string> = {
  cacador_urbano: "🏙️",
  monica_especialista: "🐰",
  cacador_parques: "🌳",
  amigo_turma: "🤝",
  detetive_cebolino: "🔎",
  fuga_garoa: "🌧️",
  fome_magali: "🍉",
  plano_infalivel: "📅",
  coelhada_voadora: "💥",
  dona_avenida: "🏙️",
  campeao_turminha: "🏆",
  turma_limoeiro: "⭐",
  roteiro_louco: "🌀",
  turminha_ouro: "🥇",
  coracao_sao_paulo: "❤️",
  colecionador_toys: "🧸",
  explorador_extremos: "🧭",
};

export default function MissionList({ missions }: Props) {
  const unlocked = missions.filter((mission) => mission.unlocked).length;
  const totalPoints = missions.reduce((sum, mission) => sum + mission.points, 0);

  return (
    <section className={styles.missions} aria-labelledby="missions-heading">
      <div className={styles.summary}>
        <div>
          <span className={styles.eyebrow}>Seu progresso</span>
          <h3 id="missions-heading" className={styles.heading}>
            Missões
          </h3>
        </div>
        <div className={styles.summaryStats}>
          <span>{unlocked}/{missions.length} concluídas</span>
          <span>⭐ {totalPoints.toLocaleString("pt-BR")} pts disponíveis</span>
        </div>
      </div>

      <ul className={styles.list} aria-label="Lista de missões">
        {missions.map((mission) => {
          const current = Math.min(mission.progress.current, mission.progress.target);
          const percentage = mission.progress.target
            ? Math.round((current / mission.progress.target) * 100)
            : 0;

          return (
            <li
              key={mission.id}
              className={`${styles.card} ${mission.unlocked ? styles.unlocked : ""}`}
            >
              <div className={styles.icon} aria-hidden="true">
                {MISSION_ICON[mission.hook] ?? "🎯"}
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.title}>{mission.name}</h4>
                  <span className={styles.points}>+{mission.points} pts</span>
                </div>
                <p className={styles.description}>{mission.description}</p>
                <div className={styles.progressMeta}>
                  <span>{mission.unlocked ? "Concluída" : "Progresso"}</span>
                  <strong>{current}/{mission.progress.target}</strong>
                </div>
                <div
                  className={styles.progressTrack}
                  role="progressbar"
                  aria-label={`Progresso da missão ${mission.name}`}
                  aria-valuemin={0}
                  aria-valuemax={mission.progress.target}
                  aria-valuenow={current}
                >
                  <span style={{ width: `${percentage}%` }} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
