
import { AudioChannel } from "./audio-channel"
import Main from "./main"

const domReadyHandler = () => {
  document.removeEventListener('DOMContentLoaded', domReadyHandler)
  Main().catch(error => console.error(error))
}

switch (document.readyState) {
  case "loading":
    document.addEventListener('DOMContentLoaded', domReadyHandler)
    break
  case "interactive":
  case "complete":
  default:
    Main().catch(error => console.error(error))
}
