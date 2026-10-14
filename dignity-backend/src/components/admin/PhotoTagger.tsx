'use client'
import { useEffect, useState } from 'react'
import { useConfig, useField, useFormFields } from '@payloadcms/ui'

/** Where each tagged person sits on the photo, as percentages of its width and height. */
type Positions = Record<string, { x: number; y: number }>

const idOf = (value: unknown): string | null => {
  if (value && typeof value === 'object' && 'id' in value) return String(value.id)
  return value ? String(value) : null
}

/**
 * Facebook-style tagging on a Photos entry: the editor picks people in
 * "Tagged People" as before, then clicks a name here and clicks their face on
 * the photo. The spots are stored in the `tagPositions` JSON field, keyed by
 * participant id; a tagged person with no spot still counts as tagged and is
 * listed under the photo on the site instead.
 */
export default function PhotoTagger({ path }: { path: string }) {
  const { value, setValue } = useField<Positions | null>({ path })
  const imageId = useFormFields(([fields]) => idOf(fields.image?.value))
  const peopleKey = useFormFields(([fields]) => {
    const list = fields.taggedParticipants?.value
    return Array.isArray(list) ? list.map(idOf).filter(Boolean).join(',') : ''
  })
  const {
    config: { serverURL, routes },
  } = useConfig()
  const api = `${serverURL ?? ''}${routes.api}`

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [names, setNames] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)

  const peopleIds = peopleKey ? peopleKey.split(',') : []
  const positions: Positions = value && typeof value === 'object' ? value : {}

  useEffect(() => {
    if (!imageId) return setImageUrl(null)
    let cancelled = false
    fetch(`${api}/media/${imageId}?depth=0`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc) => !cancelled && setImageUrl(doc?.url ?? null))
      .catch(() => !cancelled && setImageUrl(null))
    return () => {
      cancelled = true
    }
  }, [api, imageId])

  useEffect(() => {
    if (!peopleKey) return
    let cancelled = false
    fetch(
      `${api}/participants?where[id][in]=${encodeURIComponent(peopleKey)}&depth=0&limit=200&draft=true`,
      { credentials: 'include' },
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.docs) return
        const found: Record<string, string> = {}
        for (const doc of data.docs) found[String(doc.id)] = doc.name || doc.nameAr || 'Unnamed'
        setNames(found)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [api, peopleKey])

  // Start on the first person still without a spot, so tagging a group is
  // just click-click-click on the faces.
  useEffect(() => {
    if (selected && peopleIds.includes(selected)) return
    setSelected(peopleIds.find((id) => !positions[id]) ?? peopleIds[0] ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peopleKey])

  const place = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!selected) return
    const box = event.currentTarget.getBoundingClientRect()
    const round = (n: number) => Math.round(Math.min(100, Math.max(0, n)) * 10) / 10
    const next = {
      ...positions,
      [selected]: {
        x: round(((event.clientX - box.left) / box.width) * 100),
        y: round(((event.clientY - box.top) / box.height) * 100),
      },
    }
    setValue(next)
    setSelected(peopleIds.find((id) => !next[id]) ?? selected)
  }

  const remove = (id: string) => {
    const next = { ...positions }
    delete next[id]
    setValue(Object.keys(next).length > 0 ? next : null)
    setSelected(id)
  }

  const muted = { color: 'var(--theme-elevation-500)', fontSize: 13, margin: 0 }

  return (
    <div className="field-type" style={{ marginBottom: 'var(--base)' }}>
      <label className="field-label">Place tags on the photo</label>
      {!imageId ? (
        <p style={muted}>Upload the photo first.</p>
      ) : peopleIds.length === 0 ? (
        <p style={muted}>
          Add people under “Tagged People” above, then place each one on the photo here.
        </p>
      ) : (
        <>
          <p style={{ ...muted, marginBottom: 'calc(var(--base) / 2)' }}>
            Click a name, then click on that person in the photo. Click again somewhere else to
            move them. People you don’t place are still tagged and listed under the photo.
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginBottom: 'calc(var(--base) / 2)',
            }}
          >
            {peopleIds.map((id) => {
              const isSelected = id === selected
              const isPlaced = Boolean(positions[id])
              return (
                <span
                  key={id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 999,
                    border: `1px solid ${isSelected ? 'var(--theme-success-500)' : 'var(--theme-elevation-200)'}`,
                    background: isSelected ? 'var(--theme-success-100)' : 'var(--theme-elevation-50)',
                    fontSize: 13,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(id)}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      padding: '4px 10px',
                    }}
                  >
                    {isPlaced ? '✓ ' : ''}
                    {names[id] ?? '…'}
                  </button>
                  {isPlaced && (
                    <button
                      type="button"
                      onClick={() => remove(id)}
                      title="Remove from the photo"
                      aria-label={`Remove ${names[id] ?? 'this person'} from the photo`}
                      style={{ all: 'unset', cursor: 'pointer', padding: '4px 10px 4px 2px' }}
                    >
                      ×
                    </button>
                  )}
                </span>
              )
            })}
          </div>
          {imageUrl && (
            <div
              onClick={place}
              style={{
                position: 'relative',
                display: 'inline-block',
                cursor: selected ? 'crosshair' : 'default',
                lineHeight: 0,
              }}
            >
              <img
                src={imageUrl}
                alt=""
                draggable={false}
                style={{ display: 'block', maxWidth: '100%', maxHeight: 520, userSelect: 'none' }}
              />
              {peopleIds.map((id) => {
                const spot = positions[id]
                if (!spot) return null
                return (
                  <span
                    key={id}
                    style={{
                      position: 'absolute',
                      left: `${spot.x}%`,
                      top: `${spot.y}%`,
                      // The dot (16px with its border) centres on the spot; the name hangs below.
                      transform: 'translate(-50%, -8px)',
                      pointerEvents: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      lineHeight: 1.2,
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: id === selected ? '#22c55e' : '#fff',
                        border: '2px solid rgba(0,0,0,0.6)',
                      }}
                    />
                    <span
                      style={{
                        marginTop: 4,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(0,0,0,0.75)',
                        color: '#fff',
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {names[id] ?? '…'}
                    </span>
                  </span>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
