
export default async function() {

  // User action for activate AudioContext
  await new Promise(resolve => {
    const wrapper = document.getElementById("wrapper")
    if (window.PointerEvent) {
      wrapper.addEventListener("pointerdown", (event) => {
        event.preventDefault()
        resolve(wrapper)
      })
    } else {
      wrapper.addEventListener("touchstart", (event) => {
        event.preventDefault()
        resolve(wrapper)
      })

      wrapper.addEventListener("click", (event) => {
        event.preventDefault()
        resolve(wrapper)
      })
    }
  }).then(wrapper => wrapper.parentNode.removeChild(wrapper))

  const AudioContext = window.AudioContext || window.webkitAudioContext
  const audioContext = new AudioContext()

  let audioList = await Promise.all(
    Array.from(document.querySelectorAll("audio-channel[data-mp3]"))
    .map( async (channel) => {
      const response = await fetch(new Request(channel.dataset.mp3))
      const buffer = await response.arrayBuffer()

      const source = audioContext.createBufferSource()

      source.buffer = await (new Promise((resolve, reject) => {
        audioContext.decodeAudioData(buffer, buffer => resolve(buffer), error => reject(error))
      }))

      source.loop = true
      source.start(0)

      console.dir(source)

      return { channel, source }
    })
  ).catch(error => console.error(error))


  const channel = document.getElementById("mic")
  if (channel) {
    let stream = null

    try {
      stream = await navigator.mediaDevices.getUserMedia({ video:false, audio: true })
    } catch (_) {
      console.warn("Blocking microphone access")
    }

    if (stream) {
      const source = audioContext.createMediaStreamSource(stream)
      audioList.push({ channel, source })
    }
  }


  audioList.map(({channel, source}) => {
    const gainNode = audioContext.createGain()
    source.connect(gainNode)

    const analyser = audioContext.createScriptProcessor(1024, 1, 1)
    gainNode.connect(analyser)

    return {channel, source, gainNode, analyser}
  }).forEach(({channel, source, gainNode, analyser}, i, audioList) => {
      analyser.addEventListener("audioprocess", event => {
        const level = event.inputBuffer.getChannelData(0).reduce( (m, v) => Math.max(m, v), 0)
        channel.level = level * 100
      })



      channel.addEventListener("change", ({detail}) => {
        if (channel.solo) {
          audioList.forEach((a) => a.channel.solo = a.channel === channel)
        }

        let isSoloMode = audioList.some(({channel}) => channel.solo)

        if (detail === "solo") {
          audioList.forEach((a) =>
            a.gainNode.gain.value = a.channel.muted || isSoloMode && !a.channel.solo ? 0 : a.channel.value
          )
        } else {
          gainNode.gain.value = channel.muted || isSoloMode && !channel.solo ? 0 : channel.value
        }
      })

      gainNode.gain.value = channel.muted ? 0 : channel.value

      gainNode.connect(audioContext.destination)
      analyser.connect(audioContext.destination)
  })
}