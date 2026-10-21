import { describe, expect, it } from "vitest"
import { pickMainBackCamera } from "./camera"

const cams = (...labels: string[]) => labels.map((label, i) => ({ deviceId: `id-${i}`, label }))

const pick = (...labels: string[]) => {
  const devices = cams(...labels)
  const id = pickMainBackCamera(devices)
  return devices.find((d) => d.deviceId === id)?.label
}

describe("pickMainBackCamera", () => {
  it("iPhone Pro (inglês): ignora ultrawide, dual wide, triple e tele", () => {
    expect(
      pick(
        "Front Camera",
        "Back Ultra Wide Camera",
        "Back Dual Wide Camera",
        "Back Triple Camera",
        "Back Telephoto Camera",
        "Back Camera"
      )
    ).toBe("Back Camera")
  })

  it("iPhone Pro (pt-BR): 'Ultra-angular' não é a principal", () => {
    expect(
      pick(
        "Câmera Frontal",
        "Câmera Ultra-angular Traseira",
        "Câmera Grande-Angular Dupla Traseira",
        "Câmera Tripla Traseira",
        "Câmera Teleobjetiva Traseira",
        "Câmera Traseira"
      )
    ).toBe("Câmera Traseira")
  })

  it("Android Chrome: escolhe camera2 0 mesmo listada depois", () => {
    expect(pick("camera2 1, facing front", "camera2 2, facing back", "camera2 3, facing back", "camera2 0, facing back")).toBe(
      "camera2 0, facing back"
    )
  })

  it("Samsung + Chrome 155 ('camera N, facing back')", () => {
    expect(pick("camera 1, facing front", "camera 3, facing front", "camera 2, facing back", "camera 0, facing back")).toBe(
      "camera 0, facing back"
    )
  })

  it("funciona com objetos do navegador (deviceId/label como getters do protótipo)", () => {
    class FakeMediaDeviceInfo {
      #id: string
      #label: string
      constructor(id: string, label: string) {
        this.#id = id
        this.#label = label
      }
      get deviceId() {
        return this.#id
      }
      get label() {
        return this.#label
      }
    }
    const devices = [new FakeMediaDeviceInfo("ultra", "camera 2, facing back"), new FakeMediaDeviceInfo("main", "camera 0, facing back")]
    expect(pickMainBackCamera(devices)).toBe("main")
  })

  it("Android Firefox", () => {
    expect(pick("Camera 1, Facing front, Orientation 270", "Camera 2, Facing back, Orientation 90", "Camera 0, Facing back, Orientation 90")).toBe(
      "Camera 0, Facing back, Orientation 90"
    )
  })

  it("se só houver lentes 'especiais', prefere dual/triple a ultrawide", () => {
    expect(pick("Back Ultra Wide Camera", "Back Dual Wide Camera")).toBe("Back Dual Wide Camera")
  })

  it("sem rótulos (sem permissão) devolve undefined", () => {
    expect(pickMainBackCamera(cams("", ""))).toBeUndefined()
  })

  it("só câmera frontal / webcam devolve undefined", () => {
    expect(pickMainBackCamera(cams("Front Camera", "HD Webcam"))).toBeUndefined()
  })
})
