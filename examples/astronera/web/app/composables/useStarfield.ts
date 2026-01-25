import { ref, onMounted } from 'vue'

export const useStarfield = (starCount = 60, shootingStarCount = 4) => {
  const stars = ref<{ id: number; style: Record<string, string> }[]>([])
  const shootingStars = ref<{ id: number; style: Record<string, string> }[]>([])
  const isClient = ref(false)

  onMounted(() => {
    isClient.value = true

    stars.value = Array.from({ length: starCount }, (_, i) => {
      const size = Math.random() * 2 + 1
      return {
        id: i,
        style: {
          width: `${size}px`,
          height: `${size}px`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          opacity: `${Math.random() * 0.8 + 0.2}`,
          transform: `translateZ(${(Math.random() - 0.5) * 30}px)`,
          animation: `twinkle ${Math.random() * 4 + 2}s ease-in-out infinite ${Math.random() * 2}s`,
        },
      }
    })

    shootingStars.value = Array.from({ length: shootingStarCount }, (_, i) => {
      return {
        id: i,
        style: {
          '--duration': `${Math.random() * 2 + 2}s`,
          '--delay': `${Math.random() * 15}s`,
          '--top': `${Math.random() * 50}%`,
          '--left': `${Math.random() * 100}%`,
        } as Record<string, string>,
      }
    })
  })

  return { stars, shootingStars, isClient }
}
