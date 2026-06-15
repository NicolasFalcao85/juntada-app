export default function Avatar({ user, nombre, size = 'md' }) {
  const name = nombre || user?.displayName || '?'
  const initials = name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
  const photo = user?.photoURL

  const sizes = { sm: 28, md: 36, lg: 48 }
  const px = sizes[size] || 36
  const fontSize = px < 32 ? 11 : px < 44 ? 13 : 16

  const colors = ['#FF5C35', '#1D9E75', '#7F77DD', '#D85A30', '#185FA5', '#993556']
  const color = colors[name.charCodeAt(0) % colors.length]

  return (
    <div style={{ width: px, height: px, borderRadius: '50%', background: color + '22', border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize, fontWeight: 600, color, flexShrink: 0, overflow: 'hidden' }}>
      {photo ? <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
    </div>
  )
}
