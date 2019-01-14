
import styles from "./styles/index.css"
import template from "./audio-channel.html"

export class AudioChannel extends HTMLElement {
  static get observedAttributes() {
    return ["label", "min", "max", "step"]
  }

  get value() {
    return Number.parseFloat(this._faderNode.value) || 0
  }
  set value(value) {
    this._faderNode.value = Number.parseFloat(value) || 0
  }

  checkValue() {
    const newValue = Math.min(Math.max(this.min, this.value), this.max)
    if (this.value !== newValue) {
      this.value = newValue
      this.dispatchChangeEvent()
    }
  }

  get min() {
    return Number.parseFloat(this._faderNode.min) || 0
  }
  set min(value) {
    this._faderNode.min = Number.parseFloat(value) || 0
    this.checkValue()
  }

  get max() {
    return Number.parseFloat(this._faderNode.max) || 0
  }
  set max(value) {
    this._faderNode.max = Number.parseFloat(value) || 0
    this.checkValue()
  }

  get step() {
    return Number.parseFloat(this._faderNode.step) || 0
  }
  set step(value) {
    this._faderNode.step = Number.parseFloat(value) || 0
  }

  get solo() {
    return this._soloButton.getAttribute("aria-pressed") === "true"
  }
  set solo(value) {
    const newValue = Boolean(value)
    if (this.solo !== newValue) {
      this._soloButton.setAttribute("aria-pressed", String(newValue))
    }
  }

  get muted() {
    return this._muteButton.getAttribute("aria-pressed") === "true"
  }
  set muted(value) {
    const newValue = Boolean(value)
    if (this.mute !== newValue) {
      this._muteButton.setAttribute("aria-pressed", String(newValue))
    }
  }

  get level() {
    return Number.parseFloat(this._levelNode.style.getPropertyValue("--value")) || 0
  }
  set level(value) {
    window.requestAnimationFrame(()=>{
      const level = Math.min(Math.max(0, Number.parseFloat(value) || 0), 100)
      this._levelNode.style.setProperty("--value", level)
      this._levelNode.innerHTML = level
    })
  }

  dispatchChangeEvent(detail = "value") {
    this.dispatchEvent(new CustomEvent("change", { detail }))
  }

  constructor() {
    super()

    const root = this.attachShadow({ mode: "open" })
    root.innerHTML = `<style>${styles}</style>${template}`

    this._headerNode = root.getElementById("header")

    this._faderNode = root.getElementById("fader")
    this._faderNode.addEventListener("change", () => this.dispatchChangeEvent())
    this._faderNode.addEventListener("input", () => this.dispatchChangeEvent())

    this._soloButton = root.getElementById("solo")
    this._soloButton.addEventListener("click", () => {
      this.solo = !this.solo
      this.dispatchChangeEvent("solo")
    })

    this._muteButton = root.getElementById("mute")
    this._muteButton.addEventListener("click", () => {
      this.muted = !this.muted
      this.dispatchChangeEvent("muted")
    })

    this._levelNode = root.getElementById("level")
  }

  connectedCallback() {
    this.setAttribute("role", "region")
    this.setAttribute("aria-roledescription", "Channel")
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (newValue === oldValue) {
      return
    }

    switch(name) {
      case "label":
        this._headerNode.innerHTML = newValue
        this.setAttribute("aria-label", newValue)
        break

      case "min":
      case "max":
        this._faderNode.setAttribute(name, newValue)
        this.checkValue()
        break

      case "step":
        this._faderNode.setAttribute(name, newValue)
        break
    }
  }
}

customElements.define("audio-channel", AudioChannel)
