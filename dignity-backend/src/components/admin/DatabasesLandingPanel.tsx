'use client'
import { Button, Gutter, toast, useConfig } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

/**
 * Shown above the Databases list: the heading and introduction of the
 * website's Information → Databases page (the Databases Page global,
 * src/globals/DatabasesPage.ts), edited in place, so the page and the
 * databases listed on it are managed from one screen.
 */

type Texts = { title: string; titleAr: string; intro: string; introAr: string }

const empty: Texts = { title: '', titleAr: '', intro: '', introAr: '' }

const inputStyle = {
  width: '100%',
  padding: 'calc(var(--base) / 3) calc(var(--base) / 2)',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 'var(--style-radius-s)',
  background: 'var(--theme-input-bg)',
  color: 'var(--theme-elevation-800)',
  font: 'inherit',
}

function Input({
  label,
  value,
  onChange,
  rtl,
  multiline,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rtl?: boolean
  multiline?: boolean
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', marginBottom: 'calc(var(--base) / 4)' }}>{label}</span>
      {multiline ? (
        <textarea
          rows={4}
          dir={rtl ? 'rtl' : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      ) : (
        <input
          type="text"
          dir={rtl ? 'rtl' : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={inputStyle}
        />
      )}
    </label>
  )
}

export default function DatabasesLandingPanel() {
  const {
    config: {
      serverURL,
      routes: { api },
    },
  } = useConfig()
  const url = `${serverURL}${api}/globals/databases-page`
  const [texts, setTexts] = useState<Texts>(empty)
  const [saved, setSaved] = useState<Texts>(empty)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`${url}?depth=0`, { credentials: 'include' })
      .then((res) => res.json())
      .then((doc) => {
        const next = {
          title: doc.title ?? '',
          titleAr: doc.titleAr ?? '',
          intro: doc.intro ?? '',
          introAr: doc.introAr ?? '',
        }
        setTexts(next)
        setSaved(next)
      })
      .catch(() => toast.error('Could not load the Databases page text.'))
      .finally(() => setLoaded(true))
  }, [url])

  const set = (key: keyof Texts) => (value: string) => setTexts((t) => ({ ...t, [key]: value }))
  const changed = (Object.keys(texts) as (keyof Texts)[]).some((k) => texts[k] !== saved[k])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(texts),
      })
      if (!res.ok) throw new Error()
      setSaved(texts)
      toast.success('Databases page saved.')
    } catch {
      toast.error('Could not save the Databases page text.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Gutter>
      <section
        style={{
          margin: 'var(--base) 0 calc(var(--base) * 1.5)',
          padding: 'var(--base)',
          border: '1px solid var(--theme-elevation-100)',
          borderRadius: 'var(--style-radius-m)',
          background: 'var(--theme-elevation-50)',
        }}
      >
        <h3 style={{ margin: 0 }}>The Databases page</h3>
        <p style={{ margin: 'calc(var(--base) / 4) 0 var(--base)', color: 'var(--theme-elevation-500)' }}>
          The heading and introduction at the top of Information → Databases on the website, above
          the databases listed below. Leave the title empty to keep “Databases”.
        </p>
        <fieldset disabled={!loaded || saving} style={{ border: 0, padding: 0, margin: 0 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))',
              gap: 'var(--base)',
            }}
          >
            <Input label="Title (English)" value={texts.title} onChange={set('title')} />
            <Input label="Title (Arabic)" value={texts.titleAr} onChange={set('titleAr')} rtl />
            <Input
              label="Introduction (English)"
              value={texts.intro}
              onChange={set('intro')}
              multiline
            />
            <Input
              label="Introduction (Arabic)"
              value={texts.introAr}
              onChange={set('introAr')}
              rtl
              multiline
            />
          </div>
        </fieldset>
        <div style={{ marginTop: 'var(--base)' }}>
          <Button buttonStyle="primary" disabled={!changed || saving} onClick={save} margin={false}>
            {saving ? 'Saving…' : 'Save page text'}
          </Button>
        </div>
      </section>
    </Gutter>
  )
}
