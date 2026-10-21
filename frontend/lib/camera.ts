import { useEffect, useState } from "react"

type CameraInfo = Pick<MediaDeviceInfo, "deviceId" | "label">

const isBack = (label: string) => /back|rear|traseira|environment|facing back/i.test(label)

// Lentes que não são a principal: ultra-angular/macro distorcem, tele tem zoom,
// depth nem é câmera de foto
const HARD_PENALTY = /ultra|0[.,]5|macro|tele|depth|profundidade/i 

const SOFT_PENALTY = /wide|angular|dual|dupla|triple|tripla/i

function penalty(label: string): number {
  if (HARD_PENALTY.test(label)) return 2
  if (SOFT_PENALTY.test(label)) return 1
  return 0
}

// Normalmente ID 0 é câmera principal. Sem número (IOS) = Infinity (para ficar no fim da lista)
function androidIndex(label: string): number {
  const match = label.match(/camera2?\s*(\d+)/i)
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY
}

export function pickMainBackCamera(devices: CameraInfo[]): string | undefined {
  // Sem spread: em MediaDeviceInfo deviceId/label são getters do protótipo,
  // então { ...d } viria vazio
  const backCameras = devices
    .map((d, order) => ({ deviceId: d.deviceId, label: d.label, order }))
    .filter((d) => d.label && isBack(d.label))

  if (backCameras.length === 0) return undefined

  backCameras.sort(
    (a, b) =>
      penalty(a.label) - penalty(b.label) ||
      androidIndex(a.label) - androidIndex(b.label) ||
      a.order - b.order
  )

  return backCameras[0].deviceId
}

async function listVideoInputs(): Promise<MediaDeviceInfo[]> {
  const all = await navigator.mediaDevices.enumerateDevices()
  return all.filter((d) => d.kind === "videoinput")
}

/**
 * Resolve o deviceId da câmera traseira principal quando `enabled` fica true.
 * Os rótulos só vêm preenchidos depois da permissão, então, se estiverem vazios,
 * pede a permissão antes de escolher. `ready` só fica true depois disso, para
 * o Scanner não abrir antes na câmera padrão do sistema (que pode ser a ultrawide).
 */
export function useMainBackCamera(enabled: boolean): { deviceId: string | undefined; ready: boolean } {
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!enabled || ready) return
    let cancelled = false

    const resolve = async () => {
      try {
        let devices = await listVideoInputs()

        if (devices.every((d) => !d.label)) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
          })
          stream.getTracks().forEach((t) => t.stop())
          devices = await listVideoInputs()
        }

        if (!cancelled) setDeviceId(pickMainBackCamera(devices))
      } catch {
        // sem permissão -> sem câmera: o Scanner mostra o erro de permissão
      } finally {
        if (!cancelled) setReady(true)
      }
    }
    resolve()

    return () => {
      cancelled = true
    }
  }, [enabled, ready])

  return { deviceId, ready }
}
