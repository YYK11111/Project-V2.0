// @ts-nocheck
export function initFireworks(canvasId, speed, trail) {
  const canvas = document.getElementById(canvasId)
  const ctx = canvas.getContext('2d')

  function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  window.addEventListener('resize', resizeCanvas)
  resizeCanvas()

  // ========================
  // 🔊 内嵌 Base64 音效（无外部依赖）
  // ========================

  // 发射音效：0.3秒 上升正弦波 (200Hz → 800Hz)
  const LAUNCH_SOUND =
    'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUoGAACBhYqFfHl9g4aJiIaEg4aIioyNjIuKi4yOj5CRkpGSk5SVlpeYmZqbnJ2en6ChoqOkpaanqKmqq6ytrq+wsbKztLW2t7i5uru8vb6/wMHCw8TFxsfIycrLzM3Oz9DR0tPU1dbX2Nna29zd3t/g4eLj5OXm5+jp6uvs7e7v8PHy8/T19vf4+fr7/P3+/w=='

  // 爆炸音效：0.2秒 白噪声 + 低频脉冲
  const EXPLOSION_SOUND =
    'data:audio/wav;base64,UklGRiEGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRgGAABVVVdYWVpbXF1eX2BhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX5/gIGCg4SFhoeIiYqLjI2Oj5CRkpOUlZaXmJmam5ydnp+goaKjpKWmp6ipqqusra6vsLGys7S1tre4ubq7vL2+v8DBwsPExcbHyMnKy8zNzs/Q0dLT1NXW19jZ2tvc3d7f4OHi4+Tl5ufo6err7O3u7/Dx8vP09fb3+Pn6+/z9/v8='

  // 播放函数
  function playSound(base64Url, volume = 1) {
    const audio = new Audio(base64Url)
    audio.volume = volume
    // 浏览器要求用户交互后才能播放，这里通常由 click 触发，所以一般能播
    audio.play().catch((e) => console.log('Audio play blocked:', e.message))
  }

  // ========================
  // 🎇 动画逻辑（不变）
  // ========================

  class Particle {
    constructor(x, y, color) {
      this.x = x
      this.y = y
      this.color = color
      this.radius = Math.random() * 2 + 1
      this.velocity = { x: (Math.random() - 0.5) * 10, y: (Math.random() - 0.5) * 10 }
      this.alpha = 1
      this.decay = Math.random() * 0.03 + 0.015
    }
    draw() {
      ctx.save()
      ctx.globalAlpha = this.alpha
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
      ctx.fillStyle = this.color
      ctx.fill()
      ctx.restore()
    }
    update() {
      this.velocity.y += 0.1
      this.x += this.velocity.x
      this.y += this.velocity.y
      this.alpha -= this.decay
      this.draw()
      return this.alpha > 0
    }
  }

  class Firework {
    constructor(x, y) {
      playSound(EXPLOSION_SOUND, 0.7) // 播放爆炸声

      this.particles = []
      const hue = Math.floor(Math.random() * 360)
      const colors = [
        `hsl(${hue}, 100%, 60%)`,
        `hsl(${(hue + 30) % 360}, 100%, 60%)`,
        `hsl(${(hue + 60) % 360}, 100%, 60%)`,
      ]
      const particleCount = Math.floor(Math.random() * 100) + 80
      for (let i = 0; i < particleCount; i++) {
        this.particles.push(new Particle(x, y, colors[Math.floor(Math.random() * colors.length)]))
      }
    }
    update() {
      this.particles = this.particles.filter((p) => p.update())
      return this.particles.length > 0
    }
  }

  class Rocket {
    constructor(x, targetY) {
      this.x = x
      this.y = canvas.height
      this.targetY = targetY
      this.speed = -8 - Math.random() * 4
      this.radius = 2
      this.trail = []

      playSound(LAUNCH_SOUND, 0.6) // 播放发射声

      // 模拟升空呼啸（每300ms重复短音）
      this.flyInterval = setInterval(() => {
        if (this.y > this.targetY && this.y > 0) {
          playSound(LAUNCH_SOUND, 0.2)
        }
      }, 300)
    }

    draw() {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.restore()

      if (Math.random() < 0.7) {
        this.trail.push({
          x: this.x + (Math.random() - 0.5) * 4,
          y: this.y + Math.random() * 10 + 5,
          alpha: 1,
          decay: 0.05 + Math.random() * 0.05,
        })
      }

      for (let i = this.trail.length - 1; i >= 0; i--) {
        const t = this.trail[i]
        ctx.save()
        ctx.globalAlpha = t.alpha
        ctx.fillStyle = '#ff9'
        ctx.beginPath()
        ctx.arc(t.x, t.y, 1.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        t.alpha -= t.decay
        if (t.alpha <= 0) this.trail.splice(i, 1)
      }
    }

    update() {
      this.y += this.speed
      this.draw()
      return this.y > this.targetY && this.y > 0
    }

    explode() {
      clearInterval(this.flyInterval)
      return new Firework(this.x, this.y)
    }
  }

  let rockets = []
  let fireworks = []

  function launchRandomRocket() {
    if (Math.random() < 0.008) {
      const x = Math.random() * canvas.width
      const targetY = Math.random() * (canvas.height / 2)
      rockets.push(new Rocket(x, targetY))
    }
  }

  function launchRocketAt(x, y) {
    const safeY = Math.max(y, 100)
    rockets.push(new Rocket(x, safeY))
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    launchRocketAt(x, y)
  })

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    launchRocketAt(x, y)
  })

  function animate() {
    requestAnimationFrame(animate)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillStyle = document.documentElement.className.includes('dark')
      ? 'rgba(0, 0, 0, 0.1)'
      : 'rgba(255, 255, 255, 0.1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.globalCompositeOperation = 'source-over'

    for (let i = rockets.length - 1; i >= 0; i--) {
      const rocket = rockets[i]
      if (!rocket.update()) {
        fireworks.push(rocket.explode())
        rockets.splice(i, 1)
      }
    }

    fireworks = fireworks.filter((fw) => fw.update())
    launchRandomRocket()
  }

  animate()
}
