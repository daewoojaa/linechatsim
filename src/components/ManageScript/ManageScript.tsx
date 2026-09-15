"use client";

import { useRouter } from "next/navigation";
import { useManageScript } from "@/hooks/useManageScript";
import { BackArrowIcon } from "@/components/icons/Icons";
import type { ScriptedMessage } from "@/lib/scriptedMessage";
import styles from "./ManageScript.module.css";

type Props = {
  roomId: string;
  title: string;
  backHref: string;
};

export default function ManageScript({ roomId, title, backHref }: Props) {
  const router = useRouter();
  const { script, addMessage, updateMessage, removeMessage, moveMessage } = useManageScript(roomId);

  const patch = (id: string, p: Partial<ScriptedMessage>) => updateMessage(id, p);

  return (
    <div className={styles.appShell}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} onClick={() => router.push(backHref)} title="กลับไปห้องแชท">
          <BackArrowIcon />
        </button>
        <div className={styles.title}>{title}</div>
      </div>

      <div className={styles.list}>
        {script.length === 0 && (
          <div className={styles.empty}>
            ยังไม่มีข้อความในสคริปต์ — กด &quot;+ เพิ่มข้อความ&quot; ด้านล่างเพื่อเริ่ม
          </div>
        )}

        {script.map((msg, i) => (
          <div className={styles.card} key={msg.id}>
            <div className={styles.cardTop}>
              <span className={styles.indexBadge}>{i + 1}</span>
              <select
                className={styles.kindSelect}
                value={msg.kind}
                onChange={(e) => patch(msg.id, { kind: e.target.value as ScriptedMessage["kind"] })}
              >
                <option value="text">ข้อความ</option>
                <option value="card">การ์ดลิงก์</option>
              </select>
              <div className={styles.spacer} />
              <button type="button" className={styles.iconBtn} onClick={() => moveMessage(msg.id, -1)} title="เลื่อนขึ้น">
                ↑
              </button>
              <button type="button" className={styles.iconBtn} onClick={() => moveMessage(msg.id, 1)} title="เลื่อนลง">
                ↓
              </button>
              <button type="button" className={styles.deleteBtn} onClick={() => removeMessage(msg.id)} title="ลบ">
                ×
              </button>
            </div>

            {msg.kind === "text" ? (
              <div className={styles.field}>
                <span className={styles.fieldLabel}>ข้อความ</span>
                <textarea
                  className={styles.fieldTextarea}
                  value={msg.text ?? ""}
                  onChange={(e) => patch(msg.id, { text: e.target.value })}
                  placeholder="เช่น เที่ยงนี้รวมพลบุกอบจ."
                />
              </div>
            ) : (
              <>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>ชื่อแอป/บริการ</span>
                  <input
                    className={styles.fieldInput}
                    value={msg.cardApp ?? ""}
                    onChange={(e) => patch(msg.id, { cardApp: e.target.value })}
                    placeholder="เช่น Spotify"
                  />
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>หัวข้อ</span>
                  <input
                    className={styles.fieldInput}
                    value={msg.cardTitle ?? ""}
                    onChange={(e) => patch(msg.id, { cardTitle: e.target.value })}
                    placeholder="เช่น ชื่อเพลง ดงชนรีมิกซ์ 3.1"
                  />
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>รายละเอียด</span>
                  <input
                    className={styles.fieldInput}
                    value={msg.cardSubtitle ?? ""}
                    onChange={(e) => patch(msg.id, { cardSubtitle: e.target.value })}
                    placeholder="เช่น ศิลปิน วงไข่มุกบารมี เศรษฐีพันล้าน"
                  />
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>ลิงก์</span>
                  <input
                    className={styles.fieldInput}
                    value={msg.cardUrl ?? ""}
                    onChange={(e) => patch(msg.id, { cardUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </>
            )}

            <div className={styles.row2}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>อ่านแล้ว (จาก)</span>
                <input
                  className={styles.fieldInput}
                  type="number"
                  value={msg.readFrom ?? ""}
                  onChange={(e) => patch(msg.id, { readFrom: e.target.value === "" ? undefined : Number(e.target.value) })}
                  placeholder="2"
                />
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>อ่านแล้ว (ถึง)</span>
                <input
                  className={styles.fieldInput}
                  type="number"
                  value={msg.readTo ?? ""}
                  onChange={(e) => patch(msg.id, { readTo: e.target.value === "" ? undefined : Number(e.target.value) })}
                  placeholder="12"
                />
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>เวลา</span>
                <input
                  className={styles.fieldInput}
                  value={msg.time ?? ""}
                  onChange={(e) => patch(msg.id, { time: e.target.value })}
                  placeholder="9.30"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className={styles.addButton} onClick={addMessage}>
        + เพิ่มข้อความ
      </button>
    </div>
  );
}
